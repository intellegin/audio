# Alternative: Get Password from Connection String

If you can't find a "Database password" section, you can extract it from the connection string:

## Step-by-Step:

1. **Go to Supabase Dashboard** → Your Project → **Settings** → **Database**

2. **Scroll down** to find **"Connection string"** section

3. **Click on the "URI" tab** (you'll see tabs like: Session, Transaction, URI)

4. **Copy the connection string** - it will look like:
   ```
   postgresql://postgres:YOUR_PASSWORD_HERE@db.rhvyeqwkvppghidcrxak.supabase.co:5432/postgres
   ```

5. **Extract the password**:
   - The password is between `postgres:` and `@`
   - In the example above, `YOUR_PASSWORD_HERE` is your database password

6. **Add it to `.env.local`**:
   ```env
   SUPABASE_DB_PASSWORD=YOUR_PASSWORD_HERE
   ```

## Example:
If your connection string is:
```
postgresql://postgres:MySecurePass123!@db.rhvyeqwkvppghidcrxak.supabase.co:5432/postgres
```

Then your `SUPABASE_DB_PASSWORD` would be:
```env
SUPABASE_DB_PASSWORD=MySecurePass123!
```

## Still Can't Find It?

If you still can't find the connection string or password:
1. Try looking in **Project Settings** → **Database** → **Connection info**
2. Or check if there's a **"Show connection string"** button
3. You might need to **reset your database password** first (look for a reset button)
