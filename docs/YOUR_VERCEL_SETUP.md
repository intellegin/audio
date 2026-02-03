# Your Vercel Deployment Setup

## 🎯 Your Project

**Vercel Project**: https://vercel.com/intellegin-ai/audio

## 📍 Finding Your Deployment URL

Your app is deployed at a URL like:
- `https://audio-[hash].vercel.app` (automatic)
- `https://audio-intellegin-ai.vercel.app` (team-based)
- Or a custom domain if you've configured one

**To find it:**
1. Go to https://vercel.com/intellegin-ai/audio
2. Click on the latest **Deployment**
3. Look at the **"Domains"** section
4. Copy the `.vercel.app` URL (this is your `AUTH_URL`)

## ⚙️ Required Configuration

### Step 1: Set Environment Variables in Vercel

Go to: **Settings** → **Environment Variables**

Add these (replace placeholders with your actual values):

```env
# Database - Get from Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres

# NextAuth - Use your actual deployment URL from above
AUTH_URL=https://your-actual-url.vercel.app

# Generate with: openssl rand -base64 32
AUTH_SECRET=your-generated-secret-here

# OAuth - Get from providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-secret

# API Provider
API_PROVIDER=plex

# Plex (if using)
PLEX_URL=http://your-nas:32400
PLEX_TOKEN=your-plex-token
```

### Step 2: Update OAuth Redirect URLs

Once you know your deployment URL, update:

**Google OAuth:**
- https://console.cloud.google.com → Credentials
- Edit OAuth Client
- Add: `https://your-actual-url.vercel.app/api/auth/callback/google`

**GitHub OAuth:**
- https://github.com/settings/developers → OAuth Apps
- Edit OAuth App
- Set: `https://your-actual-url.vercel.app/api/auth/callback/github`

### Step 3: Run Database Migrations

If you haven't already:

1. Go to Supabase → **SQL Editor**
2. Run migration files from `src/lib/db/migrations/` in order:
   - 0000_fresh_psynapse.sql
   - 0001_flaky_wrecking_crew.sql
   - 0002_unusual_dreaming_celestial.sql
   - 0003_right_snowbird.sql
   - 0004_sweet_spiral.sql
   - 0005_clever_cargill.sql
   - 0006_simple_squadron_sinister.sql

**Note**: With the rename to "Audio", tables will be:
- `audio_playlist` (not `infinitunes_playlist`)
- `audio_favorite` (not `infinitunes_favorite`)

### Step 4: Redeploy

After setting environment variables:
- Push a new commit, OR
- Go to **Deployments** → Click **"Redeploy"** on latest

## ✅ Verification Checklist

- [ ] Found your deployment URL
- [ ] Set `AUTH_URL` in Vercel environment variables
- [ ] Set all other required environment variables
- [ ] Updated Google OAuth redirect URL
- [ ] Updated GitHub OAuth redirect URL
- [ ] Ran database migrations in Supabase
- [ ] Redeployed the app
- [ ] Tested sign up/login
- [ ] Verified user appears in Supabase `user` table

## 🔍 Quick Test

1. Visit your deployment URL
2. Try signing up with Google or GitHub
3. Check Supabase → **Table Editor** → **user** table
4. You should see your user account!

## 🆘 Common Issues

**"Invalid redirect URI"**
- Double-check `AUTH_URL` matches your deployment URL exactly
- Verify OAuth redirect URLs match exactly (no trailing slash)

**Build fails**
- Check all required env vars are set
- Verify `AUTH_SECRET` is 32+ characters

**Users not saving**
- Verify migrations ran successfully
- Check Supabase → Table Editor → tables exist
