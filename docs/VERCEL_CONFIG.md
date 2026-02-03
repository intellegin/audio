# Vercel Deployment Configuration

## Your Deployment

**Project URL**: https://vercel.com/intellegin-ai/audio

**Deployment Domain**: Your app is likely available at one of these URLs:
- `https://audio-intellegin-ai.vercel.app` (team-based)
- `https://audio.vercel.app` (if project name is "audio")
- Or your custom domain if configured

To find your exact URL:
1. Go to https://vercel.com/intellegin-ai/audio
2. Click on any deployment
3. Copy the "Domains" URL shown

## Required Environment Variables

Set these in Vercel → Project Settings → Environment Variables:

```env
# Database (Supabase) - REQUIRED
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres

# NextAuth - REQUIRED
# Replace with your actual deployment URL (found above)
AUTH_URL=https://your-actual-deployment-url.vercel.app
AUTH_SECRET=generate-with-openssl-rand-base64-32

# OAuth Providers - REQUIRED
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# API Provider
API_PROVIDER=plex

# Plex Configuration (if using Plex)
PLEX_URL=http://your-nas-ip:32400
PLEX_TOKEN=your-plex-token
```

## OAuth Redirect URLs

Update these in your OAuth provider settings:

### Google OAuth:
- Go to https://console.cloud.google.com → Credentials
- Edit your OAuth Client
- Add Authorized redirect URI:
  ```
  https://your-actual-deployment-url.vercel.app/api/auth/callback/google
  ```

### GitHub OAuth:
- Go to https://github.com/settings/developers → OAuth Apps
- Edit your OAuth App
- Set Authorization callback URL:
  ```
  https://your-actual-deployment-url.vercel.app/api/auth/callback/github
  ```

## Quick Setup Steps

1. **Find your deployment URL**
   - Visit https://vercel.com/intellegin-ai/audio
   - Click on latest deployment
   - Copy the domain shown

2. **Set AUTH_URL**
   - Go to Vercel → Settings → Environment Variables
   - Add/Update: `AUTH_URL=https://your-actual-url.vercel.app`

3. **Update OAuth Redirect URLs**
   - Use the same URL from step 1
   - Update in Google Cloud Console and GitHub

4. **Redeploy**
   - Push a new commit, or
   - Go to Deployments → Click "Redeploy"

## Verification

After setting up:
- ✅ Visit your deployment URL
- ✅ Try signing up with Google/GitHub
- ✅ Check Supabase → Table Editor → user table
- ✅ Verify user appears in database

## Troubleshooting

### "Invalid redirect URI" Error
- Verify `AUTH_URL` matches your actual deployment URL exactly
- Check OAuth redirect URLs match exactly (no trailing slashes)
- Ensure you've updated both Google and GitHub settings

### Build Fails
- Check all required environment variables are set
- Verify `AUTH_SECRET` is 32+ characters
- Check build logs in Vercel dashboard

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Ensure migrations have been run
