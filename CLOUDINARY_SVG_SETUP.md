# Cloudinary SVG Upload System

A production-ready SVG asset management system built with Cloudinary integration for the CBCT backend.

## Overview

This system provides:
- ✅ Secure SVG upload and storage via Cloudinary
- ✅ XSS protection through content sanitization
- ✅ Batch upload capabilities
- ✅ File validation and error handling
- ✅ Metadata tracking
- ✅ RESTful API endpoints

---

## 1. Setup & Configuration

### Step 1: Create Cloudinary Account

1. Go to https://cloudinary.com/
2. Sign up for a free account
3. Verify your email

### Step 2: Get Credentials

1. Go to your **Dashboard**: https://console.cloudinary.com/
2. Copy these values:
   - **Cloud Name** (under your profile)
   - **API Key** (under API Keys section)
   - **API Secret** (under API Keys section)

### Step 3: Configure Environment Variables

**Local Development (.env):**
```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Render Deployment:**
1. Go to Render Dashboard → Your Service → Settings
2. Add **Environment Variables**:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```
3. Save and Render will auto-redeploy

### Step 4: Verify Configuration

```bash
# Test the upload service
curl http://localhost:5000/api/upload/health

# Expected response:
{
  "status": "healthy",
  "cloudinary": "configured"
}
```

---

## 2. API Endpoints

### POST /api/upload/svg
Upload a single SVG file

**Request:**
```bash
curl -X POST http://localhost:5000/api/upload/svg \
  -F "file=@logo.svg" \
  -F "public_id=my-logo" \
  -F "folder=cbct/icons"
```

**Response:**
```json
{
  "success": true,
  "message": "SVG uploaded successfully",
  "data": {
    "public_id": "cbct/icons/my-logo",
    "secure_url": "https://res.cloudinary.com/...",
    "url": "http://res.cloudinary.com/...",
    "format": "svg",
    "bytes": 2048,
    "width": 256,
    "height": 256,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### POST /api/upload/svg/string
Upload SVG from raw string content

**Request:**
```bash
curl -X POST http://localhost:5000/api/upload/svg/string \
  -H "Content-Type: application/json" \
  -d '{
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\">...</svg>",
    "name": "generated-icon",
    "folder": "cbct/icons"
  }'
```

**Response:** Same as file upload

---

### POST /api/upload/svg/batch
Upload multiple SVG files at once

**Request:**
```bash
curl -X POST http://localhost:5000/api/upload/svg/batch \
  -F "files=@icon1.svg" \
  -F "files=@icon2.svg" \
  -F "files=@icon3.svg" \
  -F "folder=cbct/icons"
```

**Response:**
```json
{
  "success": true,
  "message": "Uploaded 3/3 SVGs",
  "data": {
    "successful": [
      {
        "filename": "icon1.svg",
        "success": true,
        "public_id": "cbct/icons/icon1",
        "secure_url": "https://res.cloudinary.com/..."
      }
    ],
    "failed": [],
    "total": 3,
    "successCount": 3,
    "failureCount": 0
  }
}
```

---

### GET /api/upload/svg/:public_id
Get SVG metadata

**Request:**
```bash
curl http://localhost:5000/api/upload/svg/cbct/icons/my-logo
```

**Response:**
```json
{
  "success": true,
  "data": {
    "public_id": "cbct/icons/my-logo",
    "secure_url": "https://res.cloudinary.com/...",
    "width": 256,
    "height": 256,
    "bytes": 2048,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### DELETE /api/upload/svg/:public_id
Delete SVG from Cloudinary

**Request:**
```bash
curl -X DELETE http://localhost:5000/api/upload/svg/cbct/icons/my-logo
```

**Response:**
```json
{
  "success": true,
  "message": "SVG deleted successfully",
  "data": {
    "result": "ok"
  }
}
```

---

### GET /api/upload/health
Check if upload service is available

**Response:**
```json
{
  "status": "healthy",
  "cloudinary": "configured"
}
```

---

## 3. Batch Upload Your Icons

### Using the Utility Script

```bash
# Upload from your local icons folder
cd server
node upload-svgs.js "../client/programming languages"
```

Expected output:
```
📁 SVG Batch Upload Utility
═══════════════════════════════════════

📂 Directory: /path/to/programming languages
📊 Found 15 SVG file(s)

Starting upload...

[1/15] Uploading bash.svg... ✅
[2/15] Uploading python.svg... ✅
...
[15/15] Uploading rust.svg... ✅

═══════════════════════════════════════
📊 Upload Summary
═══════════════════════════════════════

✅ Successful: 15
❌ Failed:     0
⏭️  Skipped:    0

📌 Uploaded Files:
   • bash.svg
     ID: language-bash
     URL: https://res.cloudinary.com/.../language-bash.svg
```

---

## 4. Security & Validation

### What Gets Sanitized?

The system automatically removes:
- `<script>` tags and content
- Event handlers (`onclick`, `onload`, etc.)
- JavaScript URLs (`javascript:`)
- `<iframe>`, `<embed>`, `<object>` tags
- XLink JavaScript references

### Validation Rules

- **File size**: Max 5MB
- **File extension**: Must end with `.svg`
- **MIME type**: Must be `image/svg+xml` or variation
- **Content**: Must have valid `<svg>` root element
- **Dangerous content**: All XSS patterns removed

### Example: Auto-Sanitized

**Input:**
```svg
<svg xmlns="http://www.w3.org/2000/svg">
  <script>alert('XSS')</script>
  <rect onclick="alert('click')" x="0" y="0"/>
</svg>
```

**Output (Sanitized):**
```svg
<svg xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0"/>
</svg>
```

---

## 5. File Structure

```
server/
├── src/
│   ├── config/
│   │   └── cloudinary.js           # Cloudinary initialization
│   ├── services/
│   │   ├── svgValidationService.js # Validation & sanitization
│   │   └── svgUploadService.js     # Upload logic
│   └── routes/
│       └── upload.js               # API endpoints
└── upload-svgs.js                  # Batch upload utility
```

---

## 6. Production Checklist

- [ ] Cloudinary account created
- [ ] Credentials added to environment variables
- [ ] Upload service tested locally (`/api/upload/health`)
- [ ] SVG files uploaded to Cloudinary
- [ ] API endpoints integrated into frontend
- [ ] Error handling tested
- [ ] Rate limiting considered (optional)

---

## 7. Usage Examples

### Node.js/Express

```javascript
// Import services
const { uploadSVGFile, deleteSVG } = require('./services/svgUploadService');

// In your route handlers
router.post('/my-upload', async (req, res) => {
  try {
    const result = await uploadSVGFile(req.file, {
      public_id: 'my-icon',
      folder: 'cbct/icons'
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### HTML Form Upload

```html
<form action="/api/upload/svg" method="POST" enctype="multipart/form-data">
  <input type="file" name="file" accept=".svg" required>
  <input type="text" name="public_id" placeholder="Custom name (optional)">
  <button type="submit">Upload SVG</button>
</form>
```

### JavaScript/Fetch

```javascript
const form = new FormData();
form.append('file', fileInput.files[0]);
form.append('public_id', 'my-icon');
form.append('folder', 'cbct/icons');

const response = await fetch('/api/upload/svg', {
  method: 'POST',
  body: form
});

const data = await response.json();
console.log('URL:', data.data.secure_url);
```

### React Example

```jsx
import { useState } from 'react';

function SVGUpload() {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    
    const form = new FormData();
    form.append('file', file);
    form.append('public_id', file.name.replace('.svg', ''));

    try {
      const res = await fetch('/api/upload/svg', {
        method: 'POST',
        body: form
      });
      const data = await res.json();
      setUrl(data.data.secure_url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" accept=".svg" onChange={handleUpload} disabled={uploading} />
      {url && <img src={url} alt="Uploaded" />}
    </div>
  );
}
```

---

## 8. Troubleshooting

### "Cloudinary not configured"

**Problem:** Service returns 503 error
**Solution:** Check that all environment variables are set:
```bash
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $CLOUDINARY_API_SECRET
```

### "Invalid SVG content"

**Problem:** Upload rejected as invalid SVG
**Solution:** Ensure SVG has root `<svg>` element:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- SVG content -->
</svg>
```

### "File size exceeds limit"

**Problem:** Upload rejected - file too large
**Solution:** Reduce file size (max 5MB) or optimize SVG:
```bash
# Using SVGO (npm install svgo)
svgo input.svg -o output.svg
```

### Upload Works Locally But Fails on Render

**Problem:** Works in dev but not on deployed server
**Solution:** Verify environment variables in Render dashboard

1. Go to Render → Service Settings → Environment Variables
2. Confirm all Cloudinary credentials are set
3. Re-deploy after adding variables

### Memory Issues with Large Batch Uploads

**Problem:** Server times out during bulk upload
**Solution:** 
- Upload in smaller batches (< 50 files at a time)
- Increase Render instance size
- Use the API endpoint for automated uploads

---

## 9. Performance Tips

### Optimize SVGs Before Upload

```bash
# Install SVGO
npm install -g svgo

# Optimize single file
svgo logo.svg

# Optimize directory
svgo -f ./icons
```

### Use Cloudinary Transformations

```javascript
// Resize on-the-fly
const url = cloudinary.url('cbct/icons/logo', {
  width: 128,
  height: 128,
  crop: 'fill'
});
```

### Caching

```javascript
// Return with cache headers
res.set('Cache-Control', 'public, max-age=31536000'); // 1 year
res.json(result);
```

---

## 10. Monitoring

### Check Upload Quota

```bash
# In Cloudinary Console
# Settings → Usage & Quota → View your limits
```

### Monitor Errors

```javascript
// In your logs
console.log('[SVG Upload] Success:', result.public_id);
console.error('[SVG Upload] Error:', error.message);
```

---

## Support

For issues with:
- **Cloudinary**: https://support.cloudinary.com/
- **SVG Validation**: Check sanitizeSVG function in `svgValidationService.js`
- **API Issues**: Enable logging in routes/upload.js

---

## License

Same as parent project (MIT)
