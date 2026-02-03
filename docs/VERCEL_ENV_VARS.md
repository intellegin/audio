# Vercel Environment Variables

## ✅ Required Variables

Only **ONE** variable is required for deployment:

### `DATABASE_URL` (REQUIRED)
- **Description**: Supabase PostgreSQL connection string
- **Format**: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
- **Where to get**: Supabase Dashboard → Settings → Database → Connection string (URI)
- **Example**: `postgresql://postgres:mypassword123@db.abcdefghijklmnop.supabase.co:5432/postgres`

---

## 🔧 Optional Variables

All other variables are optional. The app will work without them, but some features may be disabled.

### Authentication (Optional)

#### `AUTH_SECRET`
- **Description**: Secret key for NextAuth.js session encryption
- **Default**: Uses development secret if not set (not secure for production)
- **Generate**: `openssl rand -base64 32`
- **Recommended**: Set this in production for security

#### `AUTH_URL`
- **Description**: Base URL for your application (for OAuth callbacks)
- **Default**: Auto-detected from Vercel URL or `http://localhost:3000`
- **Example**: `https://your-app.vercel.app`
- **Note**: Vercel automatically sets this, so usually not needed

### OAuth Providers (Optional)

These are only needed if you want Google/GitHub login:

#### `GOOGLE_CLIENT_ID`
- **Description**: Google OAuth Client ID
- **Where to get**: Google Cloud Console → APIs & Services → Credentials
- **Required with**: `GOOGLE_CLIENT_SECRET`

#### `GOOGLE_CLIENT_SECRET`
- **Description**: Google OAuth Client Secret
- **Where to get**: Google Cloud Console → APIs & Services → Credentials
- **Required with**: `GOOGLE_CLIENT_ID`

#### `GITHUB_CLIENT_ID`
- **Description**: GitHub OAuth App Client ID
- **Where to get**: GitHub Settings → Developer settings → OAuth Apps
- **Required with**: `GITHUB_CLIENT_SECRET`

#### `GITHUB_CLIENT_SECRET`
- **Description**: GitHub OAuth App Client Secret
- **Where to get**: GitHub Settings → Developer settings → OAuth Apps
- **Required with**: `GITHUB_CLIENT_ID`

**Note**: If OAuth credentials are not provided, users can still sign in using email/password (Credentials provider).

### Music API Configuration (Optional)

#### `API_PROVIDER`
- **Description**: Which music API to use
- **Options**: `jiosaavn`, `plex`, or `custom`
- **Default**: `jiosaavn`
- **Required with**: See corresponding API variables below

#### `JIOSAAVN_API_URL` (if `API_PROVIDER=jiosaavn`)
- **Description**: JioSaavn API endpoint URL
- **Example**: `https://your-jiosaavn-api.com`

#### `PLEX_URL` (if `API_PROVIDER=plex`)
- **Description**: Your Plex Media Server URL
- **Example**: `http://192.168.1.100:32400` or `https://plex.yourdomain.com:32400`
- **Required with**: `PLEX_TOKEN`

#### `PLEX_TOKEN` (if `API_PROVIDER=plex`)
- **Description**: Plex authentication token
- **Where to get**: Plex Web → Developer Tools → Network tab → Look for `X-Plex-Token` header
- **Required with**: `PLEX_URL`

### Supabase (Optional)

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Description**: Supabase service role key for admin operations
- **Where to get**: Supabase Dashboard → Settings → API → Service Role Key
- **Note**: Only needed for admin operations, not required for basic functionality

### Rate Limiting (Optional)

#### `UPSTASH_REDIS_REST_URL`
- **Description**: Upstash Redis REST API URL
- **Where to get**: Upstash Dashboard → Redis → REST API
- **Required with**: `UPSTASH_REDIS_REST_TOKEN` and `ENABLE_RATE_LIMITING=true`

#### `UPSTASH_REDIS_REST_TOKEN`
- **Description**: Upstash Redis REST API token
- **Where to get**: Upstash Dashboard → Redis → REST API
- **Required with**: `UPSTASH_REDIS_REST_URL` and `ENABLE_RATE_LIMITING=true`

#### `ENABLE_RATE_LIMITING`
- **Description**: Enable rate limiting
- **Options**: `true` or `false`
- **Default**: `false`
- **Note**: Requires Upstash Redis credentials if enabled

#### `RATE_LIMITING_REQUESTS_PER_SECOND`
- **Description**: Maximum requests per second per IP
- **Default**: `50`
- **Note**: Only used if `ENABLE_RATE_LIMITING=true`

### Analytics (Optional)

#### `UMAMI_WEBSITE_ID`
- **Description**: Umami analytics website ID
- **Where to get**: Umami Dashboard → Websites → Copy Website ID

---

## 📋 Minimum Vercel Configuration

For the app to deploy and run, you only need:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
```

Everything else is optional!

---

## 🎯 Recommended Production Configuration

For a production deployment, you should also set:

```env
# Required
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres

# Recommended for security
AUTH_SECRET=generate-with-openssl-rand-base64-32

# If using OAuth (recommended)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Music API (choose one)
API_PROVIDER=plex
PLEX_URL=http://your-nas:32400
PLEX_TOKEN=your-plex-token

# Or
API_PROVIDER=jiosaavn
JIOSAAVN_API_URL=https://your-api-url.com
```

---

## 🔍 Quick Reference

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | ✅ **YES** | - | Supabase connection string |
| `AUTH_SECRET` | ❌ No | dev secret | Set for production security |
| `AUTH_URL` | ❌ No | auto-detect | Vercel sets automatically |
| `GOOGLE_CLIENT_ID` | ❌ No | - | Only if using Google OAuth |
| `GOOGLE_CLIENT_SECRET` | ❌ No | - | Only if using Google OAuth |
| `GITHUB_CLIENT_ID` | ❌ No | - | Only if using GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | ❌ No | - | Only if using GitHub OAuth |
| `API_PROVIDER` | ❌ No | `jiosaavn` | Choose music source |
| `PLEX_URL` | ❌ No | - | If `API_PROVIDER=plex` |
| `PLEX_TOKEN` | ❌ No | - | If `API_PROVIDER=plex` |
| `JIOSAAVN_API_URL` | ❌ No | - | If `API_PROVIDER=jiosaavn` |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ No | - | For admin operations |
| `UPSTASH_REDIS_REST_URL` | ❌ No | - | If rate limiting enabled |
| `UPSTASH_REDIS_REST_TOKEN` | ❌ No | - | If rate limiting enabled |
| `ENABLE_RATE_LIMITING` | ❌ No | `false` | Enable rate limiting |
| `UMAMI_WEBSITE_ID` | ❌ No | - | For analytics |

---

## 💡 Notes

1. **Without OAuth**: Users can still sign up/login using email and password
2. **Without Music API**: The UI will render but won't show music (graceful fallback)
3. **AUTH_SECRET**: While optional, you should set it in production for security
4. **AUTH_URL**: Vercel automatically provides this, so you usually don't need to set it
5. **Database**: Must be accessible from Vercel (Supabase is cloud-hosted, so this works)

---

## 🚀 Getting Started

1. **Minimum setup**: Just add `DATABASE_URL` to Vercel
2. **Test deployment**: App should build and deploy successfully
3. **Add features**: Add OAuth, music API, etc. as needed
