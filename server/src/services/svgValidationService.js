/**
 * SVG Validation & Sanitization Service
 * 
 * - Validates SVG structure and content
 * - Removes malicious content (script tags, event handlers)
 * - Sanitizes before upload to prevent XSS
 */

const fs = require('fs').promises;

/**
 * Configuration for SVG validation
 */
const SVG_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: ['image/svg+xml', 'application/svg+xml', 'text/svg'],
  SVG_FILE_EXTENSION: '.svg'
};

/**
 * Dangerous patterns and tags to remove from SVG
 */
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
  /on\w+\s*=\s*["'][^"']*["']/gi, // Event handlers (onclick, onload, etc)
  /on\w+\s*=\s*{[^}]*}/gi, // Event handlers with curly braces
  /javascript:/gi, // JavaScript protocol
  /<iframe/gi, // Iframe tags
  /<embed/gi, // Embed tags
  /<object/gi, // Object tags
  /xlink:href\s*=\s*["']javascript:/gi // XLink JavaScript
];

/**
 * Validate if content is valid SVG
 * @param {string} content - SVG content
 * @returns {boolean} - True if valid SVG
 */
function isValidSVGContent(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }

  // Check for SVG root element
  return /<svg\b[^>]*>/i.test(content);
}

/**
 * Sanitize SVG content by removing dangerous patterns
 * @param {string} content - SVG content
 * @returns {string} - Sanitized SVG content
 */
function sanitizeSVG(content) {
  let sanitized = content;

  // Remove all dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  return sanitized;
}

/**
 * Validate file size
 * @param {number} size - File size in bytes
 * @returns {{valid: boolean, error: string|null}}
 */
function validateFileSize(size) {
  if (size > SVG_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds limit (${SVG_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB)`
    };
  }
  return { valid: true, error: null };
}

/**
 * Validate MIME type
 * @param {string} mimeType - MIME type
 * @returns {{valid: boolean, error: string|null}}
 */
function validateMimeType(mimeType) {
  // Allow flexibility with MIME types
  const normalizedType = mimeType.toLowerCase();
  
  if (!normalizedType.includes('svg')) {
    return {
      valid: false,
      error: `Invalid MIME type: ${mimeType}. Expected: ${SVG_CONFIG.ALLOWED_MIME_TYPES.join(', ')}`
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate file extension
 * @param {string} filename - Filename
 * @returns {{valid: boolean, error: string|null}}
 */
function validateFileExtension(filename) {
  if (!filename.toLowerCase().endsWith(SVG_CONFIG.SVG_FILE_EXTENSION)) {
    return {
      valid: false,
      error: `Invalid file extension. Expected: ${SVG_CONFIG.SVG_FILE_EXTENSION}`
    };
  }

  return { valid: true, error: null };
}

/**
 * Comprehensive validation for SVG file upload
 * @param {Buffer|string} content - File content (buffer or string)
 * @param {Object} options - Validation options
 * @returns {{valid: boolean, error: string|null, sanitized: string|null}}
 */
function validateSVGContent(content, options = {}) {
  // Convert buffer to string if needed
  const contentStr = Buffer.isBuffer(content) 
    ? content.toString('utf-8') 
    : content;

  // Check if valid SVG
  if (!isValidSVGContent(contentStr)) {
    return {
      valid: false,
      error: 'Invalid SVG content - missing SVG root element',
      sanitized: null
    };
  }

  // Sanitize if requested
  const sanitized = options.skipSanitization ? contentStr : sanitizeSVG(contentStr);

  return {
    valid: true,
    error: null,
    sanitized
  };
}

/**
 * Validate complete SVG file (from upload)
 * @param {Object} file - Multer file object
 * @returns {{valid: boolean, errors: string[], sanitized: string|null}}
 */
function validateSVGFile(file) {
  const errors = [];

  // Validate file exists
  if (!file) {
    return {
      valid: false,
      errors: ['No file provided'],
      sanitized: null
    };
  }

  // Validate filename
  const filenameValidation = validateFileExtension(file.originalname);
  if (!filenameValidation.valid) {
    errors.push(filenameValidation.error);
  }

  // Validate MIME type
  const mimeValidation = validateMimeType(file.mimetype);
  if (!mimeValidation.valid) {
    errors.push(mimeValidation.error);
  }

  // Validate file size
  const sizeValidation = validateFileSize(file.size);
  if (!sizeValidation.valid) {
    errors.push(sizeValidation.error);
  }

  // Validate content
  const contentValidation = validateSVGContent(file.buffer);
  if (!contentValidation.valid) {
    errors.push(contentValidation.error);
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: contentValidation.sanitized || null
  };
}

/**
 * Validate SVG from string input
 * @param {string} svgString - SVG content as string
 * @returns {{valid: boolean, errors: string[], sanitized: string|null}}
 */
function validateSVGString(svgString) {
  const errors = [];

  // Check if string
  if (!svgString || typeof svgString !== 'string') {
    return {
      valid: false,
      errors: ['SVG string is required and must be a string'],
      sanitized: null
    };
  }

  // Validate content
  const validation = validateSVGContent(svgString);
  if (!validation.valid) {
    errors.push(validation.error);
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: validation.sanitized || null
  };
}

module.exports = {
  SVG_CONFIG,
  isValidSVGContent,
  sanitizeSVG,
  validateFileSize,
  validateMimeType,
  validateFileExtension,
  validateSVGContent,
  validateSVGFile,
  validateSVGString
};
