# Magic Link Setup & Troubleshooting Guide

## 🔧 Step 1: Configure Supabase Email Provider

### Enable Magic Link Feature
1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication > Providers > Email**
3. Ensure **Enable Email provider** is toggled **ON**
4. **IMPORTANT**: Toggle **"Confirm email before signing in"** to **OFF**
   - This is critical! If ON, magic links won't work properly
5. Click **Save**

### Configure Email Sending (Choose One)

#### Option A: Use Supabase's Built-in Email Service (Recommended for Testing)
- Supabase provides a default email service for development
- Works out of the box for magic links
- Limited to 10 emails/hour (free tier)

#### Option B: Configure Custom SMTP (For Production)
If the built-in service isn't working:
1. Still in **Email Provider** settings
2. Look for **SMTP Settings** section
3. Enter your email service credentials:
   - SMTP Host, Port, Username, Password
   - From Email Address
   - Common providers: SendGrid, Mailgun, Amazon SES, Resend

### Configure URL Settings
1. Go to **Authentication > URL Configuration**
2. Set **Site URL** for your environment:
   - **Local**: `http://localhost:5173`
   - **Production**: `https://yourdomain.com`
3. Verify **Redirect URLs** includes:
   - `http://localhost:5173/dashboard` (for local)
   - `https://yourdomain.com/dashboard` (for production)
4. Click **Save**

---

## ✅ Step 2: Test Magic Link Locally

1. Start your app: `npm run dev` in the frontend folder
2. Go to **Login Page**
3. Click **"Try passwordless sign-in with magic link"** button
4. Enter your email
5. Check your email inbox (and spam folder)
6. Click the magic link in the email

---

## 🐛 Common Issues & Solutions

### ❌ "No email received after clicking 'Send Magic Link'"
**Solutions:**
- Check spam/junk folder
- Verify "Confirm email before signing in" is **OFF**
- Check Supabase logs: **Authentication > Logs** in dashboard
- Verify SMTP settings are correct (if using custom email)
- Wait 30-60 seconds (email might be slow)

### ❌ "Magic link doesn't redirect properly"
**Solutions:**
- Verify Site URL in **Authentication > URL Configuration** is correct
- Check that redirect URL includes `/dashboard`
- Clear browser cookies/cache
- Try incognito/private window
- Check browser console for errors

### ❌ "Invalid link or link has expired"
**Solutions:**
- Magic links expire after 24 hours
- Request a new magic link
- Check that you're using the exact link from email (don't modify URL)

### ❌ "Email provider still shows disabled"
**Solutions:**
- Refresh the Supabase dashboard page
- Check your account has permissions to modify auth settings
- Try in incognito window (clear Supabase session)

---

## 📧 Testing Email Sending

To verify email sending works:
1. Use **Supabase SQL Editor** to check email logs
2. Or use a testing service like **Mailtrap** or **Mailhog** for local development

---

## 🚀 Quick Checklist

- [ ] Email provider is **Enabled**
- [ ] "Confirm email before signing in" is **OFF**
- [ ] SMTP or default email service is configured
- [ ] Site URL is set correctly in URL Configuration
- [ ] Redirect URLs include `/dashboard`
- [ ] Environment variables are correct (.env files)
- [ ] Tested with a real email address
- [ ] Checked email spam folder

---

## 💡 Pro Tips

1. **For Development**: Use Supabase's default email service (faster setup)
2. **For Testing**: Use a test email service like **Mailtrap.io** (catch all emails)
3. **For Production**: Use a reliable SMTP provider (SendGrid, Mailgun, etc.)
4. **Debug Mode**: Check browser console (F12) for detailed error messages
5. **Database Check**: Look at Supabase **Logs** > **Auth** to see email sending attempts
