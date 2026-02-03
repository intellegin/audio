# Vercel Deployment Guide

This guide will help you deploy your music player to Vercel and connect it to Supabase.

## Prerequisites

1. **Vercel Account** - Sign up at https://vercel.com
2. **Supabase Project** - Create one at https://supabase.com
3. **GitHub/GitLab/Bitbucket** - Your code repository

## Step 1: Set Up Supabase

### 1.1 Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: Your project name (e.g., "infinitunes")
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development

### 1.2 Get Your Database URL

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** tab
4. Copy the connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password

### 1.3 Run Database Migrations

You need to run the database migrations to create the tables:

**Option A: Using Supabase SQL Editor (Recommended)**

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Copy the contents of all migration files from `src/lib/db/migrations/`
4. Run them in order (0000, 0001, 0002, etc.)
5. Or use the migration script (see below)

**Option B: Using Migration Script**

```bash
# Install dependencies
pnpm install

# Set DATABASE_URL temporarily
export DATABASE_URL="your-supabase-connection-string"

# Run migrations
pnpm db:migrate
```

## Step 2: Set Up OAuth Providers (Optional but Recommended)

### 2.1 Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure:
   - **Application type**: Web application
   - **Name**: Infinitunes (or your app name)
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/api/auth/callback/google` (for local)
     - `https://your-app.vercel.app/api/auth/callback/google` (for production)
6. Copy **Client ID** and **Client Secret**

### 2.2 GitHub OAuth

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: Infinitunes
   - **Homepage URL**: `https://your-app.vercel.app`
   - **Authorization callback URL**: `https://your-app.vercel.app/api/auth/callback/github`
4. Copy **Client ID** and generate **Client Secret**

## Step 3: Deploy to Vercel

### 3.1 Connect Repository

1. Go to https://vercel.com/new
2. Import your Git repository
3. Vercel will auto-detect Next.js

### 3.2 Configure Environment Variables

In Vercel project settings, add these environment variables:

#### Required Variables:

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# NextAuth
AUTH_URL=https://your-app.vercel.app
AUTH_SECRET=generate-a-random-secret-here

# OAuth Providers (Required even if not using - use placeholder values)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# API Provider
API_PROVIDER=plex

# Plex Configuration (if using Plex)
PLEX_URL=http://your-nas-ip:32400
PLEX_TOKEN=your-plex-token

# Or JioSaavn API (if using)
JIOSAAVN_API_URL=https://your-api-url.com
```

#### Optional Variables:

```env
# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
ENABLE_RATE_LIMITING=false
RATE_LIMITING_REQUESTS_PER_SECOND=50

# Analytics
UMAMI_WEBSITE_ID=

# Skip env validation (for Docker builds)
SKIP_ENV_VALIDATION=false
```

### 3.3 Generate AUTH_SECRET

Generate a secure random secret:

```bash
# On macOS/Linux
openssl rand -base64 32

# Or use online generator
# https://generate-secret.vercel.app/32
```

### 3.4 Configure Build Settings

Vercel should auto-detect, but verify:

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build` (or `npm run build`)
- **Output Directory**: `.next`
- **Install Command**: `pnpm install` (or `npm install`)

### 3.5 Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Your app will be live at `https://your-app.vercel.app`

## Step 4: Post-Deployment Setup

### 4.1 Update OAuth Redirect URLs

After deployment, update your OAuth provider redirect URLs:

**Google:**
- Go to Google Cloud Console → Credentials
- Add: `https://your-app.vercel.app/api/auth/callback/google`

**GitHub:**
- Go to GitHub Settings → OAuth Apps
- Update Authorization callback URL to: `https://your-app.vercel.app/api/auth/callback/github`

### 4.2 Run Database Migrations (if not done)

If you haven't run migrations yet:

1. Go to Supabase SQL Editor
2. Run the migration files from `src/lib/db/migrations/`
3. Or use Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Run migrations (set DATABASE_URL in Vercel env vars first)
vercel env pull .env.local
pnpm db:migrate
```

### 4.3 Verify Database Connection

1. Go to your Vercel deployment
2. Try signing up/logging in
3. Check Supabase dashboard → **Table Editor** → **user** table
4. You should see new users appear

## Step 5: Environment Variables Reference

### Production Environment Variables Checklist

- [ ] `DATABASE_URL` - Supabase connection string
- [ ] `AUTH_URL` - Your Vercel app URL
- [ ] `AUTH_SECRET` - Random 32+ character string
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- [ ] `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- [ ] `GITHUB_CLIENT_SECRET` - GitHub OAuth secret
- [ ] `API_PROVIDER` - `plex`, `jiosaavn`, or `custom`
- [ ] `PLEX_URL` - (if using Plex) Your Plex server URL
- [ ] `PLEX_TOKEN` - (if using Plex) Your Plex token
- [ ] `JIOSAAVN_API_URL` - (if using JioSaavn) API URL

## Troubleshooting

### Build Fails

**Error: "Invalid environment variables"**
- Check all required env vars are set in Vercel
- Ensure `AUTH_SECRET` is set
- Verify `DATABASE_URL` format is correct

**Error: "Module not found"**
- Ensure `package.json` has all dependencies
- Check `pnpm install` completes successfully

### Database Connection Issues

**Error: "Connection refused"**
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Ensure database password is correct

**Error: "Table does not exist"**
- Run database migrations
- Check Supabase → Table Editor to verify tables exist

### Authentication Issues

**OAuth redirect fails**
- Verify redirect URLs match exactly in OAuth provider settings
- Check `AUTH_URL` matches your Vercel domain
- Ensure `AUTH_SECRET` is set

**Users not saving to database**
- Check database connection
- Verify migrations ran successfully
- Check Supabase logs for errors

### Plex Connection Issues (if using Plex)

**Error: "Plex API error"**
- `PLEX_URL` must be accessible from internet (not just local network)
- Consider using a VPN or reverse proxy
- Or use a custom API backend instead

**CORS errors**
- Plex doesn't allow direct browser connections
- Use a custom API backend or proxy

## Security Best Practices

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Use strong `AUTH_SECRET`** - Generate with `openssl rand -base64 32`
3. **Rotate secrets regularly** - Especially OAuth secrets
4. **Use environment-specific URLs** - Different for dev/staging/prod
5. **Enable Supabase Row Level Security** - For production data protection

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Connect to Supabase
3. ✅ Set up OAuth providers
4. ✅ Run database migrations
5. ✅ Test authentication
6. ✅ Configure custom domain (optional)
7. ✅ Set up monitoring (optional)

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
