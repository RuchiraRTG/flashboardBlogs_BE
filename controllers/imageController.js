/**
 * Image Upload Controller
 * Handles image uploads to AWS S3 and stores references in database
 * 
 * Flow: FE sends image -> BE validates -> uploads to S3 -> returns URL + metadata
 * Images can then be referenced in article content
 */

const { uploadToS3, deleteFromS3, extractS3KeyFromUrl } = require('../services/s3Service');
const Article = require('../models/ArticleModel');

const isValidS3Key = (s3Key) => s3Key && !s3Key.includes('..') && !s3Key.startsWith('/');

/**
 * POST /api/images/upload
 * Uploads a single image to S3
 * 
 * Request: FormData with 'image' field
 * Response: { success, url, fileName, s3Key, size }
 */
const uploadImage = async (req, res) => {
  try {
    // Multer middleware should have attached the file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Upload to S3
    const result = await uploadToS3(req.file, 'article-images');

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    // Return image metadata
    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.url,
        fileName: result.fileName,
        s3Key: result.s3Key,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
};

/**
 * DELETE /api/images/:s3Key
 * Deletes an image from S3 (URL-encoded S3 key in params)
 * 
 * Only allows deletion if the image was uploaded by current user (optional: add auth later)
 * Response: { success, message }
 */
const deleteImage = async (req, res) => {
  try {
    // S3 key comes URL-encoded in params, decode it
    const s3Key = decodeURIComponent(req.params.s3Key);

    if (!s3Key) {
      return res.status(400).json({
        success: false,
        message: 'No image key provided'
      });
    }

    // Security: Prevent path traversal attacks
    if (!isValidS3Key(s3Key)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image key'
      });
    }

    const result = await deleteFromS3(s3Key);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image'
    });
  }
};

/**
 * GET /api/images/delete-check/:s3Key
 * Dry-run delete check for image references.
 * Returns whether an image is referenced by any article and can be safely deleted.
 */
const checkImageDeleteSafety = async (req, res) => {
  try {
    const s3Key = decodeURIComponent(req.params.s3Key);

    if (!s3Key) {
      return res.status(400).json({
        success: false,
        message: 'No image key provided'
      });
    }

    if (!isValidS3Key(s3Key)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image key'
      });
    }

    const bucketBaseUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    const imageUrl = `${bucketBaseUrl}${s3Key}`;

    const linkedArticles = await Article.find(
      {
        $or: [
          { 'en.embeddedImages.s3Key': s3Key },
          { 'si.embeddedImages.s3Key': s3Key },
          { 'en.image': imageUrl },
          { 'si.image': imageUrl }
        ]
      },
      {
        slug: 1,
        'en.title': 1,
        'si.title': 1,
        _id: 0
      }
    );

    const references = linkedArticles.map((article) => ({
      slug: article.slug,
      enTitle: article.en?.title || null,
      siTitle: article.si?.title || null
    }));

    const canDelete = references.length === 0;

    res.status(200).json({
      success: true,
      data: {
        s3Key,
        imageUrl,
        canDelete,
        referenceCount: references.length,
        references,
        recommendation: canDelete ? 'Safe to delete' : 'Do not delete: image is still referenced'
      }
    });
  } catch (error) {
    console.error('Delete Check Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check image delete safety'
    });
  }
};

/**
 * POST /api/images/extract-from-html
 * Extracts all S3 image references from HTML body
 * Used to track which images are embedded in articles
 * 
 * Request: { html: "<p><img src='https://...'/></p>" }
 * Response: { success, images: [{ url, s3Key }] }
 */
const extractImagesFromHtml = async (req, res) => {
  try {
    const { html } = req.body;

    if (!html || typeof html !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'HTML content required'
      });
    }

    // Regex to find all S3 image URLs in HTML
    const s3UrlRegex = new RegExp(
      `https://${process.env.AWS_S3_BUCKET}\\.s3\\.${process.env.AWS_REGION}\\.amazonaws\\.com/[^"'\\s<>]+`,
      'g'
    );

    const urls = html.match(s3UrlRegex) || [];
    const images = urls.map((url) => ({
      url,
      s3Key: extractS3KeyFromUrl(url)
    }));

    res.json({
      success: true,
      images: images.filter((img) => img.s3Key) // Filter out any parsing errors
    });
  } catch (error) {
    console.error('Extract Images Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extract images'
    });
  }
};

module.exports = {
  uploadImage,
  deleteImage,
  extractImagesFromHtml,
  checkImageDeleteSafety
};
