# Render Production Setup Guide

## ✅ Server is Now Production Ready

The CBCT server now gracefully degrades if Redis is unavailable. The app will:
- ✅ Start and serve requests WITHOUT Redis (cache disabled)
- ✅ Run all analysis operations WITHOUT caching
- ⚠️ Show reduced performance without Redis cache

---

## 🚀 Setup Steps for Production

### Step 1: Render Dashboard - Environment Variables

1. Go to https://dashboard.render.com
2. Select your **cbct-server** service
3. Click **Settings** → **Environment Variables**
4. **Add or Update** these variables:

```
NODE_ENV=production
PORT=5000
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_HOST:6379
CORS_ORIGIN=https://your-vercel-frontend.vercel.app
```

**Important:** Get `REDIS_URL` from Upstash:
- Log in to https://console.upstash.com/
- Select your Redis database
- Copy the **REDIS_URL** (starts with `rediss://`)

### Step 2: Verify Redis URL Format

✅ **Correct format:**
```
rediss://default:xxxxxxxxxxxxxxxxxxxx@your-host-xxxxx.upstash.io:6379
```

❌ **Wrong formats:**
```
redis://localhost:6379           # This won't work on Render
redis://default:password@host    # Missing port
```

### Step 3: Save and Deploy

1. Click **Save** in Render dashboard
2. Render will **auto-deploy** with new environment variables
3. Check logs to confirm Redis connected

---

## 📋 Expected Logs (After Setup)

### With Redis Connected ✅
```
🗺️  CBCT Server running on port 5000
[Server] Initializing cache layer...
[Redis] Initializing client...
[Redis] URL format: rediss:// (TLS/Upstash)
[Redis] Connected successfully
[Redis] Ready for operations
[Redis] Client initialized and connected
```

### Without Redis (Graceful Degradation) ⚠️
```
🗺️  CBCT Server running on port 5000
[Server] Initializing cache layer...
[Redis] Initializing client...
[Redis] REDIS_URL environment variable not set
[Redis] Cache layer disabled - continuing without caching
[Redis] To enable Redis, set REDIS_URL=rediss://default:password@host:port
```

The app still works! No cache, but queries work.

---

## 🔍 Troubleshooting

### Problem: "REDIS_URL environment variable not set"
**Solution:** Add `REDIS_URL` to Render dashboard Environment Variables

### Problem: "Connection failed: ECONNREFUSED"
**Likely causes:**
- Redis URL is incorrect
- Redis server is down
- Network connectivity issue

**Solution:**
1. Verify Redis URL from Upstash console
2. Check that URL is correct: `rediss://...` (note the `s`)
3. Ensure it's set in Render dashboard (not just in local .env)

### Problem: "Connection timeout"
**Solution:**
- Your Redis might be slow to respond
- This is okay - app continues without cache
- Disable "Private Networking" in Upstash settings if available

### Problem: "ENOTFOUND" error
**Solution:**
- DNS can't find the host
- Copy the Redis URL again from Upstash
- Make sure there are no extra spaces in the URL

### Server Works But Redis Never Connects
**This is OK!** The server:
- ✅ Starts and serves requests
- ✅ Runs all analyses
- ⚠️ Just without performance cache

Monitor your logs but don't worry if Redis stays disconnected.

---

## 🧪 Test the Deployment

Once deployed, test the health endpoint:

```bash
curl https://your-render-url.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "CBCT Server is running",
  "cache": "connected" OR "disconnected"
}
```

- `cache: "connected"` = Redis is working ✅
- `cache: "disconnected"` = App works without cache ⚠️

---

## 📊 Performance Impact

### Without Redis Cache
- First query: ~2-5 seconds (depending on repo size)
- Same query again: ~2-5 seconds (no cache, recalculated)
- Memory usage: Less

### With Redis Cache
- First query: ~2-5 seconds (calculate + store)
- Same query again: <100ms (cache hit)
- Memory usage: More (Redis DB)

**Recommendation:** Set up Redis for production to improve performance.

---

## ⚙️ Advanced: Upstash Setup

If you don't have an Upstash Redis database:

1. Go to https://console.upstash.com/
2. Click **Create Database**
3. Enter name: `cbct-redis`
4. Region: Choose closest to your Render region
5. Click **Create**
6. Copy the **REDIS_URL** (the one starting with `rediss://`)
7. Paste into Render Environment Variables

---

## 🔒 Security Notes

### ✅ Do This
- [ ] Set `REDIS_URL` in Render dashboard (secure)
- [ ] Use `rediss://` (TLS encrypted)
- [ ] Set `CORS_ORIGIN` to your exact frontend URL
- [ ] Use strong Upstash password (auto-generated, keep it)

### ❌ Don't Do This
- [ ] Hardcode Redis URL in code
- [ ] Commit `.env` with secrets to Git
- [ ] Use `redis://` (unencrypted)
- [ ] Set `CORS_ORIGIN=*` (too permissive)

---

## 📞 Support

### Check Logs
```
Render Dashboard → Your Service → Logs
```

Look for these to confirm setup:
- `[Redis] Connected successfully` = Redis is working
- `[Redis] REDIS_URL environment variable not set` = Need to set env var
- `[Redis] Connection failed` = Check URL in Upstash console

### Verify Configuration
```bash
# Test health endpoint
curl https://your-render-url/api/health

# Should return status with cache: "connected" or "disconnected"
```

---

## ✨ Summary

Your server is now **production-ready**:
- ✅ Starts without Redis
- ✅ Gracefully degradation if Redis unavailable
- ✅ Works with or without caching
- ✅ Clear logging for debugging
- ✅ No error spam in Render logs

Just add the `REDIS_URL` environment variable in Render dashboard and you're done!
