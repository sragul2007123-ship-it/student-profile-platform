# Setup Guide: Student Digital Profile Platform

This guide will help you set up and run the application using **Supabase** for Backend-as-a-Service and **GitHub** for source control.

---

## 1. Supabase Setup (Database & Auth)

Supabase handles your database, authentication, and security policies.

### Create Project
1. Go to [database.new](https://database.new) and create a new project.
2. Note your **Project URL** and **API Keys** (found in Project Settings > API).

### Apply Schema
1. Open the `supabase/schema.sql` file in this project.
2. Copy the entire content.
3. In your Supabase Dashboard, go to **SQL Editor**.
4. Click "New Query", paste the SQL, and click **Run**.
   > [!IMPORTANT]
   > This creates the `users`, `profiles`, `skills`, `projects`, and `certificates` tables, sets up RLS (Row Level Security), and adds the auto-profile creation trigger.

### Configure Authentication
1. Go to **Authentication > Providers**.
2. **Email**: Ensure it is enabled (usually on by default).
3. **Google (Optional)**: If you want Google Login, enable it and follow the Supabase guide to add your Google Client ID and Secret from the [Google Cloud Console](https://console.cloud.google.com/).
4. Go to **Authentication > URL Configuration**:
   - **Site URL**: `http://localhost:5173` (for local development).

---

## 2. GitHub Setup (Source Control)

1. Create a new repository on [GitHub](https://github.com/new).
2. Initialize git in your local project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Student Profile Platform"
   git remote add origin https://github.com/your-username/your-repo-name.git
   git push -u origin main
   ```

---

## 3. Local Environment Configuration

You need to create `.env` files in both the `backend` and `frontend` folders. **Do not commit these files to GitHub.**

### Backend (`backend/.env`)
Create a file named `.env` inside the `backend` folder:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key-here
```
> [!TIP]
> Use the **service_role** key for the backend to bypass RLS for admin tasks.

### Frontend (`frontend/.env`)
Create a file named `.env` inside the `frontend` folder:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
> [!TIP]
> Use the **anon** (public) key for the frontend.

---

## 4. Running the Application

### Start the Backend (FastAPI)
1. Open a terminal in the `backend` directory.
2. Install dependencies: `pip install -r requirements.txt`
3. Start the server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Start the Frontend (Vite)
1. Open a new terminal in the `frontend` directory.
2. Install dependencies: `npm install`
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 5. Deployment (Optional)

- **Frontend**: Connect your GitHub repo to [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/).
- **Backend**: Use [Render](https://render.com/) or [Railway](https://railway.app/).
- **Supabase**: Stays hosted on Supabase Cloud.

---

### Verification Checklist
- [ ] Can you sign up/log in?
- [ ] Does creating a profile in the Dashboard show up in the Supabase `users` table?
- [ ] Can you view your public profile at `/student/your-username`?
- [ ] Does the Leaderboard correctly calculate scores?
