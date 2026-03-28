#!/usr/bin/env node

/**
 * SVG Batch Upload Utility
 * 
 * Uploads all SVG files from a directory to Cloudinary
 * Usage: node upload-svgs.js [directory]
 * 
 * Example:
 *   node upload-svgs.js ./client/programming-languages
 *   node upload-svgs.js ./icons
 */

const fs = require('fs').promises;
const path = require('path');
const { initCloudinary, isCloudinaryConfigured } = require('./src/config/cloudinary');
const { uploadSVGFile } = require('./src/services/svgUploadService');

/**
 * Get all SVG files from a directory
 */
async function getSVGFiles(directory) {
  try {
    const files = await fs.readdir(directory);
    return files.filter(file => file.toLowerCase().endsWith('.svg'));
  } catch (error) {
    throw new Error(`Failed to read directory: ${error.message}`);
  }
}

/**
 * Read file into buffer
 */
async function readFileBuffer(filePath) {
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

/**
 * Upload SVGs from directory
 */
async function uploadSVGsFromDirectory(directory, options = {}) {
  console.log(`📁 SVG Batch Upload Utility`);
  console.log(`═══════════════════════════════════════\n`);

  // Validate Cloudinary configuration
  if (!isCloudinaryConfigured()) {
    console.error('❌ Cloudinary not configured');
    console.error('Required environment variables:');
    console.error('  - CLOUDINARY_CLOUD_NAME');
    console.error('  - CLOUDINARY_API_KEY');
    console.error('  - CLOUDINARY_API_SECRET');
    console.error('\nAdd these to your .env file or set them as environment variables');
    process.exit(1);
  }

  // Initialize Cloudinary
  initCloudinary();

  // Validate directory
  const resolvedDir = path.resolve(directory);
  console.log(`📂 Directory: ${resolvedDir}`);

  try {
    const stat = await fs.stat(resolvedDir);
    if (!stat.isDirectory()) {
      throw new Error('Path is not a directory');
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }

  // Get SVG files
  let svgFiles;
  try {
    svgFiles = await getSVGFiles(resolvedDir);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }

  if (svgFiles.length === 0) {
    console.warn('⚠️  No SVG files found in directory');
    process.exit(0);
  }

  console.log(`📊 Found ${svgFiles.length} SVG file(s)\n`);
  console.log(`Starting upload...\n`);

  // Upload files
  const results = {
    successful: [],
    failed: [],
    skipped: []
  };

  let fileIndex = 0;

  for (const filename of svgFiles) {
    fileIndex++;
    const filePath = path.join(resolvedDir, filename);
    const displayName = path.basename(filename, '.svg');

    process.stdout.write(
      `[${fileIndex}/${svgFiles.length}] Uploading ${filename}... `
    );

    try {
      // Read file buffer
      const buffer = await readFileBuffer(filePath);

      // Create mock Multer file object
      const mockFile = {
        originalname: filename,
        mimetype: 'image/svg+xml',
        size: buffer.length,
        buffer
      };

      // Upload
      const result = await uploadSVGFile(mockFile, {
        public_id: options.public_id ? options.public_id(displayName) : displayName,
        folder: options.folder || 'cbct/icons',
        overwrite: options.overwrite !== false
      });

      console.log('✅');
      results.successful.push({
        filename,
        public_id: result.public_id,
        url: result.secure_url
      });
    } catch (error) {
      console.log(`❌ ${error.message}`);
      results.failed.push({
        filename,
        error: error.message
      });
    }
  }

  // Print summary
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`📊 Upload Summary`);
  console.log(`═══════════════════════════════════════\n`);
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`❌ Failed:     ${results.failed.length}`);
  console.log(`⏭️  Skipped:    ${results.skipped.length}`);

  // Show successful uploads
  if (results.successful.length > 0) {
    console.log(`\n📌 Uploaded Files:`);
    results.successful.forEach(item => {
      console.log(`   • ${item.filename}`);
      console.log(`     ID: ${item.public_id}`);
      console.log(`     URL: ${item.url}`);
    });
  }

  // Show failed uploads
  if (results.failed.length > 0) {
    console.log(`\n⚠️  Failed Uploads:`);
    results.failed.forEach(item => {
      console.log(`   • ${item.filename}: ${item.error}`);
    });
  }

  console.log(`\n${'═'.repeat(50)}\n`);

  // Exit with appropriate code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

/**
 * Main entry point
 */
async function main() {
  // Get directory from command line or use default
  const directory = process.argv[2] || './client/programming languages';

  // Options
  const options = {
    folder: 'cbct/icons/languages',
    public_id: (name) => `language-${name.toLowerCase()}`,
    overwrite: true
  };

  await uploadSVGsFromDirectory(directory, options);
}

// Run
main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
