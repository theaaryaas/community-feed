# Fix Login Issues

## Common Login Problems and Solutions

### Problem 1: "Invalid username or password"

**Cause**: User doesn't exist in Render's database

**Solution**: Create a user first using the API endpoint

1. **Open browser console** (F12) on your Vercel site
2. **Run this code** (replace with your backend URL):
   ```javascript
   fetch('https://community-feed-backend.onrender.com/api/create-user/', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({
       username: 'admin',
       password: 'admin123',
       email: 'admin@example.com'
     })
   }).then(r => r.json()).then(console.log)
   ```
3. **You should see**: `{success: true, message: "User admin created successfully"}`
4. **Now try logging in** with:
   - Username: `admin`
   - Password: `admin123`

---

### Problem 2: "Cannot connect to server"

**Cause**: Backend is not running or URL is wrong

**Solution**: 
1. Check if backend is "Live" in Render dashboard
2. Test backend directly: `https://your-backend.onrender.com/api/posts/`
3. Should return: `[]` (empty array)
4. If not working, check Render logs

---

### Problem 3: Login succeeds but page stays on login screen

**Cause**: Session cookie not being set properly

**Solution**: 
- The code now automatically reloads after login
- Make sure `withCredentials: true` is set (already done)
- Check browser console for errors

---

### Problem 4: CORS errors in console

**Cause**: CORS settings not configured correctly

**Solution**:
1. Go to Render → `community-feed-backend` → Environment
2. Check `CORS_ALLOWED_ORIGINS` includes your Vercel URL
3. Example: `https://community-feed-xi.vercel.app`
4. Save and wait for redeploy

---

## Step-by-Step: Create User and Login

### Step 1: Create User

1. Go to your Vercel site: `https://community-feed-xi.vercel.app`
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Paste this code:
   ```javascript
   fetch('https://community-feed-backend.onrender.com/api/create-user/', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({
       username: 'admin',
       password: 'admin123',
       email: 'admin@example.com'
     })
   }).then(r => r.json()).then(console.log)
   ```
5. Press **Enter**
6. You should see: `{success: true, ...}`

### Step 2: Login

1. On your Vercel site, enter:
   - Username: `admin`
   - Password: `admin123`
2. Click **Login**
3. Page should reload and show the feed

---

## Test Your Setup

### Test 1: Backend API
Visit: `https://community-feed-backend.onrender.com/api/posts/`
- Should return: `[]` ✅

### Test 2: Create User
Run the create-user code in console
- Should return: `{success: true}` ✅

### Test 3: Login
Try logging in with created credentials
- Should work and show feed ✅

---

## Still Having Issues?

1. **Check browser console** (F12) for specific errors
2. **Check Render logs** for backend errors
3. **Verify environment variables** in both Render and Vercel
4. **Test backend directly** to ensure it's working

---

## Quick Checklist

- [ ] Backend is "Live" on Render
- [ ] User created via API endpoint
- [ ] `VITE_API_URL` set in Vercel (with `/api` at end)
- [ ] CORS settings include Vercel URL
- [ ] No errors in browser console
- [ ] No errors in Render logs
