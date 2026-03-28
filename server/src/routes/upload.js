/**
 * SVG Upload Routes
 * 
 * API endpoints for uploading, managing, and serving SVG assets.
 */

const express = require('express');
const multer = require('multer');
const { isCloudinaryConfigured } = require('../config/cloudinary');
const { 
  uploadSVGFile, 
  deleteSVG, 
  getSVGMetadata,
  batchUploadSVGs 
} = require('../services/svgUploadService');
const { validateSVGString } = require('../services/svgValidationService');

const router = express.Router();

/**
 * Configure multer for SVG file uploads
 * - Memory storage (fast for small files)
 * - Size limit: 5MB
 * - MIME type validation
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/svg+xml', 'application/svg+xml', 'text/svg'];
    
    if (!file.originalname.toLowerCase().endsWith('.svg')) {
      return cb(new Error('Only SVG files are allowed'));
    }
    
    if (!allowedMimes.includes(file.mimetype.toLowerCase())) {
      // Allow if filename is SVG even if MIME varies
      if (file.originalname.toLowerCase().endsWith('.svg')) {
        return cb(null, true);
      }
      return cb(new Error(`Invalid MIME type: ${file.mimetype}`));
    }
    
    cb(null, true);
  }
});

/**
 * POST /api/upload/svg
 * Upload single SVG file to Cloudinary
 * 
 * Request:
 * - multipart/form-data with 'file' field
 * - Optional: public_id (custom name)
 * 
 * Response:
 * - secure_url: HTTPS URL to SVG
 * - public_id: Cloudinary public ID
 * - metadata: width, height, bytes, etc
 */
router.post('/svg', upload.single('file'), async (req, res) => {
  try {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        error: 'SVG upload service not available',
        message: 'Cloudinary is not configured'
      });
    }

    // Validate file exists
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please upload an SVG file'
      });
    }

    console.log(`[API] SVG Upload: ${req.file.originalname}`);

    // Upload to Cloudinary
    const result = await uploadSVGFile(req.file, {
      public_id: req.body.public_id || null,
      folder: req.body.folder || 'cbct/icons'
    });

    return res.status(200).json({
      success: true,
      message: 'SVG uploaded successfully',
      data: result
    });
  } catch (error) {
    console.error('[API] SVG Upload Error:', error.message);
    
    return res.status(400).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

/**
 * POST /api/upload/svg/string
 * Upload SVG from raw string content
 * 
 * Request JSON:
 * {
 *   "svg": "<svg>...</svg>",
 *   "name": "my-icon",
 *   "folder": "cbct/icons"
 * }
 * 
 * Response: Same as file upload
 */
router.post('/svg/string', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        error: 'SVG upload service not available',
        message: 'Cloudinary is not configured'
      });
    }

    const { svg, name } = req.body;

    // Validate input
    const validation = validateSVGString(svg);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid SVG content',
        errors: validation.errors
      });
    }

    console.log(`[API] SVG String Upload: ${name || 'unnamed'}`);

    // Upload sanitized SVG
    const { uploadSVGString } = require('../services/svgUploadService');
    const result = await uploadSVGString(validation.sanitized, {
      public_id: name || null,
      folder: req.body.folder || 'cbct/icons'
    });

    return res.status(200).json({
      success: true,
      message: 'SVG uploaded successfully',
      data: result
    });
  } catch (error) {
    console.error('[API] SVG String Upload Error:', error.message);
    
    return res.status(400).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

/**
 * POST /api/upload/svg/batch
 * Upload multiple SVG files at once
 * 
 * Request:
 * - multipart/form-data with multiple 'files[]'
 * 
 * Response:
 * - successful: Array of successful uploads
 * - failed: Array of failed uploads
 * - summary: Statistics
 */
router.post('/svg/batch', upload.array('files', 50), async (req, res) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        error: 'SVG upload service not available',
        message: 'Cloudinary is not configured'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files provided',
        message: 'Please upload at least one SVG file'
      });
    }

    console.log(`[API] Batch SVG Upload: ${req.files.length} files`);

    // Batch upload
    const result = await batchUploadSVGs(req.files, {
      folder: req.body.folder || 'cbct/icons'
    });

    return res.status(200).json({
      success: true,
      message: `Uploaded ${result.successCount}/${result.total} SVGs`,
      data: result
    });
  } catch (error) {
    console.error('[API] Batch Upload Error:', error.message);
    
    return res.status(400).json({
      error: 'Batch upload failed',
      message: error.message
    });
  }
});

/**
 * GET /api/upload/svg/:public_id
 * Get SVG metadata from Cloudinary
 * 
 * Response:
 * - public_id
 * - secure_url
 * - width, height
 * - created_at
 */
router.get('/svg/:public_id', async (req, res) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        error: 'SVG service not available',
        message: 'Cloudinary is not configured'
      });
    }

    const { public_id } = req.params;

    if (!public_id) {
      return res.status(400).json({
        error: 'Missing public_id',
        message: 'SVG identifier is required'
      });
    }

    console.log(`[API] Get SVG metadata: ${public_id}`);

    const metadata = await getSVGMetadata(public_id);

    return res.status(200).json({
      success: true,
      data: metadata
    });
  } catch (error) {
    console.error('[API] Get Metadata Error:', error.message);
    
    return res.status(404).json({
      error: 'SVG not found',
      message: error.message
    });
  }
});

/**
 * DELETE /api/upload/svg/:public_id
 * Delete SVG from Cloudinary
 * 
 * Response:
 * - result: deletion status
 */
router.delete('/svg/:public_id', async (req, res) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        error: 'SVG service not available',
        message: 'Cloudinary is not configured'
      });
    }

    const { public_id } = req.params;

    if (!public_id) {
      return res.status(400).json({
        error: 'Missing public_id',
        message: 'SVG identifier is required'
      });
    }

    console.log(`[API] Delete SVG: ${public_id}`);

    const result = await deleteSVG(public_id);

    return res.status(200).json({
      success: true,
      message: 'SVG deleted successfully',
      data: result
    });
  } catch (error) {
    console.error('[API] Delete Error:', error.message);
    
    return res.status(500).json({
      error: 'Deletion failed',
      message: error.message
    });
  }
});

/**
 * GET /api/upload/health
 * Check if SVG upload service is available
 */
router.get('/health', (req, res) => {
  const configured = isCloudinaryConfigured();
  
  res.status(configured ? 200 : 503).json({
    status: configured ? 'healthy' : 'unavailable',
    cloudinary: configured ? 'configured' : 'not configured'
  });
});

module.exports = router;
