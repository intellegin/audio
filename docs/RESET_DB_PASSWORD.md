# How to Reset Your Supabase Database Password

If you can't find your database password, you'll need to reset it:

## Step-by-Step Reset Process

### Method 1: Through Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Settings**
   - Click **Settings** in the left sidebar
   - Click **Database**

3. **Look for Password Reset Options**
   - Look for a section called:
     - "Database password"
     - "Postgres password" 
     - "Reset database password"
     - "Change database password"
   - Or look for a **key icon** 🔑 or **lock icon** 🔒

4. **Reset the Password**
   - Click **"Reset database password"** or **"Change password"**
   - You may be asked to confirm
   - Generate a new password (or create your own)
   - **IMPORTANT**: Copy and save this password immediately - you won't be able to see it again!

5. **Add to `.env.local`**
   ```env
   SUPABASE_DB_PASSWORD=your-new-password-here
   ```

### Method 2: Check Project Creation Email

If you created the project recently:
- Check your email inbox for the Supabase project creation email
- The initial database password might be in that email

### Method 3: Contact Supabase Support

If you still can't find it:
- Go to Supabase Dashboard → Support
- Or check their documentation: https://supabase.com/docs

## After Resetting

Once you have the password:

1. **Add to `.env.local`**:
   ```env
   SUPABASE_DB_PASSWORD=your-password-here
   ```

2. **Add to Vercel** (for deployment):
   - Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `SUPABASE_DB_PASSWORD` with your password

3. **Test the connection**:
   ```bash
   pnpm tsx test-db-connection.ts
   ```

## Important Notes

- ⚠️ **Resetting the password will disconnect any existing connections**
- Make sure to update the password in all places (`.env.local`, Vercel, etc.)
- Keep the password secure and never commit it to git
