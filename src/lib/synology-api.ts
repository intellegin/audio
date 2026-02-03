"use server";

/**
 * Synology NAS API adapter using File Station API
 * 
 * This file provides functions to fetch music data from Synology NAS
 * by browsing the file system using File Station API.
 * Only accessible by admin users.
 */

import { env } from "./env";
import { isAdmin } from "./auth";
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
};

/**
 * Check if user has admin access
 */
async function checkAdminAccess() {
  const hasAccess = await isAdmin();
  if (!hasAccess) {
    throw new Error("Access denied: Synology NAS is only available to admin users");
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

  await checkAdminAccess();

  const baseUrl = getSynologyBaseUrl();
  const username = env.SYNOLOGY_USERNAME;
  const password = env.SYNOLOGY_PASSWORD;

  if (!username || !password) {
    throw new Error("SYNOLOGY_USERNAME and SYNOLOGY_PASSWORD must be configured");
  }

  try {
    // Login to get session ID for File Station
    const loginUrl = `${baseUrl}/webapi/auth.cgi?api=SYNO.API.Auth&version=3&method=login&account=${encodeURIComponent(username)}&passwd=${encodeURIComponent(password)}&session=FileStation&format=sid`;
    
    const response = await fetch(loginUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

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
    console.error("Synology authentication error:", error);
    throw error;
  }
}

/**
 * Make API call to Synology File Station
 */
async function fileStationApiCall<T>(api: string, method: string, params: Record<string, string> = {}): Promise<T> {
  await checkAdminAccess();
  
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
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Synology API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as SynologyApiResponse<T>;
    
    if (!data.success) {
      throw new Error(`Synology API error: ${data.error?.code || "Unknown error"}`);
    }

    return data.data as T;
  } catch (error) {
    console.error("Synology File Station API call error:", error);
    throw error;
  }
}

/**
 * List files in a directory
 */
async function listFiles(folderPath: string, recursive = false): Promise<SynologyFile[]> {
  const data = await fileStationApiCall<{ files: SynologyFile[] }>(
    "SYNO.FileStation.List",
    "list",
    {
      folder_path: folderPath,
      additional: '["size","owner","time"]',
      recursive: recursive ? "true" : "false",
    }
  );

  return data.files || [];
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
 * Parse audio file name to extract metadata
 * Format: "Artist - Album - Track Number - Title.ext" or "Artist - Title.ext"
 */
function parseAudioFileName(filename: string, folderPath: string): AudioFileInfo {
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
    path: `${folderPath}/${filename}`,
    name: filename,
    artist,
    album,
    title,
    track,
    mtime: Date.now(),
  };
}

/**
 * Recursively find all audio files in a directory
 */
async function findAudioFiles(basePath: string): Promise<AudioFileInfo[]> {
  const audioFiles: AudioFileInfo[] = [];
  
  try {
    const files = await listFiles(basePath, true);
    
    const processFile = (file: SynologyFile) => {
      if (!file.isdir && isAudioFile(file.name)) {
        const folderPath = file.path.substring(0, file.path.lastIndexOf("/"));
        const info = parseAudioFileName(file.name, folderPath);
        info.mtime = file.additional?.time?.mtime || Date.now();
        audioFiles.push(info);
      }
      
      if (file.children) {
        file.children.forEach(processFile);
      }
    };
    
    files.forEach(processFile);
  } catch (error) {
    console.error("Error finding audio files:", error);
  }
  
  return audioFiles;
}

/**
 * Build download URL for audio file
 */
function getFileDownloadUrl(filePath: string, baseUrl: string, sessionId: string): string {
  return `${baseUrl}/webapi/entry.cgi?api=SYNO.FileStation.Download&version=2&method=download&path=${encodeURIComponent(filePath)}&_sid=${sessionId}`;
}

/**
 * Build image URL (placeholder for now)
 */
function getSynologyImageUrl(): Quality {
  return {
    quality: "500x500",
    link: "/images/placeholder/album.jpg",
  };
}

/**
 * Map audio file to Song format
 */
function mapFileToSong(file: AudioFileInfo, baseUrl: string, sessionId: string, index: number = 0): Song {
  const fileId = Buffer.from(file.path).toString("base64").replace(/[+/=]/g, "");
  
  return {
    id: fileId,
    name: file.title || file.name.replace(/\.[^/.]+$/, ""),
    subtitle: file.artist || "Unknown Artist",
    type: "song",
    image: getSynologyImageUrl(),
    download_url: getFileDownloadUrl(file.path, baseUrl, sessionId),
    url: `/song/${fileId}`,
    album: file.album || "Unknown Album",
    primary_artists: file.artist || "Unknown Artist",
    singers: file.artist || "Unknown Artist",
    language: "unknown",
    duration: 0,
    year: file.year?.toString() || "",
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
  await checkAdminAccess();
  
  try {
    const baseUrl = getSynologyBaseUrl();
    const sessionId = await getSynologySession();
    const audioPath = env.SYNOLOGY_AUDIO_STATION_PATH || "/audio";

    // Find all audio files
    const audioFiles = await findAudioFiles(audioPath);
    
    // Sort by modification time (newest first)
    const recentFiles = audioFiles
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 20);

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
        id: Buffer.from(artist).toString("base64").replace(/[+/=]/g, ""),
        image: getSynologyImageUrl(),
        url: `/artist/${Buffer.from(artist).toString("base64").replace(/[+/=]/g, "")}`,
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
  await checkAdminAccess();
  
  const baseUrl = getSynologyBaseUrl();
  const sessionId = await getSynologySession();
  const audioPath = env.SYNOLOGY_AUDIO_STATION_PATH || "/audio";

  try {
    const fileIds = Array.isArray(token) ? token : [token];
    const allFiles = await findAudioFiles(audioPath);
    
    const songs = fileIds
      .map(id => {
        try {
          const filePath = Buffer.from(id, "base64").toString("utf-8");
          const file = allFiles.find(f => f.path === filePath);
          return file;
        } catch {
          return null;
        }
      })
      .filter((file): file is AudioFileInfo => file !== null)
      .map((file, index) => mapFileToSong(file, baseUrl, sessionId, index));

    return { songs };
  } catch (error) {
    console.error("Synology getSongDetails error:", error);
    return { songs: [] };
  }
}

/**
 * Get album details from Synology NAS
 */
export async function getAlbumDetails(token: string, mini = true): Promise<Album> {
  await checkAdminAccess();
  
  const baseUrl = getSynologyBaseUrl();
  const sessionId = await getSynologySession();
  const audioPath = env.SYNOLOGY_AUDIO_STATION_PATH || "/audio";

  try {
    const allFiles = await findAudioFiles(audioPath);
    
    // Decode album name from token
    const albumName = Buffer.from(token, "base64").toString("utf-8");
    const albumFiles = allFiles.filter(f => f.album === albumName);
    
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
  await checkAdminAccess();
  
  const baseUrl = getSynologyBaseUrl();
  const sessionId = await getSynologySession();
  const audioPath = env.SYNOLOGY_AUDIO_STATION_PATH || "/audio";

  try {
    const allFiles = await findAudioFiles(audioPath);
    
    // Decode artist name from token
    const artistName = Buffer.from(token, "base64").toString("utf-8");
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
      url: `/album/${Buffer.from(albumName).toString("base64").replace(/[+/=]/g, "")}`,
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
  await checkAdminAccess();
  
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
        url: `/artist/${Buffer.from(artist).toString("base64").replace(/[+/=]/g, "")}`,
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
        id: Buffer.from(album).toString("base64").replace(/[+/=]/g, ""),
        name: album,
        subtitle: matchingFiles.find(f => f.album === album)?.artist || "Unknown Artist",
        type: "album" as const,
        image: getSynologyImageUrl(),
        url: `/album/${Buffer.from(album).toString("base64").replace(/[+/=]/g, "")}`,
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
  await checkAdminAccess();
  return {
    top_artists: [],
    top_playlists: [],
    new_releases: [],
  };
}

export async function getFooterDetails(lang?: Lang[]): Promise<FooterDetails> {
  await checkAdminAccess();
  return {
    artist: [],
    actor: [],
    album: [],
    playlist: [],
  };
}

export async function getTopSearches(): Promise<TopSearch[]> {
  await checkAdminAccess();
  return [];
}
