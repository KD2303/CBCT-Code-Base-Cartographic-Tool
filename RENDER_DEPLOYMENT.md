# Render Deployment Fix Guide

## Problem
The Render deployment was failing because:
1. Vite was not installed (it's in devDependencies but not being installed properly)
2. The build command was trying to build both client and server
3. Possible misconfiguration of the project root in Render

## Solution

### Step 1: Update Render Service Configuration

**IMPORTANT**: If you've already connected your Render service, you need to update the configuration:

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your **cbct-server** service
3. Click **Settings** in the left sidebar
4. Scroll to **Build & Deploy** section
5. Update the following:

   **Build Command:**
   ```
   npm install && npm run build:server
   ```

   **Start Command:**
   ```
   npm run start
   ```

6. Verify the **Root Directory** is set to the **root of your repository** (usually blank or `./`)
   - ❌ DO NOT set it to `./client` or `/src/client`
   - ✅ The root should point to where your `package.json` with workspaces is located

7. Click **Save** to apply changes
8. Render will **automatically redeploy** with the new configuration

### Step 2: Verify Environment Variables

Make sure these environment variables are set in Render:

1. In Render dashboard, go to **Environment** section
2. Verify these variables exist:
   ```
   NODE_ENV=production
   PORT=5000
   REDIS_URL=rediss://default:PASSWORD@HOST:PORT  (from Upstash)
   CORS_ORIGIN=https://your-vercel-frontend.vercel.app
   ```

### Step 3: Check Logs

After the redeploy:
1. Click **Logs** in Render dashboard
2. You should see:
   ```
   npm install
   npm run build:server
   npm run start
   ```
3. Look for any error messages
4. If successful, you should see: `CBCT Server is running on port 5000`

## What Changed

### New Files Added
- **`render.yaml`** - Official Render configuration file that ensures correct build setup

### Updated Scripts
- Added `build:server` script to `package.json` for server-only deployments
- Ensures devDependencies are installed during build

## Manual Git Push (if already deployed)

If render.yaml exists but Render hasn't detected it:

```bash
git add render.yaml package.json
git commit -m "fix: Add Render deployment configuration"
git push origin main
```

Render will automatically detect the `render.yaml` and apply the configuration.

## Troubleshooting

### Error: "vite: not found"
- ✅ **Fix**: Ensure `buildCommand` is `npm install && npm run build:server`
- Make sure devDependencies are being installed (they should be by default)

### Error: "cbct module not found"
- ✅ **Fix**: Ensure Root Directory is set to the repository root, not `./server`

### Health Check Failing
- ✅ **Fix**: Ensure your backend has a `/api/health` endpoint
- Check that `NODE_ENV` is set to `production`

### Redis Connection Error
- ✅ **Fix**: Verify `REDIS_URL` is correctly set in Render environment variables
- Test the URL: `rediss://default:password@host:port`

## Deployment Verification

Once deployed successfully:

```bash
# Check backend health
curl https://your-render-url.onrender.com/api/health

# Expected response:
{
  "status": "ok",
  "message": "CBCT Server is running",
  "cache": "connected"
}
```

## References
- [Render Deployment Documentation](https://render.com/docs)
- [Render Web Service Configuration](https://render.com/docs/web-services)
- [render.yaml Specification](https://render.com/docs/render-yaml-specification)
