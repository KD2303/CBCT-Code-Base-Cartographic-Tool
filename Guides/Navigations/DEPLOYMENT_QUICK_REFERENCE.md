# CBCT Deployment Quick Reference

## Credential Template

**Store this safely (not in code/Git)**

```
=== UPSTASH ===
Account:   your-email@example.com
URL:       https://console.upstash.com/
REDIS_URL: rediss://default:TOKEN@HOST:PORT
Database:  cbct-redis

=== RENDER ===
Account:   your-email@example.com
URL:       https://render.com/
Service:   cbct-backend
Deploy URL: https://cbct-backend-XXXXX.onrender.com

=== VERCEL ===
Account:   your-email@example.com
URL:       https://vercel.com/
Project:   cbct
Frontend:  https://cbct.vercel.app
```

## Environment Variables Setup

### Render Backend (.env / Environment Variables)
```
NODE_ENV=production
PORT=5000
REDIS_URL=rediss://default:TOKEN@HOST:PORT
CORS_ORIGIN=https://cbct.vercel.app
```

### Vercel Frontend (Environment Variables)
```
VITE_API_URL=https://cbct-backend-XXXXX.onrender.com/api
```

## Critical URLs

| Service | URL |
|---------|-----|
| **Backend API** | `https://cbct-backend-XXXXX.onrender.com` |
| **Backend Health** | `https://cbct-backend-XXXXX.onrender.com/api/health` |
| **Frontend** | `https://cbct.vercel.app` |
| **Redis Console** | `https://console.upstash.com/` |
| **Render Dashboard** | `https://render.com/dashboard` |
| **Vercel Dashboard** | `https://vercel.com/dashboard` |

## Quick Verification

### Command 1: Check Backend Online
```bash
curl https://cbct-backend-XXXXX.onrender.com/api/health
```

### Command 2: Verify Cache Connected
```bash
curl -s https://cbct-backend-XXXXX.onrender.com/api/health | grep cache
```

### Command 3: Run Full Verification
```bash
node verify-deployment.js
```

## Common Tasks

### Update Backend Code
1. Commit changes to GitHub
2. Render auto-deploys (watch logs)
3. Verify `/api/health` returns 200

### Update Redis Connection (Upstash)
1. Go to https://console.upstash.com/
2. Copy new REDIS_URL
3. Go to Render dashboard
4. Update `REDIS_URL` environment variable
5. Service redeploys automatically
6. Verify cache connection in Redis logs

### Update Frontend Code
1. Commit changes to GitHub
2. Vercel auto-deploys
3. Verify homepage loads without errors

### Scale Redis Memory
1. Go to Upstash console
2. Database → Upgrade Plan
3. Monitor memory usage in health checks

## Production Checklist (Before Launch)

- [ ] Backend `/api/health` returns `"cache": "connected"`
- [ ] Frontend can reach backend (Network tab in DevTools)
- [ ] CORS_ORIGIN on Render matches Vercel domain
- [ ] Environment variables set on both Vercel and Render
- [ ] No hardcoded localhost URLs
- [ ] Cache hit/miss logging in Render logs
- [ ] Upstash Redis memory usage under plan limit

## Documentation Links

- [Upstash Docs](https://upstash.com/docs)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- CBCT Architecture: See `ARCHITECTURE.md`
- Full Deployment Guide: See `DEPLOYMENT_GUIDE.md`
- Checklist: See `DEPLOYMENT_CHECKLIST.md`

---
**Quick Reference for: CBCT on Upstash + Render + Vercel**
