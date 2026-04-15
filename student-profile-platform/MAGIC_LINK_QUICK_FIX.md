# ⚡ Magic Link Quick Fix (5 Minutes)

## Critical Steps to Enable Magic Link

### Step 1: Go to Supabase Dashboard
1. Visit [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click **Authentication** in left sidebar

### Step 2: Enable Email Provider
1. Click **Providers** in the menu
2. Find **Email** and click the toggle to turn it **ON**
3. Click **Save**

### Step 3: DISABLE Email Confirmation (Critical!)
⚠️ **This is the most common issue!**

1. Still in **Providers > Email**
2. Look for the toggle: **"Confirm email before signing in"**
3. Toggle it to turn it **OFF**
4. Click **Save**

### Step 4: Configure URLs
1. Go to **Authentication > URL Configuration**
2. Set **Site URL**: `http://localhost:5173` (for local development)
3. Under **Redirect URLs**, make sure these are listed:
   - `http://localhost:5173/dashboard`
   - `http://localhost:5173/login`
4. Click **Save**

### Step 5: Test
1. Go to your app login page
2. Click "Try passwordless sign-in" 
3. Enter your email
4. Check your email inbox (wait 30-60 seconds)
5. Click the magic link

---

## 🔍 Debug Tips

**Open browser DevTools (F12) and:**
1. Go to **Console** tab
2. Look for messages starting with 🔗, ✅, or ❌
3. Check the magic link error message
4. Share any error messages with this checklist

---

## If Still Not Working

**Check Supabase for blocked emails:**
1. Go to **Logs** in Supabase dashboard
2. Look for Authorization attempts
3. Check for any error messages

**Try these:**
- [ ] Use a different email address
- [ ] Check spam/junk folder for email
- [ ] Clear browser cookies and try again
- [ ] Try in incognito/private window
- [ ] Refresh Supabase dashboard page

---

## Production Deployment

If deploying to production (Vercel, Netlify, etc.):
1. Update **Site URL** in Supabase: `https://yourdomain.com`
2. Add redirect URLs: `https://yourdomain.com/dashboard`
3. Configure SMTP email if email volume is high (optional but recommended)
