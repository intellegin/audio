# Quick Start: Deploy to Vercel with Supabase

## 🚀 5-Minute Setup Guide

### Step 1: Create Supabase Project (2 min)

1. Go to https://supabase.com → **New Project**
2. Fill in project details
3. **Save your database password!**
4. Go to **Settings** → **Database** → Copy **Connection string** (URI format)

### Step 2: Set Up OAuth (3 min)

**Google:**
- https://console.cloud.google.com → Create OAuth Client
- Add redirect: `https://your-app.vercel.app/api/auth/callback/google`

**GitHub:**
- https://github.com/settings/developers → New OAuth App
- Callback: `https://your-app.vercel.app/api/auth/callback/github`

### Step 3: Deploy to Vercel (1 min)

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Add environment variables (see below)
5. Click **Deploy**

### Step 4: Environment Variables

Add these in Vercel → Project Settings → Environment Variables:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
AUTH_URL=https://your-app.vercel.app
AUTH_SECRET=generate-with-openssl-rand-base64-32
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-secret
API_PROVIDER=plex
PLEX_URL=http://your-nas:32400
PLEX_TOKEN=your-plex-token
```

### Step 5: Run Database Migrations

**Option A: Supabase SQL Editor (Easiest)**
1. Supabase Dashboard → **SQL Editor**
2. Copy contents from `src/lib/db/migrations/0000_*.sql` through `0006_*.sql`
3. Run them in order

**Option B: Vercel CLI**
```bash
vercel env pull .env.local
pnpm db:migrate
```

## ✅ Done!

Your app should now be live at `https://your-app.vercel.app`

## 🔍 Verify Everything Works

1. Visit your deployed app
2. Try signing up with Google/GitHub
3. Check Supabase → **Table Editor** → **user** table
4. You should see your user account!

## 📚 Full Documentation

See `VERCEL_DEPLOYMENT.md` for detailed instructions and troubleshooting.
