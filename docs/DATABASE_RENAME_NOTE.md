# Database Table Name Change: infinitunes → audio

## ⚠️ Important Note

The platform has been renamed from "Infinitunes" to "Audio". This affects database table names.

## What Changed

The table creator uses `siteConfig.name.toLowerCase().replace(/\s/g, "_")` to prefix table names.

**Old table names:**
- `infinitunes_playlist`
- `infinitunes_favorite`

**New table names:**
- `audio_playlist`
- `audio_favorite`

## If You Have Existing Data

If you've already run migrations and have data in the old tables, you have two options:

### Option 1: Fresh Start (Recommended for Development)

1. Drop existing tables in Supabase SQL Editor:
   ```sql
   DROP TABLE IF EXISTS infinitunes_favorite CASCADE;
   DROP TABLE IF EXISTS infinitunes_playlist CASCADE;
   ```

2. Run migrations again - they will create `audio_playlist` and `audio_favorite`

### Option 2: Migrate Existing Data

Create a migration to rename tables and preserve data:

```sql
-- Rename tables
ALTER TABLE infinitunes_playlist RENAME TO audio_playlist;
ALTER TABLE infinitunes_favorite RENAME TO audio_favorite;

-- Update constraints (if needed)
-- The constraint names will automatically update, but you may need to:
ALTER TABLE audio_playlist RENAME CONSTRAINT infinitunes_playlist_userId_user_id_fk TO audio_playlist_userId_user_id_fk;
ALTER TABLE audio_favorite RENAME CONSTRAINT infinitunes_favorite_userId_user_id_fk TO audio_favorite_userId_user_id_fk;
```

## If Starting Fresh

If you haven't run migrations yet, just run them normally:

```bash
pnpm db:migrate
```

The new tables will be created with the `audio_` prefix automatically.

## Verification

After migrations, verify in Supabase → Table Editor:
- ✅ `audio_playlist` table exists
- ✅ `audio_favorite` table exists
- ✅ Old `infinitunes_*` tables are gone (if you dropped them)
