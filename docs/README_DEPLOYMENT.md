# 🚀 Deployment Guide: Vercel + Supabase

Complete guide to deploy your music player to Vercel with Supabase database.

## 📋 Quick Overview

This app uses:
- **Frontend/Backend**: Next.js (deployed on Vercel)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js (Google, GitHub, Email/Password)
- **Music Source**: Plex Media Server (or JioSaavn API)

## 🎯 What You Need

1. **Vercel Account** (free) - https://vercel.com
2. **Supabase Account** (free tier available) - https://supabase.com
3. **GitHub/GitLab/Bitbucket** - To host your code
4. **OAuth Apps** (optional but recommended):
   - Google Cloud Console account
   - GitHub account

## 📚 Documentation Files

- **`QUICK_START_VERCEL.md`** - 5-minute quick start guide ⚡
- **`VERCEL_DEPLOYMENT.md`** - Detailed step-by-step deployment guide 📖
- **`SUPABASE_SETUP.md`** - Database setup and migration guide 🗄️
- **`DEPLOYMENT_CHECKLIST.md`** - Pre-flight checklist ✅
- **`.env.vercel.example`** - Environment variables template 🔑

## 🚀 Quick Start (5 Minutes)

### 1. Create Supabase Project
- Go to https://supabase.com → New Project
- Save your database password
- Copy connection string from Settings → Database

### 2. Set Up OAuth (Optional)
- **Google**: https://console.cloud.google.com → Create OAuth Client
- **GitHub**: https://github.com/settings/developers → New OAuth App

### 3. Deploy to Vercel
- Push code to GitHub
- Go to https://vercel.com/new → Import repository
- Add environment variables (see `.env.vercel.example`)
- Deploy!

### 4. Run Database Migrations
- Go to Supabase → SQL Editor
- Run migration files from `src/lib/db/migrations/` in order

### 5. Test
- Visit your deployed app
- Try signing up
- Check Supabase → Table Editor → user table

## 🔑 Required Environment Variables

### Minimum Required:
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

See `.env.vercel.example` for complete list.

## 📦 Database Schema

Your Supabase database will have these tables:

- **`user`** - User accounts (email, name, username, etc.)
- **`account`** - OAuth account links (Google, GitHub)
- **`verificationToken`** - Email verification tokens
- **`infinitunes_playlist`** - User-created playlists
- **`infinitunes_favorite`** - User favorites (songs, albums, etc.)

## 🔧 Migration Files

All migrations are in `src/lib/db/migrations/`:
- `0000_fresh_psynapse.sql` - Initial schema
- `0001_flaky_wrecking_crew.sql` - Updates
- `0002_unusual_dreaming_celestial.sql` - Updates
- `0003_right_snowbird.sql` - UUID migration
- `0004_sweet_spiral.sql` - Playlist table
- `0005_clever_cargill.sql` - Favorites table
- `0006_simple_squadron_sinister.sql` - Final updates

Run them in order via Supabase SQL Editor or `pnpm db:migrate`.

## 🎵 Music Source Configuration

### Option 1: Plex Media Server
```env
API_PROVIDER=plex
PLEX_URL=http://your-nas-ip:32400
PLEX_TOKEN=your-plex-token
```

**Note**: Your NAS must be accessible from the internet for Vercel to connect. Consider:
- VPN setup
- Reverse proxy (nginx, Caddy)
- Custom API backend

### Option 2: JioSaavn API
```env
API_PROVIDER=jiosaavn
JIOSAAVN_API_URL=https://your-api-url.com
```

### Option 3: Custom API
```env
API_PROVIDER=custom
JIOSAAVN_API_URL=http://your-custom-api.com
```

## 🐛 Common Issues

### Build Fails
- Check all required env vars are set in Vercel
- Verify `AUTH_SECRET` is 32+ characters
- Check build logs in Vercel dashboard

### Database Connection Fails
- Verify `DATABASE_URL` format is correct
- Check Supabase project is active
- Test connection string locally first

### Authentication Doesn't Work
- Verify `AUTH_URL` matches your Vercel domain exactly
- Check OAuth redirect URLs match in provider settings
- Ensure `AUTH_SECRET` is set

### Users Not Saving
- Run database migrations
- Check Supabase → Table Editor → tables exist
- Verify `DATABASE_URL` has correct permissions

## 📖 Next Steps

1. Read `QUICK_START_VERCEL.md` for fastest setup
2. Follow `VERCEL_DEPLOYMENT.md` for detailed instructions
3. Use `DEPLOYMENT_CHECKLIST.md` to verify everything
4. Check `SUPABASE_SETUP.md` for database-specific help

## 🔗 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://app.supabase.com)
- [Google Cloud Console](https://console.cloud.google.com)
- [GitHub OAuth Apps](https://github.com/settings/developers)

## 💡 Pro Tips

1. **Use Vercel's Environment Variables** - Don't hardcode secrets
2. **Test Locally First** - Set up `.env.local` and test before deploying
3. **Use Supabase Connection Pooler** - For production, use pooler URL
4. **Enable Row Level Security** - In Supabase for production data protection
5. **Monitor Build Logs** - Check Vercel logs if deployment fails
6. **Backup Database** - Supabase handles this, but export important data

## ✅ Success Criteria

Your deployment is successful when:
- ✅ App builds without errors on Vercel
- ✅ Can access app at `https://your-app.vercel.app`
- ✅ Can sign up with Google/GitHub
- ✅ User appears in Supabase `user` table
- ✅ Can create playlists
- ✅ Music loads (if API configured)

Good luck with your deployment! 🎉
