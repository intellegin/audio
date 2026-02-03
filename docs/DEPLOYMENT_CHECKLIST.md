# Vercel + Supabase Deployment Checklist

Use this checklist to ensure everything is set up correctly for deployment.

## Pre-Deployment Checklist

### ✅ Supabase Setup
- [ ] Created Supabase project
- [ ] Saved database password securely
- [ ] Copied database connection string
- [ ] Ran database migrations (see `SUPABASE_SETUP.md`)
- [ ] Verified tables exist in Supabase Table Editor:
  - [ ] `user` table
  - [ ] `account` table
  - [ ] `verificationToken` table
  - [ ] `infinitunes_playlist` table
  - [ ] `infinitunes_favorite` table

### ✅ OAuth Providers Setup
- [ ] **Google OAuth:**
  - [ ] Created OAuth client in Google Cloud Console
  - [ ] Added redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
  - [ ] Copied Client ID and Secret
- [ ] **GitHub OAuth:**
  - [ ] Created OAuth App in GitHub
  - [ ] Set callback URL: `https://your-app.vercel.app/api/auth/callback/github`
  - [ ] Copied Client ID and Secret

### ✅ Environment Variables Prepared
- [ ] `DATABASE_URL` - Supabase connection string
- [ ] `AUTH_URL` - Your Vercel app URL (will be set after first deploy)
- [ ] `AUTH_SECRET` - Generated with `openssl rand -base64 32`
- [ ] `GOOGLE_CLIENT_ID` - From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- [ ] `GITHUB_CLIENT_ID` - From GitHub OAuth App
- [ ] `GITHUB_CLIENT_SECRET` - From GitHub OAuth App
- [ ] `API_PROVIDER` - Set to `plex`, `jiosaavn`, or `custom`
- [ ] `PLEX_URL` - (if using Plex) Your Plex server URL
- [ ] `PLEX_TOKEN` - (if using Plex) Your Plex token
- [ ] `JIOSAAVN_API_URL` - (if using JioSaavn) API URL

## Deployment Steps

### Step 1: Initial Vercel Deployment
- [ ] Push code to GitHub/GitLab/Bitbucket
- [ ] Go to https://vercel.com/new
- [ ] Import repository
- [ ] Vercel auto-detects Next.js (verify)
- [ ] **Don't add environment variables yet** - deploy first to get URL
- [ ] Click **Deploy**
- [ ] Wait for build to complete
- [ ] Copy your deployment URL (e.g., `https://your-app.vercel.app`)

### Step 2: Configure Environment Variables
- [ ] Go to Vercel project → **Settings** → **Environment Variables**
- [ ] Add all variables from checklist above
- [ ] Update `AUTH_URL` with your actual Vercel URL
- [ ] Update OAuth redirect URLs in Google/GitHub with your Vercel URL
- [ ] Set environment for each variable:
  - **Production**: ✅ (for production deployments)
  - **Preview**: ✅ (for preview deployments)
  - **Development**: ✅ (optional, for local dev)

### Step 3: Redeploy with Environment Variables
- [ ] Go to **Deployments** tab
- [ ] Click **Redeploy** on latest deployment
- [ ] Or push a new commit to trigger rebuild
- [ ] Verify build succeeds

### Step 4: Verify Database Connection
- [ ] Visit your deployed app
- [ ] Try signing up with Google or GitHub
- [ ] Check Supabase → **Table Editor** → **user** table
- [ ] Verify new user appears in database

### Step 5: Post-Deployment Verification
- [ ] **Authentication:**
  - [ ] Can sign up with Google ✅
  - [ ] Can sign up with GitHub ✅
  - [ ] Can sign in ✅
  - [ ] Session persists ✅
- [ ] **Database:**
  - [ ] Users save to Supabase ✅
  - [ ] Playlists can be created ✅
  - [ ] Favorites work ✅
- [ ] **API:**
  - [ ] Music loads (if API configured) ✅
  - [ ] Search works ✅
  - [ ] Player works ✅

## Troubleshooting Checklist

If something doesn't work:

### Build Fails
- [ ] Check Vercel build logs
- [ ] Verify all required env vars are set
- [ ] Check `AUTH_SECRET` is set (32+ characters)
- [ ] Verify `DATABASE_URL` format is correct

### Database Connection Fails
- [ ] Verify `DATABASE_URL` is correct
- [ ] Check Supabase project is active (not paused)
- [ ] Test connection string locally
- [ ] Check Supabase → Logs → Postgres Logs

### Authentication Fails
- [ ] Verify `AUTH_URL` matches your Vercel domain exactly
- [ ] Check OAuth redirect URLs match in provider settings
- [ ] Verify `AUTH_SECRET` is set
- [ ] Check browser console for errors

### Users Not Saving
- [ ] Verify migrations ran successfully
- [ ] Check Supabase → Table Editor → tables exist
- [ ] Check Supabase → Logs for errors
- [ ] Verify `DATABASE_URL` has correct permissions

## Production Checklist

Before going live:

- [ ] All environment variables set ✅
- [ ] Database migrations completed ✅
- [ ] OAuth redirect URLs updated ✅
- [ ] Custom domain configured (optional) ✅
- [ ] SSL certificate active (automatic with Vercel) ✅
- [ ] Error monitoring set up (optional) ✅
- [ ] Analytics configured (optional) ✅
- [ ] Backup strategy for database (Supabase handles this) ✅

## Quick Reference

### Generate AUTH_SECRET
```bash
openssl rand -base64 32
```

### Test Database Connection Locally
```bash
# Add to .env.local
DATABASE_URL=your-supabase-connection-string

# Test
pnpm db:studio
# Should open Drizzle Studio showing your tables
```

### Run Migrations Locally
```bash
pnpm db:migrate
```

### Check Vercel Logs
```bash
vercel logs
```

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **NextAuth Docs**: https://next-auth.js.org
- **Drizzle ORM Docs**: https://orm.drizzle.team

## Files Created for Deployment

- ✅ `vercel.json` - Vercel configuration
- ✅ `VERCEL_DEPLOYMENT.md` - Detailed deployment guide
- ✅ `SUPABASE_SETUP.md` - Database setup guide
- ✅ `QUICK_START_VERCEL.md` - Quick 5-minute guide
- ✅ `.env.vercel.example` - Environment variables template
- ✅ `DEPLOYMENT_CHECKLIST.md` - This file
