# Test Backend Without F12

## Method 1: Test Directly in Browser (Easiest)

Just visit these URLs in your browser:

### Test 1: Check if Backend is Working
```
https://community-feed-backend.onrender.com/api/posts/
```
**Expected:** Should show `[]` (empty array) or JSON data

### Test 2: Check Leaderboard
```
https://community-feed-backend.onrender.com/api/leaderboard/
```
**Expected:** Should show `[]` (empty array) or leaderboard data

### Test 3: Check Auth Endpoint
```
https://community-feed-backend.onrender.com/api/check-auth/
```
**Expected:** Should show `{"authenticated": false}`

---

## Method 2: Create User Using Browser Address Bar

You can't use F12, but you can use a simple HTML page. I'll create one for you.

---

## Method 3: Use Terminal/Command Prompt

Open PowerShell or Command Prompt and run:

```powershell
# Test backend
curl https://community-feed-backend.onrender.com/api/posts/

# Create user
curl -X POST https://community-feed-backend.onrender.com/api/create-user/ -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\",\"email\":\"admin@test.com\"}"

# Test login
curl -X POST https://community-feed-backend.onrender.com/api/login/ -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}" -c cookies.txt
```

---

## Method 4: Use Online API Tester

1. Go to: https://reqbin.com/ or https://www.postman.com/
2. Enter URL: `https://community-feed-backend.onrender.com/api/create-user/`
3. Method: POST
4. Body (JSON):
   ```json
   {
     "username": "admin",
     "password": "admin123",
     "email": "admin@test.com"
   }
   ```
5. Click Send

---

## Quick Test URLs

Just copy and paste these in your browser:

1. **Test Backend:**
   ```
   https://community-feed-backend.onrender.com/api/posts/
   ```

2. **Test Leaderboard:**
   ```
   https://community-feed-backend.onrender.com/api/leaderboard/
   ```

3. **Test Auth:**
   ```
   https://community-feed-backend.onrender.com/api/check-auth/
   ```

If these show JSON (even if empty), your backend is working!

---

## What to Do Next

1. **Test the URLs above** - Do they work?
2. **If they work** - Backend is fine, issue is with login/frontend
3. **If they don't work** - Check Render logs for errors

Tell me what you see when you visit those URLs!
