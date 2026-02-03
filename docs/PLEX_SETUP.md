# Setting Up Plex Integration

This guide will help you connect this music player UI to your Plex Media Server running on your Synology NAS.

## Prerequisites

1. Plex Media Server running on your Synology NAS
2. Plex account with access to your music library
3. Network access to your NAS from your development machine

## Step 1: Get Your Plex Token

1. Log into your Plex Media Server web interface
2. Go to Settings → Network → Show Advanced
3. Or use this method:
   - Visit: `https://plex.tv/api/resources?includeHttps=1&X-Plex-Token=YOUR_TOKEN`
   - You can get your token from browser dev tools when logged into Plex Web

Alternatively, use a Plex token generator tool or check your Plex account settings.

## Step 2: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Plex Configuration
PLEX_URL=http://your-nas-ip:32400
PLEX_TOKEN=your-plex-token-here

# Switch to Plex provider
API_PROVIDER=plex

# Make JioSaavn optional (can be empty)
JIOSAAVN_API_URL=
```

Replace:
- `your-nas-ip` with your Synology NAS IP address (e.g., `192.168.1.100`)
- `your-plex-token-here` with your actual Plex token

## Step 3: Update API Calls

The `src/lib/plex-api.ts` file contains stub functions that need to be implemented with actual Plex API calls.

### Plex API Endpoints You'll Need:

- **Get Music Library**: `/library/sections` - List all libraries
- **Get Recently Added**: `/library/recentlyAdded?type=10` - Type 10 = music
- **Get All Tracks**: `/library/sections/{sectionId}/all?type=10`
- **Search**: `/search?query={query}&type=10`
- **Get Track Details**: `/library/metadata/{ratingKey}`
- **Get Album**: `/library/metadata/{ratingKey}/children`
- **Get Artist**: `/library/metadata/{ratingKey}`
- **Get Playlists**: `/playlists`

### Plex API Response Format:

Plex returns XML by default. To get JSON, add `&format=json` to your requests.

Example:
```
http://your-nas:32400/library/recentlyAdded?type=10&format=json&X-Plex-Token=YOUR_TOKEN
```

## Step 4: Map Plex Data to UI Format

The UI expects specific data structures (see `src/types/`). You'll need to map Plex responses to these formats:

- **Songs**: Map Plex `MediaContainer.Metadata` to `Song` type
- **Albums**: Map Plex album metadata to `Album` type  
- **Artists**: Map Plex artist metadata to `Artist` type
- **Playlists**: Map Plex playlists to `Playlist` type

## Step 5: Switch API Provider

Update `src/lib/jiosaavn-api.ts` to conditionally use Plex:

```typescript
import { env } from "./env";
import * as plexApi from "./plex-api";

export async function getHomeData() {
  if (env.API_PROVIDER === "plex") {
    return plexApi.getHomeData();
  }
  // ... existing JioSaavn code
}
```

Or create a unified API layer that routes to the correct provider.

## Step 6: Audio Streaming

For audio playback, you'll need to:

1. **Direct File Access**: If your NAS exposes files over HTTP/SMB
   - Map Plex `Media.Part.file` paths to accessible URLs
   - Or use Plex's streaming URLs: `/library/parts/{partId}/file?download=0&X-Plex-Token=TOKEN`

2. **Plex Streaming**: Use Plex's built-in streaming
   - Format: `http://your-nas:32400/library/parts/{partId}/file?download=0&X-Plex-Token=TOKEN`
   - Or use Plex's transcoding: Add `&transcode=1` for format conversion

## Alternative: Custom API Backend

Instead of calling Plex directly from Next.js, you could:

1. Create a small Node.js/Express API server
2. Have it query Plex and transform the data
3. Point `JIOSAAVN_API_URL` to your custom API
4. Your API returns data in the format the UI expects

This gives you more control and better error handling.

## Testing

1. Start your dev server: `pnpm dev`
2. Check browser console for any API errors
3. Test each page (home, search, song details, etc.)
4. Verify audio playback works

## Troubleshooting

- **CORS Issues**: Plex may block direct browser requests. Use a proxy or custom API backend.
- **Authentication**: Ensure your Plex token is valid and has access to music libraries
- **Network Access**: Make sure your dev machine can reach your NAS IP
- **SSL/HTTPS**: If using HTTPS, ensure certificates are valid

## Resources

- [Plex API Documentation](https://www.plex.tv/api/docs/)
- [Plex Token Guide](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/)
- [Plex Media Server URLs](https://support.plex.tv/articles/201638786-plex-media-server-urls/)
