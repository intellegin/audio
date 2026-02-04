"use server";

/**
 * Synology NAS API adapter using File Station API
 * 
 * This file provides functions to fetch music data from Synology NAS
 * by browsing the file system using File Station API.
 * Only accessible by admin users.
 */

import { parseBuffer } from "music-metadata";
import { env } from "./env";
import type {
  Album,
  AllSearch,
  Artist,
  FooterDetails,
  Lang,
  MegaMenu,
  Modules,
  Quality,
  Song,
  SongObj,
  TopSearch,
} from "@/types";

// Synology File Station API types
type SynologyApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: {
    code: number;
  };
};

type SynologyFile = {
  path: string;
  name: string;
  isdir: boolean;
  children?: SynologyFile[];
  additional?: {
    size?: number;
    owner?: {
      user: string;
    };
    time?: {
      mtime: number;
      crtime: number;
      atime: number;
    };
  };
};

type AudioFileInfo = {
  path: string;
  name: string;
  artist?: string;
  album?: string;
  title?: string;
  year?: number;
  track?: number;
  mtime: number;
  duration?: number; // Duration in seconds from metadata
  genre?: string;
  picture?: Buffer; // Album art from metadata
};

// Metadata cache to avoid re-reading files
const metadataCache = new Map<string, Partial<AudioFileInfo>>();

/**
 * Check if Synology is configured
 * Music is accessible to all users (guests can read, authenticated users can interact)
 */
function checkSynologyConfigured() {
  if (!env.SYNOLOGY_SERVER_URL || !env.SYNOLOGY_USERNAME || !env.SYNOLOGY_PASSWORD) {
    throw new Error("Synology NAS is not configured");
  }
}

/**
 * Get Synology API base URL
 */
function getSynologyBaseUrl(): string {
  const serverUrl = env.SYNOLOGY_SERVER_URL;
  
  if (!serverUrl) {
    throw new Error("SYNOLOGY_SERVER_URL is not configured");
  }
  
  // Remove trailing slash if present
  return serverUrl.replace(/\/$/, "");
}

/**
 * Authenticate with Synology NAS and get session ID for File Station
 */
let sessionId: string | null = null;
let sessionExpiry: number = 0;

async function getSynologySession(): Promise<string> {
  // Return cached session if still valid
  if (sessionId && Date.now() < sessionExpiry) {
    return sessionId;
  }

  checkSynologyConfigured();

  const baseUrl = getSynologyBaseUrl();
  const username = env.SYNOLOGY_USERNAME;
  const password = env.SYNOLOGY_PASSWORD;

  if (!username || !password) {
    throw new Error("SYNOLOGY_USERNAME and SYNOLOGY_PASSWORD must be configured");
  }

  try {
    // Login to get session ID for File Station
    const loginUrl = `${baseUrl}/webapi/auth.cgi?api=SYNO.API.Auth&version=3&method=login&account=${encodeURIComponent(username)}&passwd=${encodeURIComponent(password)}&session=FileStation&format=sid`;
    
    // Add timeout for production (Vercel has 10s timeout for serverless functions)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(loginUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Synology login failed: ${response.statusText}`);
    }

    const data = await response.json() as SynologyApiResponse<{ sid: string; token?: string }> & { 
      error?: { 
        code?: number; 
        errors?: { 
          types?: Array<{ type: string }>; 
          token?: string;
        };
      };
    };
    
    if (!data.success || !data.data?.sid) {
      const errorCode = data.error?.code;
      const errorTypes = data.error?.errors?.types?.map(e => e.type) || [];
      
      if (errorCode === 403 && (errorTypes.includes("authenticator") || errorTypes.includes("otp"))) {
        throw new Error(
          "Synology NAS requires 2FA authentication. " +
          "Please either:\n" +
          "1. Disable 2FA for API access in Control Panel > Security > 2-Step Verification\n" +
          "2. Create an application-specific password for API access\n" +
          "3. Use a user account without 2FA enabled"
        );
      }
      
      if (errorCode === 402) {
        throw new Error("Synology authentication failed: Invalid username or password");
      }
      
      throw new Error(`Synology login failed: Code ${errorCode || "Unknown"}`);
    }

    sessionId = data.data.sid;
    sessionExpiry = Date.now() + (20 * 60 * 1000); // 20 minutes expiry
    
    return sessionId;
  } catch (error) {
    // Clear session on error
    sessionId = null;
    sessionExpiry = 0;
    
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("❌ Synology authentication timeout (production timeout limit)");
        throw new Error("Synology NAS connection timeout. Please check your network connection and NAS accessibility.");
      }
      console.error("❌ Synology authentication error:", error.message);
    } else {
      console.error("❌ Synology authentication error:", error);
    }
    throw error;
  }
}

/**
 * Make API call to Synology File Station
 */
async function fileStationApiCall<T>(api: string, method: string, params: Record<string, string> = {}): Promise<T> {
  checkSynologyConfigured();
  
  const baseUrl = getSynologyBaseUrl();
  const sessionId = await getSynologySession();
  
  const queryParams = new URLSearchParams({
    api,
    version: "2",
    method,
    ...params,
    _sid: sessionId,
  });

  const url = `${baseUrl}/webapi/entry.cgi?${queryParams.toString()}`;

  try {
    // Add timeout for production (Vercel has 10s timeout for serverless functions)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Synology API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as SynologyApiResponse<T>;
    
    if (!data.success) {
      throw new Error(`Synology API error: ${data.error?.code || "Unknown error"}`);
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("❌ Synology API call timeout (production timeout limit)");
        throw new Error("Synology NAS connection timeout. Please check your network connection.");
      }
      console.error("❌ Synology File Station API call error:", error.message);
    } else {
      console.error("❌ Synology File Station API call error:", error);
    }
    throw error;
  }
}

/**
 * List files in a directory
 */
async function listFiles(folderPath: string, recursive = false): Promise<SynologyFile[]> {
  try {
    const data = await fileStationApiCall<{ files: SynologyFile[] }>(
      "SYNO.FileStation.List",
      "list",
      {
        folder_path: folderPath,
        additional: '["size","owner","time"]',
        recursive: recursive ? "true" : "false",
      }
    );

    const files = data.files || [];
    console.log(`📂 Listed ${files.length} items in ${folderPath} (recursive: ${recursive})`);
    
    // If recursive didn't work, manually traverse directories
    if (recursive && files.length > 0) {
      const allFiles: SynologyFile[] = [...files];
      
      const traverseDir = async (file: SynologyFile) => {
        if (file.isdir) {
          try {
            const subFiles = await listFiles(file.path, false);
            allFiles.push(...subFiles);
            // Recursively process subdirectories
            for (const subFile of subFiles) {
              if (subFile.isdir) {
                await traverseDir(subFile);
              }
            }
          } catch (error) {
            console.warn(`⚠️  Could not list directory ${file.path}:`, error);
          }
        }
      };
      
      // Process all directories
      for (const file of files) {
        if (file.isdir) {
          await traverseDir(file);
        }
      }
      
      return allFiles;
    }
    
    return files;
  } catch (error) {
    console.error(`❌ Error listing files in ${folderPath}:`, error);
    throw error;
  }
}

/**
 * Check if file is an audio file
 */
function isAudioFile(filename: string): boolean {
  const audioExtensions = [".mp3", ".flac", ".m4a", ".aac", ".ogg", ".wav", ".wma", ".opus"];
  const lowerName = filename.toLowerCase();
  return audioExtensions.some(ext => lowerName.endsWith(ext));
}

/**
 * Extract metadata from audio file by fetching a chunk and parsing ID3 tags
 */
async function extractAudioMetadata(filePath: string, baseUrl: string, sessionId: string): Promise<Partial<AudioFileInfo>> {
  // Check cache first
  if (metadataCache.has(filePath)) {
    return metadataCache.get(filePath)!;
  }

  const defaultMetadata: Partial<AudioFileInfo> = {
    artist: undefined,
    album: undefined,
    title: undefined,
    year: undefined,
    track: undefined,
    duration: undefined,
    genre: undefined,
  };

  try {
    // Get download URL for the file
    const downloadUrl = `${baseUrl}/webapi/entry.cgi?api=SYNO.FileStation.Download&version=2&method=download&path=${encodeURIComponent(filePath)}&_sid=${sessionId}`;
    
    // Fetch first 64KB (enough for most metadata headers)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for metadata
    
    const response = await fetch(downloadUrl, {
      method: "GET",
      headers: {
        "Range": "bytes=0-65535", // First 64KB
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok && response.status !== 206) { // 206 is Partial Content (expected for Range requests)
      console.warn(`⚠️  Could not fetch metadata for ${filePath}: ${response.status}`);
      return defaultMetadata;
    }

    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      console.warn(`⚠️  Empty response for metadata ${filePath}`);
      return defaultMetadata;
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(arrayBuffer);
    } catch (error) {
      console.warn(`⚠️  Could not create buffer for ${filePath}:`, error);
      return defaultMetadata;
    }
    
    if (!buffer || buffer.length === 0) {
      console.warn(`⚠️  Empty buffer for metadata ${filePath}`);
      return defaultMetadata;
    }
    
    // Parse metadata using music-metadata
    let metadata;
    try {
      metadata = await parseBuffer(buffer, { mimeType: response.headers.get("content-type") || undefined });
    } catch (parseError) {
      console.warn(`⚠️  Could not parse metadata for ${filePath}:`, parseError instanceof Error ? parseError.message : String(parseError));
      return defaultMetadata;
    }
    
    const extracted: Partial<AudioFileInfo> = {
      artist: metadata.common.artist || metadata.common.artists?.[0],
      album: metadata.common.album,
      title: metadata.common.title,
      year: metadata.common.year,
      track: metadata.common.track?.no,
      duration: metadata.format.duration ? Math.round(metadata.format.duration) : undefined,
      genre: metadata.common.genre?.[0],
      picture: metadata.common.picture?.[0]?.data,
    };

    // Cache the result
    metadataCache.set(filePath, extracted);
    
    return extracted;
  } catch (error) {
    console.warn(`⚠️  Error extracting metadata for ${filePath}:`, error instanceof Error ? error.message : String(error));
    // Cache the empty result to avoid retrying
    metadataCache.set(filePath, defaultMetadata);
    return defaultMetadata;
  }
}

/**
 * Parse audio file name to extract metadata (fallback when ID3 tags aren't available)
 * Format: "Artist - Album - Track Number - Title.ext" or "Artist - Title.ext"
 */
function parseAudioFileName(filename: string, folderPath: string): Partial<AudioFileInfo> {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  const parts = nameWithoutExt.split(" - ");
  
  // Try to extract artist, album, track, title from folder structure
  const pathParts = folderPath.split("/").filter(Boolean);
  const artist = pathParts[pathParts.length - 2] || parts[0] || "Unknown Artist";
  const album = pathParts[pathParts.length - 1] || parts[1] || "Unknown Album";
  
  let title = nameWithoutExt;
  let track = 0;
  
  if (parts.length >= 2) {
    title = parts[parts.length - 1];
    if (parts.length >= 3 && /^\d+$/.test(parts[parts.length - 2])) {
      track = parseInt(parts[parts.length - 2], 10);
      title = parts[parts.length - 1];
    }
  }

  return {
    artist,
    album,
    title,
    track,
  };
}

/**
 * Recursively find all audio files in a directory and extract metadata
 */
async function findAudioFiles(basePath: string): Promise<AudioFileInfo[]> {
  const audioFiles: AudioFileInfo[] = [];
  
  try {
    console.log("🔍 Listing files in:", basePath, "(recursive)");
    const files = await listFiles(basePath, true);
    console.log("🔍 Got", files.length, "total items from File Station");
    
    const baseUrl = getSynologyBaseUrl();
    const sessionId = await getSynologySession();
    
    // Process all files to find audio files
    const audioFileList = files.filter(file => !file.isdir && isAudioFile(file.name));
    console.log(`🎵 Processing ${audioFileList.length} audio files for metadata extraction...`);
    
    // Process in batches to avoid overwhelming the server (limit to first 50 for performance)
    const maxFiles = 50;
    const filesToProcess = audioFileList.slice(0, maxFiles);
    const batchSize = 5; // Process 5 at a time
    
    for (let i = 0; i < filesToProcess.length; i += batchSize) {
      const batch = filesToProcess.slice(i, i + batchSize);
      const batchPromises = batch.map(async (file) => {
        try {
          const folderPath = file.path.substring(0, file.path.lastIndexOf("/"));
          const fullPath = file.path;
          
          // Try to extract metadata from ID3 tags
          const metadata = await extractAudioMetadata(fullPath, baseUrl, sessionId);
          
          // Fallback to filename parsing if metadata extraction failed
          const fallbackMetadata = parseAudioFileName(file.name, folderPath);
          
          // Use filename without extension as final fallback for title
          const filenameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
          
          const info: AudioFileInfo = {
            path: fullPath,
            name: file.name,
            artist: metadata.artist || fallbackMetadata.artist || "Unknown Artist",
            album: metadata.album || fallbackMetadata.album || "Unknown Album",
            title: metadata.title || fallbackMetadata.title || filenameWithoutExt,
            track: metadata.track || fallbackMetadata.track,
            year: metadata.year || fallbackMetadata.year,
            duration: metadata.duration,
            genre: metadata.genre,
            picture: metadata.picture,
            mtime: file.additional?.time?.mtime || Date.now(),
          };
          
          return info;
        } catch (error) {
          console.warn(`⚠️  Error processing ${file.name}:`, error instanceof Error ? error.message : String(error));
          // Return file with fallback metadata
          const folderPath = file.path.substring(0, file.path.lastIndexOf("/"));
          const fallback = parseAudioFileName(file.name, folderPath);
          return {
            path: file.path,
            name: file.name,
            artist: fallback.artist,
            album: fallback.album,
            title: fallback.title,
            track: fallback.track,
            mtime: file.additional?.time?.mtime || Date.now(),
          } as AudioFileInfo;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      audioFiles.push(...batchResults);
    }
    
    // Add remaining files with fallback metadata (no metadata extraction for performance)
    if (audioFileList.length > maxFiles) {
      const remaining = audioFileList.slice(maxFiles);
      remaining.forEach(file => {
        const folderPath = file.path.substring(0, file.path.lastIndexOf("/"));
        const fallback = parseAudioFileName(file.name, folderPath);
        audioFiles.push({
          path: file.path,
          name: file.name,
          artist: fallback.artist,
          album: fallback.album,
          title: fallback.title,
          track: fallback.track,
          mtime: file.additional?.time?.mtime || Date.now(),
        } as AudioFileInfo);
      });
    }
    
    console.log("🔍 Found", audioFiles.length, "audio files (", filesToProcess.length, "with metadata extraction)");
  } catch (error) {
    console.error("❌ Error finding audio files:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
  }
  
  return audioFiles;
}

/**
 * Build download URL for audio file
 * Returns an array of quality objects as expected by the UI
 */
function getFileDownloadUrl(filePath: string, baseUrl: string, sessionId: string): Quality {
  const downloadUrl = `${baseUrl}/webapi/entry.cgi?api=SYNO.FileStation.Download&version=2&method=download&path=${encodeURIComponent(filePath)}&_sid=${sessionId}`;
  // Return array format for Quality type
  return [
    { quality: "poor", link: downloadUrl },
    { quality: "low", link: downloadUrl },
    { quality: "medium", link: downloadUrl },
    { quality: "high", link: downloadUrl },
    { quality: "excellent", link: downloadUrl },
  ];
}

/**
 * Build image URL (placeholder for now)
 * Returns an array of quality objects as expected by the UI
 */
function getSynologyImageUrl(): Quality {
  const placeholder = "/images/placeholder/album.jpg";
  return [
    { quality: "50x50", link: placeholder },
    { quality: "150x150", link: placeholder },
    { quality: "500x500", link: placeholder },
  ];
}

/**
 * Map audio file to Song format
 */
function mapFileToSong(file: AudioFileInfo, baseUrl: string, sessionId: string, index: number = 0): Song {
  // Use URL-safe base64 encoding (replace + with -, / with _, remove = padding)
  const fileId = Buffer.from(file.path).toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  
  // Use metadata if available, fallback to filename parsing
  const songName = file.title || file.name.replace(/\.[^/.]+$/, "");
  const artistName = file.artist || "Unknown Artist";
  const albumName = file.album || "Unknown Album";
  const duration = file.duration || 0;
  
  return {
    id: fileId,
    name: songName,
    subtitle: artistName,
    type: "song",
    image: getSynologyImageUrl(), // TODO: Use file.picture if available
    download_url: getFileDownloadUrl(file.path, baseUrl, sessionId),
    url: `/song/${fileId}`,
    album: albumName,
    primary_artists: artistName,
    singers: artistName,
    language: "unknown",
    duration: duration,
    year: file.year || 0,
    play_count: "0",
    release_date: file.year?.toString() || "",
    explicit: false,
    vlink: "",
    triller_available: false,
  };
}

/**
 * Get home page data from Synology NAS
 */
export async function getHomeData(lang?: Lang[], mini = true): Promise<Modules> {
  checkSynologyConfigured();
  
  try {
    const baseUrl = getSynologyBaseUrl();
    const sessionId = await getSynologySession();
    const audioPath = env.SYNOLOGY_AUDIO_STATION_PATH || "/music";

    console.log("📁 Synology getHomeData - Starting scan of:", audioPath);

    // Find all audio files
    const audioFiles = await findAudioFiles(audioPath);
    
    console.log("📁 Found audio files:", audioFiles.length);
    
    // Sort by modification time (newest first)
    const recentFiles = audioFiles
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 20);
    
    console.log("📁 Recent files:", recentFiles.length);

    // Group by artist
    const artistMap = new Map<string, AudioFileInfo[]>();
    audioFiles.forEach(file => {
      const artist = file.artist || "Unknown Artist";
      if (!artistMap.has(artist)) {
        artistMap.set(artist, []);
      }
      artistMap.get(artist)!.push(file);
    });

    const topArtists = Array.from(artistMap.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10)
      .map(([artist]) => ({
        explicit: false,
        id: Buffer.from(artist).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ""),
        image: getSynologyImageUrl(),
        url: `/artist/${Buffer.from(artist).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")}`,
        subtitle: "",
        name: artist,
        type: "artist" as const,
      }));

    const mappedSongs = recentFiles.map((file, index) =>
      mapFileToSong(file, baseUrl, sessionId, index)
    );

    return {
      new_trending: {
        title: "Recently Added",
        subtitle: "From your Synology NAS",
        position: 0,
        data: mappedSongs,
      },
      charts: {
        title: "Artists",
        subtitle: "From your Synology NAS",
        position: 1,
        data: topArtists,
      },
      playlists: {
        title: "All Music",
        subtitle: "From your Synology NAS",
        position: 2,
        data: [],
      },
    };
  } catch (error) {
    console.error("Synology getHomeData error:", error);
    return {
      new_trending: { title: "", subtitle: "", position: 0, data: [] },
      charts: { title: "", subtitle: "", position: 1, data: [] },
      playlists: { title: "", subtitle: "", position: 2, data: [] },
    };
  }
}

/**
 * Get song details from Synology NAS
 */
export async function getSongDetails(token: string | string[], mini = false): Promise<SongObj> {
  try {
    checkSynologyConfigured();
  } catch (error) {
    console.error("❌ Synology not configured:", error);
    throw new Error("Synology NAS is not configured. Please check your environment variables.");
  }
  
  try {
    const baseUrl = getSynologyBaseUrl();
    const sessionId = await getSynologySession();
    const audioPath = env.SYNOLOGY_AUDIO_STATION_PATH || "/music";

    const fileIds = Array.isArray(token) ? token : [token];
    const allFiles = await findAudioFiles(audioPath);
    
    const songs = fileIds
      .map(id => {
        try {
          // Decode URL-safe base64 (reverse the encoding: - to +, _ to /, add padding if needed)
          let base64 = id.replace(/-/g, "+").replace(/_/g, "/");
          // Add padding if needed (base64 strings should be multiple of 4)
          while (base64.length % 4) {
            base64 += "=";
          }
          const filePath = Buffer.from(base64, "base64").toString("utf-8");
          const file = allFiles.find(f => f.path === filePath);
          if (!file) {
            console.warn(`⚠️  File not found for token: ${id} (decoded path: ${filePath})`);
          }
          return file;
        } catch (error) {
          console.error(`❌ Error decoding token ${id}:`, error);
          return null;
        }
      })
      .filter((file): file is AudioFileInfo => file !== null)
      .map((file, index) => mapFileToSong(file, baseUrl, sessionId, index));

    if (songs.length === 0) {
      throw new Error(`No songs found for token: ${Array.isArray(token) ? token.join(", ") : token}`);
    }

    return { songs };
  } catch (error) {
    console.error("❌ Synology getSongDetails error:", error);
    // Re-throw with a clear error message instead of returning empty array
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch song details from Synology NAS");
  }
}

/**
 * Get album details from Synology NAS
 */
export async function getAlbumDetails(token: string, mini = true): Promise<Album> {
  checkSynologyConfigured();
  
  const baseUrl = getSynologyBaseUrl();
  const sessionId = await getSynologySession();
  const audioPath = env.SYNOLOGY_AUDIO_STATION_PATH || "/audio";

  try {
    const allFiles = await findAudioFiles(audioPath);
    
    // Decode album key from URL-safe base64 token
    let albumKey: string;
    try {
      let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) {
        base64 += "=";
      }
      albumKey = Buffer.from(base64, "base64").toString("utf-8");
    } catch {
      albumKey = token; // Fallback if not base64
    }
    const [artistName, albumName] = albumKey.split("-");
    const albumFiles = allFiles.filter(f => f.artist === artistName && f.album === albumName);
    
    const songs = albumFiles.map((file, index) =>
      mapFileToSong(file, baseUrl, sessionId, index)
    );

    return {
      id: token,
      name: albumName,
      subtitle: albumFiles[0]?.artist || "Unknown Artist",
      type: "album",
      image: getSynologyImageUrl(),
      url: `/album/${token}`,
      songs,
      year: "",
      language: "unknown",
      play_count: "0",
      explicit: false,
      list_count: "0",
      list_type: "album",
      list: "",
      music: "",
      release_date: "",
      song_pids: songs.map((s) => s.id).join(","),
    };
  } catch (error) {
    console.error("Synology getAlbumDetails error:", error);
    throw error;
  }
}

/**
 * Get artist details from Synology NAS
 */
export async function getArtistDetails(token: string, mini = true): Promise<Artist> {
  checkSynologyConfigured();
  
  const baseUrl = getSynologyBaseUrl();
  const sessionId = await getSynologySession();
  const audioPath = env.SYNOLOGY_AUDIO_STATION_PATH || "/audio";

  try {
    const allFiles = await findAudioFiles(audioPath);
    
    // Decode artist name from URL-safe base64 token
    let artistName: string;
    try {
      let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) {
        base64 += "=";
      }
      artistName = Buffer.from(base64, "base64").toString("utf-8");
    } catch {
      artistName = token; // Fallback if not base64
    }
    const artistFiles = allFiles.filter(f => f.artist === artistName);
    
    // Group by album
    const albumMap = new Map<string, AudioFileInfo[]>();
    artistFiles.forEach(file => {
      const album = file.album || "Unknown Album";
      if (!albumMap.has(album)) {
        albumMap.set(album, []);
      }
      albumMap.get(album)!.push(file);
    });

    const albums = Array.from(albumMap.keys()).map(albumName => ({
      explicit: false,
      id: Buffer.from(albumName).toString("base64").replace(/[+/=]/g, ""),
      name: albumName,
      subtitle: artistName,
      type: "album" as const,
      image: getSynologyImageUrl(),
      url: `/album/${Buffer.from(`${artistName}-${albumName}`).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")}`,
      year: "",
      language: "unknown",
    }));

    const songs = artistFiles.map((file, index) =>
      mapFileToSong(file, baseUrl, sessionId, index)
    );

    return {
      id: token,
      name: artistName,
      subtitle: "",
      type: "artist",
      image: getSynologyImageUrl(),
      url: `/artist/${token}`,
      top_songs: songs.slice(0, 10),
      top_albums: albums,
      singles: [],
      similar_artists: [],
    };
  } catch (error) {
    console.error("Synology getArtistDetails error:", error);
    throw error;
  }
}

/**
 * Search all content on Synology NAS
 */
export async function searchAll(query: string): Promise<AllSearch> {
  checkSynologyConfigured();
  
  const baseUrl = getSynologyBaseUrl();
  const sessionId = await getSynologySession();
  const audioPath = env.SYNOLOGY_AUDIO_STATION_PATH || "/audio";

  try {
    const allFiles = await findAudioFiles(audioPath);
    const queryLower = query.toLowerCase();
    
    const matchingFiles = allFiles.filter(file =>
      file.name.toLowerCase().includes(queryLower) ||
      file.artist?.toLowerCase().includes(queryLower) ||
      file.album?.toLowerCase().includes(queryLower) ||
      file.title?.toLowerCase().includes(queryLower)
    );

    const songs = matchingFiles
      .slice(0, 20)
      .map((file, index) => mapFileToSong(file, baseUrl, sessionId, index));

    // Group by artist
    const artistMap = new Map<string, AudioFileInfo[]>();
    matchingFiles.forEach(file => {
      const artist = file.artist || "Unknown Artist";
      if (!artistMap.has(artist)) {
        artistMap.set(artist, []);
      }
      artistMap.get(artist)!.push(file);
    });

    const artists = Array.from(artistMap.keys())
      .slice(0, 20)
      .map(artist => ({
        explicit: false,
        id: Buffer.from(artist).toString("base64").replace(/[+/=]/g, ""),
        name: artist,
        subtitle: "",
        type: "artist" as const,
        image: getSynologyImageUrl(),
        url: `/artist/${Buffer.from(artist).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")}`,
      }));

    // Group by album
    const albumMap = new Map<string, AudioFileInfo[]>();
    matchingFiles.forEach(file => {
      const album = file.album || "Unknown Album";
      if (!albumMap.has(album)) {
        albumMap.set(album, []);
      }
      albumMap.get(album)!.push(file);
    });

    const albums = Array.from(albumMap.keys())
      .slice(0, 20)
      .map(album => ({
        explicit: false,
        id: Buffer.from(album).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ""),
        name: album,
        subtitle: matchingFiles.find(f => f.album === album)?.artist || "Unknown Artist",
        type: "album" as const,
        image: getSynologyImageUrl(),
        url: `/album/${Buffer.from(album).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")}`,
        year: "",
        language: "unknown",
      }));

    return {
      songs: { count: songs.length, last_page: true, data: songs },
      albums: { count: albums.length, last_page: true, data: albums },
      artists: { count: artists.length, last_page: true, data: artists },
      playlists: { count: 0, last_page: true, data: [] },
      shows: { count: 0, last_page: true, data: [] },
    };
  } catch (error) {
    console.error("Synology searchAll error:", error);
    return {
      songs: { count: 0, last_page: true, data: [] },
      albums: { count: 0, last_page: true, data: [] },
      artists: { count: 0, last_page: true, data: [] },
      playlists: { count: 0, last_page: true, data: [] },
      shows: { count: 0, last_page: true, data: [] },
    };
  }
}

/**
 * Stub functions for other API methods
 */
export async function getMegaMenu(entity = false, lang?: Lang[]): Promise<MegaMenu> {
  checkSynologyConfigured();
  return {
    top_artists: [],
    top_playlists: [],
    new_releases: [],
  };
}

export async function getFooterDetails(lang?: Lang[]): Promise<FooterDetails> {
  checkSynologyConfigured();
  return {
    artist: [],
    actor: [],
    album: [],
    playlist: [],
  };
}

export async function getTopSearches(): Promise<TopSearch[]> {
  checkSynologyConfigured();
  return [];
}
