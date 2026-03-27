# CBCT Deployment Checklist: Upstash + Render + Vercel

## ✅ Step 1: Upstash Redis Setup

- [ ] **Create Upstash Account**
  - Go to https://upstash.com/
  - Sign up with GitHub/Google
  - Create account (select region close to your users)

- [ ] **Create Redis Database**
  - Click "Create Database"
  - Name: `cbct-redis`
  - Region: Choose closest to Render (e.g., us-east-1 for US-based Render)
  - Click "Create"

- [ ] **Get Connection String**
  - Click your database
  - Go to "Connect" tab
  - Copy the **Redis URL** (starts with `rediss://`)
  - Format: `rediss://default:PASSWORD@HOST:PORT`
  - Save this securely (treat like API key)

## ✅ Step 2: Backend Deployment on Render

- [ ] **Create Render Account**
  - Go to https://render.com/
  - Sign up with GitHub
  - Authorize Render to access your repositories

- [ ] **Create Web Service**
  - Dashboard → New → Web Service
  - Connect your CBCT GitHub repository
  - Select branch: `main` or `develop`

- [ ] **Configure Service**
  - **Name**: `cbct-backend`
  - **Environment**: `Node`
  - **Build Command**: `cd server && npm install`
  - **Start Command**: `cd server && npm start`
  - **Region**: Same as Upstash (e.g., us-east-1)

- [ ] **Set Environment Variables**
  - Go to Environment section
  - Add these variables:
    ```
    NODE_ENV=production
    PORT=5000
    REDIS_URL=<paste-your-upstash-url-here>
    CORS_ORIGIN=<leave-blank-for-now-update-after-vercel-deployment>
    ```
  - Click "Save Changes"

- [ ] **Wait for Deployment**
  - Render will build and deploy automatically
  - Check logs to ensure no errors
  - Once live, copy your Render URL (e.g., `https://cbct-backend-xxxxx.onrender.com`)

## ✅ Step 3: Frontend Deployment on Vercel

- [ ] **Create Vercel Account**
  - Go to https://vercel.com/
  - Sign up with GitHub
  - Authorize Vercel to access repositories

- [ ] **Import Project**
  - Dashboard → Add New → Project
  - Select CBCT repository
  - Framework Preset: `Vite`

- [ ] **Configure Build Settings**
  - **Root Directory**: `client`
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`
  - **Install Command**: `npm install`

- [ ] **Set Environment Variables**
  - Go to Settings → Environment Variables
  - Add one variable:
    ```
    VITE_API_URL=<your-render-backend-url>/api
    ```
    Example: `https://cbct-backend-xxxxx.onrender.com/api`

- [ ] **Deploy**
  - Click "Deploy"
  - Wait for build to complete
  - Get your Vercel URL (e.g., `https://cbct.vercel.app`)

## ✅ Step 4: Update Render CORS

- [ ] **Go back to Render backend**
  - Dashboard → cbct-backend service
  - Settings → Environment Variables
  - Edit `CORS_ORIGIN` variable:
    ```
    CORS_ORIGIN=https://your-vercel-domain.vercel.app
    ```
  - Save → Service will redeploy automatically

## ✅ Step 5: Verify Deployment

### Local Verification

- [ ] **Install verification script dependencies**
  ```bash
  npm install
  ```

- [ ] **Run verification**
  ```bash
  node verify-deployment.js
  ```
  
  Or with custom URLs:
  ```bash
  BACKEND_URL=https://your-backend.onrender.com FRONTEND_URL=https://your-frontend.vercel.app node verify-deployment.js
  ```

### Manual Verification

- [ ] **Check Backend Health**
  ```bash
  curl https://cbct-backend-xxxxx.onrender.com/api/health
  ```
  
  Should return:
  ```json
  {
    "status": "ok",
    "message": "CBCT Server is running",
    "cache": "connected"
  }
  ```

- [ ] **Check Frontend**
  - Visit https://your-frontend.vercel.app
  - Open browser DevTools (F12)
  - Go to Network tab
  - Submit an analysis request
  - Verify API calls go to your Render URL (not localhost)

- [ ] **Check Cache Hits**
  - In Render logs, look for:
    ```
    [CACHE MISS] /path/to/repo
    [CACHE HIT] /path/to/repo
    ```
  - Run same analysis twice
  - Second time should show `[CACHE HIT]`

## ✅ Step 6: Monitor Production

### Upstash Monitoring
- [ ] Dashboard → Your database
- [ ] Monitor Commands: should see your analysis queries
- [ ] Monitor Memory: should show cache usage
- [ ] Set up alerts for high memory usage (optional)

### Render Monitoring
- [ ] Service page → Logs
- [ ] Look for Redis connection messages
- [ ] Monitor API response times
- [ ] Watch for errors in `/api/analysis` routes

### Vercel Monitoring
- [ ] Project Analytics
- [ ] Monitor API calls in Edge Functions logs
- [ ] Check build performance

## 🔒 Security Checklist

- [ ] **Environment Variables**
  - [ ] Never commit `.env` files to Git
  - [ ] All secrets (REDIS_URL) are in Vercel/Render only
  - [ ] Never paste tokens in code comments

- [ ] **CORS Protection**
  - [ ] CORS_ORIGIN set to specific Vercel domain (not wildcard)
  - [ ] Render backend only accessible from Vercel frontend

- [ ] **Redis Security**
  - [ ] Upstash defaults to password-protected (good!)
  - [ ] Don't share REDIS_URL publicly
  - [ ] Consider IP whitelist if available on your Upstash plan

## 📊 Cost Optimization

| Service | Free Tier | Monthly Cost |
|---------|-----------|--------------|
| **Vercel** | 100GB bandwidth | ~$0-20 (autoscaling) |
| **Render** | 750 hours/month | ~$7/month (always-on) |
| **Upstash** | 10K commands/day | ~$0 (free tier often sufficient) |

**Tips to stay free:**
- Keep Render on free tier if < 750 hours/month
- Use Upstash free tier for < 10K commands/day
- Vercel free tier is very generous

## 🚀 Next Steps After Deployment

1. **Update Documentation**
   - [ ] Document your deployed URLs
   - [ ] Update README with deployment links

2. **Notify Users**
   - [ ] Share frontend URL with users
   - [ ] Create onboarding guide for new deployment

3. **Set Up CI/CD Automation** (optional)
   - [ ] Enable auto-deployments when you push to main
   - [ ] Set up deployment notifications

4. **Monitor in Production**
   - [ ] Check logs daily first week
   - [ ] Monitor Upstash memory usage
   - [ ] Watch for API errors

## 🆘 Troubleshooting

### Backend returns "cache: disconnected"
- [ ] Check REDIS_URL in Render environment variables
- [ ] Verify URL format: `rediss://default:TOKEN@HOST:PORT`
- [ ] Check Upstash dashboard: is database running?
- [ ] Redeploy Render service after updating REDIS_URL

### Frontend can't reach backend API
- [ ] Check `VITE_API_URL` in Vercel environment
- [ ] Verify Render URL is correct (no trailing slashes)
- [ ] Check browser DevTools Network tab for actual API URL
- [ ] Verify CORS_ORIGIN in Render matches Vercel domain

### Slow API responses
- [ ] Check Upstash latency in dashboard
- [ ] Verify Render region matches Upstash region
- [ ] Monitor Render CPU/Memory in logs

### Database memory exceeded on Upstash
- [ ] Increase Upstash plan tier
- [ ] Or reduce cache TTL in `server/src/services/cacheService.js`:
  ```javascript
  export async function setCache(key, value, ttl = 1800) // 30 min instead of 1 hour
  ```

## 📞 Support Resources

| Issue | Resource |
|-------|----------|
| Upstash Redis | https://upstash.com/docs |
| Render Deployment | https://render.com/docs |
| Vercel Environment | https://vercel.com/docs/environment-variables |
| CBCT Architecture | See `ARCHITECTURE.md` |

---

**Last Updated**: March 28, 2026

**Deployment Status**: [ ] Complete
