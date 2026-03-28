/**
 * Cloudinary Configuration
 * 
 * Initializes Cloudinary with environment variables.
 * Handles secure credential management.
 */

const cloudinary = require('cloudinary').v2;

/**
 * Initialize Cloudinary
 */
function initCloudinary() {
  const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  };

  // Validate required credentials
  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    console.warn('[Cloudinary] Missing credentials - SVG upload disabled');
    console.warn('[Cloudinary] Required env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
    return null;
  }

  cloudinary.config(config);
  console.log(`[Cloudinary] Initialized successfully (cloud: ${config.cloud_name})`);
  return cloudinary;
}

/**
 * Check if Cloudinary is configured
 */
function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Get Cloudinary instance
 */
function getCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary not configured - missing credentials');
  }
  return cloudinary;
}

module.exports = {
  initCloudinary,
  isCloudinaryConfigured,
  getCloudinary,
  cloudinary
};
