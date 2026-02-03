# How to Get Your Supabase Database Password

## Finding Your Database Password

### Step 1: Go to Supabase Dashboard
1. Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project (or create a new one)

### Step 2: Navigate to Database Settings
1. Click on **Settings** in the left sidebar
2. Click on **Database** in the settings menu

### Step 3: Find or Reset Database Password

The database password location varies depending on your Supabase project setup. Try these methods:

#### Method 1: Connection String (Easiest)
1. In the **Database** settings page, scroll down to find **"Connection string"** or **"Connection pooling"**
2. Click on the **"URI"** tab (not Session or Transaction)
3. You'll see a connection string like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.rhvyeqwkvppghidcrxak.supabase.co:5432/postgres
   ```
4. The password is the part between `postgres:` and `@`
5. Copy that password value

#### Method 2: Database Password Section
- Look for a section called **"Database password"** or **"Postgres password"**
- If you see it masked, click the **eye icon** to reveal it
- If you see **"Reset database password"** button, click it to set/reset your password

#### Method 3: Project Settings → Database
- Sometimes it's under **Project Settings** → **Database** → **Database password**
- Or look for **"Connection info"** section

#### Method 4: If You Can't Find It
If you can't find the password anywhere:
1. Click **"Reset database password"** (if available)
2. Or go to **Project Settings** → **Database** → Look for password reset option
3. Generate a new password and save it securely

### Step 4: Set Environment Variable

#### For Local Development (.env.local)
Add this line to your `.env.local` file:
```env
SUPABASE_DB_PASSWORD=your-actual-database-password-here
```

#### For Vercel Deployment
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `SUPABASE_DB_PASSWORD`
   - **Value**: Your database password (paste it)
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

## Alternative: Connection String Method

If you prefer, you can also get the full connection string from Supabase:

1. Go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Select the **URI** tab
4. Copy the connection string (it will look like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. Extract just the password part (between `postgres:` and `@`)

## Important Notes

- **Keep your password secure**: Never commit it to git or share it publicly
- **The password is different from**:
  - `SUPABASE_SERVICE_ROLE_KEY` (for API authentication)
  - `SUPABASE_URL` (your project URL)
- **If you reset the password**: Update it in all places (`.env.local`, Vercel, etc.)

## Testing Your Connection

After setting `SUPABASE_DB_PASSWORD`, test the connection:
```bash
pnpm tsx test-db-connection.ts
```

This will verify that your database connection is working correctly.
