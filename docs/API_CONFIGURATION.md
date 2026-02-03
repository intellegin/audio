# API Configuration Guide

This guide explains how to configure the music player to work with different music sources.

## Required Environment Variables

Add these to your `.env.local` file:

### For Plex Media Server:

```env
# Plex Configuration (REQUIRED for Plex)
PLEX_URL=http://your-nas-ip:32400
PLEX_TOKEN=your-plex-token-here

# API Provider Selection
API_PROVIDER=plex

# JioSaavn API (not needed for Plex, can be empty)
JIOSAAVN_API_URL=
```

### For JioSaavn API:

```env
# JioSaavn API Configuration
JIOSAAVN_API_URL=https://your-jiosaavn-api-url.com

# API Provider Selection
API_PROVIDER=jiosaavn

# Plex (not needed, can be empty)
PLEX_URL=
PLEX_TOKEN=
```

### For Custom API:

```env
# Custom API (must return data in JioSaavn format)
JIOSAAVN_API_URL=http://your-custom-api.com

# API Provider Selection
API_PROVIDER=custom

# Plex (not needed, can be empty)
PLEX_URL=
PLEX_TOKEN=
```

## Getting Your Plex Token

### Method 1: From Plex Web App
1. Log into Plex Web (https://app.plex.tv)
2. Open browser Developer Tools (F12)
3. Go to Network tab
4. Make any request in Plex Web
5. Look for requests to `plex.tv` - the `X-Plex-Token` header contains your token

### Method 2: Using Plex Token Script
Visit: https://plex.tv/api/resources?includeHttps=1&X-Plex-Token=YOUR_TOKEN

Or use a browser extension like "Plex Token" to extract it easily.

### Method 3: From Plex Settings
1. Log into your Plex Media Server web interface
2. Go to Settings → Network → Show Advanced
3. Check the server logs or use Plex's API documentation

## Finding Your NAS IP Address

### On Synology NAS:
1. Log into DSM (DiskStation Manager)
2. Go to Control Panel → Network → Network Interface
3. Your IP address will be listed there

### From Command Line:
```bash
# On macOS/Linux
ping your-nas-hostname.local

# Or check your router's admin panel for connected devices
```

## Plex Port

Default Plex port is **32400**. If you've changed it, update `PLEX_URL` accordingly.

Example:
- `http://192.168.1.100:32400` (local network)
- `https://your-nas-domain.com:32400` (if accessible via domain)

## Testing Your Configuration

After setting up your `.env.local`:

1. Restart your dev server: `pnpm dev`
2. Visit http://localhost:3000
3. Check the browser console for any API errors
4. Try searching for music
5. Click on a song/album to see if details load

## Troubleshooting

### "PLEX_URL and PLEX_TOKEN must be set"
- Make sure both variables are in `.env.local`
- Restart your dev server after adding them
- Check for typos in variable names

### "Plex API error: 401 Unauthorized"
- Your Plex token is invalid or expired
- Get a new token using one of the methods above
- Make sure the token has access to your music library

### "Plex API error: Network error"
- Your NAS IP address might be wrong
- Check if you can access `http://your-nas-ip:32400` in a browser
- Make sure your dev machine is on the same network as your NAS
- Check firewall settings on your NAS

### "No music showing"
- Check if your Plex library has music
- Verify the music library section ID (usually auto-detected)
- Check browser console for specific error messages

### CORS Issues
If you see CORS errors, you may need to:
- Use a proxy server
- Configure Plex to allow CORS (advanced)
- Use a custom API backend instead of direct Plex calls

## Data Mapping

The Plex API returns data in a different format than the UI expects. The implementation automatically maps:

- **Plex Tracks** → **Song objects**
- **Plex Albums** → **Album objects**  
- **Plex Artists** → **Artist objects**
- **Plex Playlists** → **Playlist objects**

Key mappings:
- `ratingKey` → `id`
- `title` → `name`
- `grandparentTitle` → `artist name`
- `parentTitle` → `album name`
- `thumb`/`art` → `image` (with proper URL formatting)
- `media[0].parts[0].key` → `music` (streaming URL)

## Audio Streaming

Audio files are streamed directly from Plex using URLs like:
```
http://your-nas:32400/library/parts/{partId}/file?X-Plex-Token={token}
```

The player component handles these URLs automatically.

## Next Steps

1. ✅ Set up your `.env.local` with Plex credentials
2. ✅ Restart the dev server
3. ✅ Test the home page and search
4. ✅ Try playing a song
5. ✅ Customize the UI as needed

If you encounter issues, check the browser console and server logs for detailed error messages.
