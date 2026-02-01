# Create User on Render Free Tier (No Shell Access)

Since Shell is not available on free tier, here are alternative methods:

## Method 1: Use Django Admin (Easiest)

### Step 1: Access Django Admin
1. Go to your Render backend URL: `https://your-backend-url.onrender.com/admin`
   - Example: `https://community-feed-backend.onrender.com/admin`

### Step 2: Login (if you have a superuser)
- If you already created a superuser during deployment, use those credentials
- If not, you'll need to use Method 2 or 3

### Step 3: Create User
1. Click "Users" → "Add user"
2. Enter:
   - Username: `admin` (or any username)
   - Password: `admin123` (or strong password)
   - Password confirmation: same password
3. Click "Save"
4. Optionally check "Staff status" and "Superuser status" for admin access

---

## Method 2: Create User via API Endpoint (Quick Fix)

I'll create a temporary endpoint to create users. **⚠️ Remove this after creating your user for security!**

### Step 1: Add Temporary Endpoint
The code is already added - just deploy it.

### Step 2: Create User via API
1. Open your browser console (F12)
2. Go to your Vercel site
3. Run this in console:
   ```javascript
   fetch('https://your-backend-url.onrender.com/api/create-user/', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({
       username: 'admin',
       password: 'admin123',
       email: 'admin@example.com'
     })
   }).then(r => r.json()).then(console.log)
   ```
   Replace `your-backend-url` with your actual Render URL

### Step 3: Remove Endpoint (Important!)
After creating user, remove the endpoint for security.

---

## Method 3: Use Python Script in Build Process

Create a script that runs during deployment to create a default user.

---

## Recommended: Method 1 (Django Admin)

Try accessing Django Admin first - it's the simplest method!
