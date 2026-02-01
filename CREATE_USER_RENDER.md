# How to Create a User in Render Database

## Problem
You're getting "Invalid username or password" because the user only exists in your local database, not in Render's PostgreSQL database.

## Solution: Create User in Render Database

### Method 1: Using Render Shell (Recommended)

1. **Go to Render Dashboard**
   - Visit: https://render.com
   - Click on your backend service: `community-feed-backend`

2. **Open Shell**
   - Click the **"Shell"** tab (in the left sidebar or top menu)

3. **Create Superuser**
   - In the shell, run:
     ```bash
     python manage.py createsuperuser
     ```
   - Enter username: `admin` (or any username you want)
   - Enter email: `admin@example.com` (or your email)
   - Enter password: `admin123` (or a strong password)
   - Confirm password: `admin123`

4. **Test Login**
   - Go back to your Vercel site
   - Try logging in with the credentials you just created

### Method 2: Using Django Admin (Alternative)

1. **Access Django Admin on Render**
   - Your backend URL: `https://your-backend-url.onrender.com/admin`
   - Example: `https://community-feed-backend.onrender.com/admin`

2. **Login with Superuser**
   - If you already created a superuser, use those credentials
   - If not, use Method 1 first

3. **Create New User**
   - Click "Users" → "Add user"
   - Fill in username, password, email
   - Click "Save"

### Method 3: Create User via Python Script

1. **Open Render Shell**
2. **Run Python Shell**:
   ```bash
   python manage.py shell
   ```
3. **Create User**:
   ```python
   from django.contrib.auth.models import User
   User.objects.create_user('admin', 'admin@example.com', 'admin123')
   ```
4. **Exit**: Type `exit()`

---

## Quick Steps Summary

1. Go to Render → `community-feed-backend` → **Shell** tab
2. Run: `python manage.py createsuperuser`
3. Enter: username, email, password
4. Go to Vercel site and login with those credentials

---

## Common Issues

### Issue: "Shell" tab not available
**Solution**: Make sure your backend service is deployed and running

### Issue: "No module named django"
**Solution**: Wait for deployment to complete, then try again

### Issue: Can't access Django Admin
**Solution**: 
- Make sure backend URL is correct
- Check if backend is "Live" in Render
- Try: `https://your-backend-url.onrender.com/admin`

---

## After Creating User

1. **Test Login** on your Vercel site
2. **Create a Post** to test the full flow
3. **Check Leaderboard** to see if it updates

---

## Security Note

For production, use a strong password:
- At least 8 characters
- Mix of uppercase, lowercase, numbers, symbols
- Don't use "admin123" in production!
