const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  uploadImage,
  deleteImage,
  extractImagesFromHtml,
  checkImageDeleteSafety
} = require('../controllers/imageController');
const { requireAdminAuth } = require('../middleware/adminAuthMiddleware');

// ─────────────────────────────────────────────────────────────────────
// Multer Configuration
// Stores files in memory before uploading to S3
// ─────────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME type at multer level
    const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(',');
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF allowed.'));
    }
  }
});

// ─────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────

// POST /api/images/upload
// Upload a single image to S3
// Form Data: image (file)
router.post('/upload', requireAdminAuth, upload.single('image'), uploadImage);

// GET /api/images/delete-check/:s3Key
// Dry-run check to know whether image can be deleted safely
router.get('/delete-check/:s3Key', requireAdminAuth, checkImageDeleteSafety);

// DELETE /api/images/:s3Key
// Delete an image from S3 by S3 key (URL-encoded)
router.delete('/:s3Key', requireAdminAuth, deleteImage);

// POST /api/images/extract-from-html
// Extract all S3 image URLs from HTML content
// Body: { html: "..." }
router.post('/extract-from-html', requireAdminAuth, extractImagesFromHtml);

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({
        success: false,
        message: 'File size exceeds limit'
      });
    }
  }
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  next();
});

module.exports = router;
