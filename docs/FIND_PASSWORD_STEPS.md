# Step-by-Step: Finding or Resetting Your Supabase Database Password

Since you can't find the password in the dashboard, here's the easiest way:

## Option 1: Reset the Password (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `rhvyeqwkvppghidcrxak`

2. **Click "Settings"** (gear icon in left sidebar)

3. **Click "Database"** (in the settings menu)

4. **Look for these sections** (scroll down if needed):
   - **"Database password"** section
   - **"Connection string"** section  
   - **"Connection info"** section
   - A button that says **"Reset database password"** or **"Change password"**

5. **If you see "Reset database password"**:
   - Click it
   - Confirm the reset
   - Copy the new password immediately (you won't see it again!)
   - Add it to `.env.local`:
     ```env
     SUPABASE_DB_PASSWORD=your-new-password-here
     ```

## Option 2: Check Connection String Section

1. In **Settings → Database**, scroll down to **"Connection string"**

2. You might see tabs: **Session**, **Transaction**, **URI**

3. Click the **"URI"** tab

4. You'll see a connection string like:
   ```
   postgresql://postgres:YOUR_PASSWORD@db.rhvyeqwkvppghidcrxak.supabase.co:5432/postgres
   ```

5. The password is between `postgres:` and `@`

## Option 3: Use Supabase CLI (If you have it installed)

```bash
supabase db reset --password your-new-password
```

## Option 4: Check Your Email

- Check your email inbox for the Supabase project creation confirmation
- The initial database password might be in that email

## Still Can't Find It?

If none of these work:
1. Try clicking **"Connect"** button on your project dashboard
2. Or contact Supabase support: https://supabase.com/support
3. Or check Supabase documentation: https://supabase.com/docs/guides/database/connecting-to-postgres

## After You Get the Password

Add it to `.env.local`:
```env
SUPABASE_DB_PASSWORD=your-password-here
```

Then test:
```bash
pnpm tsx test-db-connection.ts
```
