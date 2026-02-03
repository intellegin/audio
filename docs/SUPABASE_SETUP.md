# Supabase Database Setup Guide

This guide will help you set up your Supabase database and run migrations.

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign in or create an account
3. Click **"New Project"**
4. Fill in:
   - **Name**: `infinitunes` (or your preferred name)
   - **Database Password**: Choose a strong password (⚠️ **SAVE THIS!**)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier works fine for development

## Step 2: Get Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string** section
3. Select the **URI** tab
4. Copy the connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password

**Example:**
```
postgresql://postgres:MySecurePassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

## Step 3: Run Database Migrations

You have two options to set up your database tables:

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **"New Query"**
3. Copy and paste the contents of each migration file in order:
   - `src/lib/db/migrations/0000_fresh_psynapse.sql`
   - `src/lib/db/migrations/0001_flaky_wrecking_crew.sql`
   - `src/lib/db/migrations/0002_unusual_dreaming_celestial.sql`
   - `src/lib/db/migrations/0003_right_snowbird.sql`
   - `src/lib/db/migrations/0004_sweet_spiral.sql`
   - `src/lib/db/migrations/0005_clever_cargill.sql`
   - `src/lib/db/migrations/0006_simple_squadron_sinister.sql`
4. Run each query (click "Run" or press Cmd/Ctrl + Enter)
5. Verify tables were created: Go to **Table Editor** → You should see:
   - `user`
   - `account`
   - `verificationToken`
   - `infinitunes_playlist`
   - `infinitunes_favorite`

### Option B: Using Migration Script

1. Add your database URL to `.env.local`:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

2. Run migrations:
   ```bash
   pnpm db:migrate
   ```

3. Verify in Supabase dashboard → **Table Editor**

## Step 4: Verify Database Setup

1. Go to **Table Editor** in Supabase
2. You should see these tables:
   - ✅ `user` - User accounts
   - ✅ `account` - OAuth account links
   - ✅ `verificationToken` - Email verification tokens
   - ✅ `infinitunes_playlist` - User playlists
   - ✅ `infinitunes_favorite` - User favorites

## Step 5: Test Database Connection

1. Try signing up in your app
2. Check Supabase → **Table Editor** → **user** table
3. You should see a new user row appear

## Database Schema Overview

### `user` Table
- `id` (UUID) - Primary key
- `name` (text) - User's display name
- `email` (text) - User's email (unique)
- `username` (text) - Optional username (unique)
- `password` (text) - Hashed password (for email/password auth)
- `emailVerified` (timestamp) - Email verification date
- `image` (text) - Profile image URL

### `account` Table
- Links OAuth providers (Google, GitHub) to users
- Stores OAuth tokens and refresh tokens

### `infinitunes_playlist` Table
- `id` (UUID) - Primary key
- `name` (text) - Playlist name
- `description` (text) - Optional description
- `userId` (UUID) - Foreign key to user
- `songs` (text[]) - Array of song IDs
- `createdAt` (timestamp) - Creation date

### `infinitunes_favorite` Table
- `id` (UUID) - Primary key
- `userId` (UUID) - Foreign key to user
- `songs` (text[]) - Favorite song IDs
- `albums` (text[]) - Favorite album IDs
- `playlists` (text[]) - Favorite playlist IDs
- `artists` (text[]) - Favorite artist IDs
- `podcasts` (text[]) - Favorite podcast IDs

## Troubleshooting

### "Connection refused" Error
- Verify `DATABASE_URL` is correct
- Check Supabase project is active (not paused)
- Ensure password is correct (no extra spaces)

### "Table does not exist" Error
- Run migrations (see Step 3)
- Check Supabase → Table Editor to verify tables exist
- Ensure you ran migrations in order (0000, 0001, 0002, etc.)

### "Permission denied" Error
- Check database password is correct
- Verify connection string format
- Ensure Supabase project is not paused

### Migrations Fail
- Check Supabase logs: **Logs** → **Postgres Logs**
- Verify connection string is correct
- Try running migrations via SQL Editor instead

## Security Best Practices

1. **Never commit database passwords** - Already in `.gitignore`
2. **Use environment variables** - Store `DATABASE_URL` in `.env.local`
3. **Enable Row Level Security** - In Supabase → Authentication → Policies
4. **Use connection pooling** - Supabase provides connection pooler URLs
5. **Rotate passwords regularly** - Especially in production

## Connection Pooling (Production)

For production, use Supabase's connection pooler:

1. Go to **Settings** → **Database**
2. Find **Connection Pooling** section
3. Use the **Session** or **Transaction** pooler URL
4. Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

This helps with connection limits and performance.

## Next Steps

After setting up Supabase:
1. ✅ Add `DATABASE_URL` to Vercel environment variables
2. ✅ Deploy your app
3. ✅ Test user registration/login
4. ✅ Verify data appears in Supabase tables

See `VERCEL_DEPLOYMENT.md` for deployment instructions.
