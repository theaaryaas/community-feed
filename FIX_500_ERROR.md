# Fix 500 Server Error on Render

## Common Causes of 500 Error

1. **Database migrations not run**
2. **Static files not collected**
3. **Missing environment variables**
4. **Database connection issues**

## Solution Steps

### Step 1: Check Render Logs

1. Go to **Render Dashboard** → `community-feed-backend`
2. Click **"Logs"** tab
3. Look for error messages - they will tell you exactly what's wrong

### Step 2: Run Migrations (Most Common Fix)

The 500 error is often because migrations haven't been run. Since you can't use Shell on free tier:

**Option A: Use the create-user endpoint to trigger migrations**
- The endpoint will fail if migrations aren't run, but it might trigger them

**Option B: Check if build script runs migrations**
- The build script should run migrations, but it might be failing silently

### Step 3: Verify Environment Variables

Make sure these are set in Render:
- ✅ `SECRET_KEY`
- ✅ `DEBUG` = `False`
- ✅ `DATABASE_URL` (Internal Database URL)
- ✅ `ALLOWED_HOSTS` = `community-feed-backend.onrender.com`
- ✅ `CORS_ALLOWED_ORIGINS` = your Vercel URL
- ✅ `CSRF_TRUSTED_ORIGINS` = your Vercel URL

### Step 4: Check Build Command

In Render service settings, make sure Build Command is:
```bash
pip install -r requirements.txt && python manage.py collectstatic --no-input
```

### Step 5: Check Start Command

Make sure Start Command is:
```bash
gunicorn community_feed.wsgi:application
```

### Step 6: Test API Endpoints

Try these URLs to see what works:
1. `https://your-backend.onrender.com/api/posts/` - Should return `[]`
2. `https://your-backend.onrender.com/api/leaderboard/` - Should return `[]`
3. `https://your-backend.onrender.com/admin/` - Might show 500 error

---

## Quick Fix: Redeploy with Updated Code

I've updated the code to handle errors better. After Render redeploys:

1. Wait for deployment to complete
2. Check logs for any errors
3. Try accessing `/api/posts/` first (simpler endpoint)
4. Then try `/admin/`

---

## If Still Getting 500 Error

1. **Check Render Logs** - They will show the exact error
2. **Share the error message** from logs
3. **Common fixes:**
   - Missing `SECRET_KEY` → Add it
   - Database connection failed → Check `DATABASE_URL`
   - Import error → Check requirements.txt
   - Static files error → Check build command

---

## Test Your Backend

After fixes, test these endpoints:

✅ **Should Work:**
- `https://your-backend.onrender.com/api/posts/` → `[]`
- `https://your-backend.onrender.com/api/leaderboard/` → `[]`
- `https://your-backend.onrender.com/api/check-auth/` → `{"authenticated": false}`

❌ **Might Show 500:**
- `https://your-backend.onrender.com/admin/` (if migrations not run)
