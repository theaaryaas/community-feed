# Fix Blank Page After Login

## Problem
After logging in, you see a blank white page.

## Solution Steps

### Step 1: Check Vercel Environment Variable

1. Go to **Vercel Dashboard** → Your project
2. Go to **Settings** → **Environment Variables**
3. Check if `VITE_API_URL` is set
4. It should be: `https://your-backend-url.onrender.com/api`
   - Replace `your-backend-url` with your actual Render backend URL
   - Example: `https://community-feed-backend.onrender.com/api`

### Step 2: If VITE_API_URL is Missing or Wrong

1. Click **"Add New"** or **"Edit"**
2. **Key**: `VITE_API_URL`
3. **Value**: `https://your-actual-backend-url.onrender.com/api`
4. **Environment**: Select **Production**, **Preview**, and **Development**
5. Click **"Save"**

### Step 3: Redeploy Frontend

1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

### Step 4: Check Browser Console

1. Open your Vercel site
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Look for errors like:
   - `Failed to fetch`
   - `CORS error`
   - `Network error`
   - `API Base URL: ...` (this shows what URL is being used)

### Step 5: Verify Backend is Working

1. Test your backend directly:
   - Visit: `https://your-backend-url.onrender.com/api/posts/`
   - Should see: `[]` (empty array) or JSON data
2. If backend is down:
   - Go to Render dashboard
   - Check if backend service is "Live"
   - Check logs for errors

### Step 6: Check CORS Settings

1. Go to **Render Dashboard** → Your backend service
2. Go to **Environment** tab
3. Check `CORS_ALLOWED_ORIGINS`:
   - Should be: `https://your-vercel-url.vercel.app`
   - Example: `https://community-feed-xi.vercel.app`
4. If wrong, update it and save (auto-redeploys)

---

## Quick Checklist

- [ ] `VITE_API_URL` is set in Vercel environment variables
- [ ] `VITE_API_URL` points to: `https://your-backend.onrender.com/api`
- [ ] Frontend has been redeployed after setting environment variable
- [ ] Backend is live and accessible
- [ ] CORS settings in Render include your Vercel URL
- [ ] Browser console shows no CORS errors

---

## Common Issues

### Issue 1: Environment Variable Not Set
**Symptom**: Blank page, console shows API calls to `/api` (relative path)
**Fix**: Set `VITE_API_URL` in Vercel and redeploy

### Issue 2: Wrong Backend URL
**Symptom**: Network errors in console
**Fix**: Update `VITE_API_URL` with correct backend URL

### Issue 3: CORS Error
**Symptom**: Console shows "CORS policy" error
**Fix**: Update `CORS_ALLOWED_ORIGINS` in Render to include Vercel URL

### Issue 4: Backend Not Running
**Symptom**: All API calls fail with connection errors
**Fix**: Check Render dashboard, ensure backend is "Live"

---

## Test Your Setup

1. **Backend Test**: 
   ```
   https://your-backend.onrender.com/api/posts/
   ```
   Should return: `[]` or JSON

2. **Frontend Test**:
   ```
   https://your-frontend.vercel.app
   ```
   Should show login page

3. **After Login**:
   - Should show feed (even if empty)
   - Should show leaderboard
   - Should NOT be blank

---

## Still Not Working?

1. Check browser console (F12) for specific errors
2. Check Vercel deployment logs
3. Check Render backend logs
4. Verify both services are deployed and running
