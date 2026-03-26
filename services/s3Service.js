/**
 * AWS S3 Service Module
 * Handles secure image uploads to AWS S3 bucket
 * 
 * Security features:
 * - Environment-based configuration
 * - File type validation
 * - File size enforcement
 * - UUID-based file naming (prevents directory traversal)
 * - Error logging without exposing sensitive data
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Initialize S3 Client with credentials from environment
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB default
const ALLOWED_TYPES = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(',');

/**
 * Validates file before upload
 * @param {Object} file - Express multer file object
 * @returns {Object} { isValid: boolean, error: string or null }
 */
const validateFile = (file) => {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return { isValid: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds limit (${(MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB max)`
    };
  }

  return { isValid: true };
};

/**
 * Uploads file to AWS S3
 * @param {Object} file - Express multer file object { buffer, originalname, mimetype }
 * @param {string} folder - S3 folder path (optional, e.g., 'articles', 'topics')
 * @returns {Promise} { success: boolean, fileName: string, url: string, error: string }
 */
const uploadToS3 = async (file, folder = 'uploads') => {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Generate unique filename with original extension
    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const s3Key = `${folder}/${Date.now()}-${uniqueFileName}`;

    // Upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // Add metadata for tracking
      Metadata: {
        'original-filename': file.originalname,
        'upload-date': new Date().toISOString()
      }
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Construct public S3 URL
    const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    return {
      success: true,
      fileName: uniqueFileName,
      s3Key,
      url: s3Url
    };
  } catch (error) {
    console.error('S3 Upload Error:', error.message);
    return {
      success: false,
      error: 'Failed to upload image. Please try again.'
    };
  }
};

/**
 * Deletes file from AWS S3
 * @param {string} s3Key - Full S3 key path to delete
 * @returns {Promise} { success: boolean, error: string }
 */
const deleteFromS3 = async (s3Key) => {
  try {
    if (!s3Key) {
      return { success: false, error: 'No file key provided' };
    }

    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);

    return { success: true };
  } catch (error) {
    console.error('S3 Delete Error:', error.message);
    return {
      success: false,
      error: 'Failed to delete image from storage.'
    };
  }
};

/**
 * Extracts S3 key from full S3 URL
 * @param {string} s3Url - Full S3 URL
 * @returns {string} S3 key
 */
const extractS3KeyFromUrl = (s3Url) => {
  if (!s3Url) return null;
  // URL format: https://bucket.s3.region.amazonaws.com/key
  const regex = /\.amazonaws\.com\/(.+)$/;
  const match = s3Url.match(regex);
  return match ? match[1] : null;
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  validateFile,
  extractS3KeyFromUrl,
  ALLOWED_TYPES,
  MAX_FILE_SIZE
};
