/**
 * SVG Upload Service
 * 
 * Handles uploading SVGs to Cloudinary with proper configuration
 * and metadata management.
 */

const { getCloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const { validateSVGFile, validateSVGString } = require('./svgValidationService');
const stream = require('stream');

/**
 * Configuration for Cloudinary uploads
 */
const UPLOAD_CONFIG = {
  resource_type: 'image', // SVG as image
  format: 'svg',
  flags: 'immutable', // Cache-friendly
  quality: 'auto',
  fetch_format: 'auto'
};

/**
 * Upload SVG file to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result with secure_url and public_id
 */
async function uploadSVGBuffer(buffer, options = {}) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary not configured');
  }

  const cloudinary = getCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        ...UPLOAD_CONFIG,
        public_id: options.public_id,
        folder: options.folder || 'cbct/icons',
        resource_type: 'image',
        format: 'svg',
        type: 'upload',
        overwrite: options.overwrite !== false
      },
      (error, result) => {
        if (error) {
          console.error('[SVG Upload] Error:', error.message);
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          console.log(`[SVG Upload] Success: ${result.public_id}`);
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            url: result.url,
            format: result.format,
            bytes: result.bytes,
            height: result.height,
            width: result.width,
            created_at: result.created_at,
            tags: result.tags || []
          });
        }
      }
    );

    // Pipe buffer to upload stream
    const bufferStream = stream.Readable.from([buffer]);
    bufferStream.pipe(uploadStream);
  });
}

/**
 * Upload SVG from string content
 * @param {string} svgString - SVG content
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result
 */
async function uploadSVGString(svgString, options = {}) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary not configured');
  }

  const cloudinary = getCloudinary();
  const buffer = Buffer.from(svgString, 'utf-8');

  return uploadSVGBuffer(buffer, options);
}

/**
 * Upload SVG from file (with validation)
 * @param {Object} file - Multer file object
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result with metadata
 */
async function uploadSVGFile(file, options = {}) {
  // Validate file
  const validation = validateSVGFile(file);
  
  if (!validation.valid) {
    const errorMsg = validation.errors.join('; ');
    console.warn('[SVG Upload] Validation failed:', errorMsg);
    throw new Error(`SVG validation failed: ${errorMsg}`);
  }

  // Use sanitized content if available
  const contentToUpload = validation.sanitized 
    ? Buffer.from(validation.sanitized, 'utf-8')
    : file.buffer;

  // Extract filename without extension for public_id
  const filename = options.public_id || 
    file.originalname.replace(/\.[^/.]+$/, '');

  return uploadSVGBuffer(contentToUpload, {
    ...options,
    public_id: filename
  });
}

/**
 * Delete SVG from Cloudinary by public_id
 * @param {string} public_id - Cloudinary public_id
 * @returns {Promise<Object>} - Deletion result
 */
async function deleteSVG(public_id) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary not configured');
  }

  const cloudinary = getCloudinary();

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(public_id, { resource_type: 'image' }, (error, result) => {
      if (error) {
        console.error('[SVG Delete] Error:', error.message);
        reject(new Error(`Cloudinary delete failed: ${error.message}`));
      } else {
        console.log(`[SVG Delete] Success: ${public_id}`);
        resolve(result);
      }
    });
  });
}

/**
 * Get SVG metadata from Cloudinary
 * @param {string} public_id - Cloudinary public_id
 * @returns {Promise<Object>} - Resource metadata
 */
async function getSVGMetadata(public_id) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary not configured');
  }

  const cloudinary = getCloudinary();

  return new Promise((resolve, reject) => {
    cloudinary.api.resource(public_id, { resource_type: 'image' }, (error, result) => {
      if (error) {
        console.error('[SVG Metadata] Error:', error.message);
        reject(new Error(`Failed to get metadata: ${error.message}`));
      } else {
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          url: result.url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          created_at: result.created_at,
          tags: result.tags || []
        });
      }
    });
  });
}

/**
 * Batch upload multiple SVGs
 * @param {Array} files - Array of Multer file objects
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} - Array of upload results
 */
async function batchUploadSVGs(files, options = {}) {
  if (!Array.isArray(files)) {
    throw new Error('Files must be an array');
  }

  const results = [];
  const errors = [];

  for (const file of files) {
    try {
      console.log(`[SVG Batch] Uploading ${file.originalname}...`);
      const result = await uploadSVGFile(file, options);
      results.push({
        filename: file.originalname,
        success: true,
        ...result
      });
    } catch (error) {
      console.error(`[SVG Batch] Error uploading ${file.originalname}:`, error.message);
      errors.push({
        filename: file.originalname,
        success: false,
        error: error.message
      });
    }
  }

  return {
    successful: results,
    failed: errors,
    total: files.length,
    successCount: results.length,
    failureCount: errors.length
  };
}

/**
 * Generate Cloudinary URL with optional transformations
 * @param {string} public_id - Cloudinary public_id
 * @param {Object} transformations - Transformation options
 * @returns {string} - Transformed URL
 */
function generateSVGUrl(public_id, transformations = {}) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary not configured');
  }

  const cloudinary = getCloudinary();

  return cloudinary.url(public_id, {
    resource_type: 'image',
    secure: true,
    ...transformations
  });
}

module.exports = {
  uploadSVGBuffer,
  uploadSVGString,
  uploadSVGFile,
  deleteSVG,
  getSVGMetadata,
  batchUploadSVGs,
  generateSVGUrl,
  UPLOAD_CONFIG
};
