# Deployment Guide: Upstash + Render + Vercel

This guide covers deploying CBCT with:
- **Frontend**: Vercel
- **Backend**: Render  
- **Redis Cache**: Upstash

## 1. Upstash Redis Setup

### Create Upstash Account
1. Go to [https://upstash.com/](https://upstash.com/)
2. Sign up and create a new account
3. Create a new Redis database

### Get Connection String
1. Navigate to your Redis database
2. Click **Connect** button
3. Copy the **REDIS_URL** (looks like: `rediss://default:xxxxx@xxx-xxxxx.upstash.io:xxxxx`)
4. Save this for the next steps

### Connection Format
```
rediss://default:PASSWORD@HOST:PORT
```
- `rediss://` = Redis with TLS (required by Upstash)
- `default` = default user
- `PASSWORD` = Your Upstash token
- `HOST:PORT` = Your Upstash endpoint

## 2. Backend Deployment on Render

### Create Render Account & Service
1. Go to [https://render.com/](https://render.com/)
2. Sign up and create account
3. Create a new **Web Service**
4. Connect your GitHub repository

### Configure Render Service
1. **Name**: cbct-backend
2. **Environment**: Node
3. **Build Command**: `npm install && npm run build` (if applicable)
4. **Start Command**: `npm start`

### Set Environment Variables on Render
1. Go to your service Settings
2. Add **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=5000
   REDIS_URL=<paste-your-upstash-url>
   CORS_ORIGIN=https://<your-vercel-domain>.vercel.app
   ```

3. Save and redeploy

### Get Backend URL
After deployment, you'll have a Render URL like: `https://cbct-backend-xxxxx.onrender.com`

## 3. Frontend Deployment on Vercel

### Create Vercel Account & Project
1. Go to [https://vercel.com/](https://vercel.com/)
2. Sign up and import your GitHub repository
3. Select the `/client` folder as root

### Configure Build Settings
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Root Directory**: `client`

### Set Environment Variables on Vercel
1. Go to **Settings → Environment Variables**
2. Add variable (or create `.env.local` for development):
   ```
   VITE_API_URL=https://cbct-backend-xxxxx.onrender.com
   ```

### Update Frontend Code
In your API calls, use environment variable:

**`client/src/services/api.js`** example:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function fetchAnalysis(path, type) {
  const response = await fetch(`${API_URL}/api/analysis/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path })
  });
  return response.json();
}
```

## 4. Verify Deployment

### Check Backend Health
```bash
curl https://cbct-backend-xxxxx.onrender.com/api/health
```
Expected response:
```json
{
  "status": "ok",
  "message": "CBCT Server is running",
  "cache": "connected"
}
```

### Test Cache Integration
1. Run analysis through Vercel frontend
2. Check Render logs for `[CACHE MISS]`
3. Run same analysis again
4. Check logs for `[CACHE HIT]`

### Monitor Cache Usage
- **Upstash Dashboard**: View memory usage and hit rate
- **Render Logs**: Monitor Redis connection and operations
- **Vercel Logs**: Check API response times

## 5. Production Best Practices

### Security
- [ ] Enable Upstash password in production (use strong token)
- [ ] Add IP whitelist on Upstash if available
- [ ] Set CORS_ORIGIN to specific Vercel domain (not wildcard)
- [ ] Use environment variables for all secrets (never commit .env)

### Performance
- [ ] Set appropriate TTL values per analysis type:
  ```javascript
  // In cacheService.js
  const ttlByType = {
    'dependencies': 3600,    // 1 hour
    'complexity': 7200,      // 2 hours
    'centrality': 7200,      // 2 hours
    'git/churn': 86400,      // 24 hours
    'git/impact': 86400      // 24 hours
  };
  ```

### Monitoring
- Set up Upstash alerts for Redis memory usage
- Monitor Render CPU/Memory usage
- Track Vercel build times and serverless function duration

## 6. Troubleshooting

### "Redis Connection Error" on Render
- Verify REDIS_URL is correctly set in Render environment
- Check Upstash console to ensure database is running
- Verify `rediss://` protocol (with TLS) for Upstash
- Check Render logs: `service.log` for connection attempts

### Frontend Can't Reach Backend
- Verify VITE_API_URL is set in Vercel environment
- Check browser console: Network tab → API calls should go to Render URL
- Verify CORS_ORIGIN on Render matches Vercel domain
- Add Vercel domain to CORS whitelist if needed

### Slow Cache Hits
- Check Upstash latency in dashboard
- Verify Render region is close to Upstash region
- Monitor Render logs for Redis operation times

## 7. Key Files

| File | Usage |
|------|-------|
| `server/src/utils/redisClient.js` | Redis client initialization (TLS for Upstash) |
| `server/src/services/cacheService.js` | Cache abstraction layer (get/set) |
| `server/.env.example` | Template for Render environment variables |
| `client/src/services/api.js` | API client using VITE_API_URL |

## 8. Cost Estimation

| Service | Free Tier | Cost |
|---------|-----------|------|
| **Upstash** | 10K commands/day | ~$25/month for high usage |
| **Render** | 750 hours/month | ~$7-20/month for always-on |
| **Vercel** | 100GB bandwidth | ~$20/month for high traffic |

---

**Next Steps**: After deployment, test end-to-end by making analysis requests and monitoring cache hit rates in Upstash dashboard.
