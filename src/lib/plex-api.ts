"use server";

/**
 * Plex API adapter for the music player UI
 * 
 * This file provides functions to fetch music data from Plex Media Server
 * and map it to the format expected by the UI components.
 */

import { cookies } from "next/headers";
import { env } from "./env";
import type {
  Album,
  AllSearch,
  Artist,
  ArtistSongsOrAlbums,
  FooterDetails,
  Lang,
  MegaMenu,
  Modules,
  Playlist,
  Quality,
  Song,
  SongObj,
  TopSearch,
} from "@/types";

// Plex API types
type PlexMediaContainer<T = any> = {
  MediaContainer: {
    size: number;
    totalSize?: number;
    Metadata?: T[];
    [key: string]: any;
  };
};

type PlexTrack = {
  ratingKey: string;
  key: string;
  title: string;
  parentKey: string;
  parentTitle: string;
  grandparentKey: string;
  grandparentTitle: string;
  thumb?: string;
  art?: string;
  grandparentThumb?: string;
  grandparentArt?: string;
  year?: number;
  duration: number;
  viewCount?: number;
  summary?: string;
  media?: Array<{
    parts: Array<{
      key: string;
      file: string;
    }>;
  }>;
  Genre?: Array<{ tag: string }>;
  originalTitle?: string;
  addedAt?: number;
};

type PlexAlbum = {
  ratingKey: string;
  key: string;
  title: string;
  parentKey?: string;
  parentTitle?: string;
  thumb?: string;
  art?: string;
  year?: number;
  summary?: string;
  childCount?: number;
  viewedLeafCount?: number;
  Genre?: Array<{ tag: string }>;
};

type PlexArtist = {
  ratingKey: string;
  key: string;
  title: string;
  thumb?: string;
  art?: string;
  summary?: string;
  Genre?: Array<{ tag: string }>;
};

type PlexPlaylist = {
  ratingKey: string;
  key: string;
  title: string;
  thumb?: string;
  summary?: string;
  leafCount?: number;
  duration?: number;
};

/**
 * Helper function to make Plex API calls with JSON format
 */
async function plexApiCall<T>(endpoint: string): Promise<T> {
  const plexUrl = env.PLEX_URL;
  const plexToken = env.PLEX_TOKEN;

  if (!plexUrl || !plexToken) {
    throw new Error("PLEX_URL and PLEX_TOKEN must be set in environment variables");
  }

  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  
  // Add format=json to get JSON response instead of XML
  const separator = cleanEndpoint.includes("?") ? "&" : "?";
  const url = `${plexUrl}${cleanEndpoint}${separator}format=json&X-Plex-Token=${plexToken}`;

  const response = await fetch(url, { 
    cache: "force-cache",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Plex API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as T;
  return data;
}

/**
 * Get Plex music library section ID
 * Plex uses section IDs (usually 1, 2, etc.) for different libraries
 */
async function getMusicLibrarySectionId(): Promise<string> {
  try {
    const data = await plexApiCall<PlexMediaContainer<{ key: string; type: string; title: string }>>("/library/sections");
    const musicSection = data.MediaContainer.Metadata?.find(
      (section: any) => section.type === "artist" || section.type === "album"
    );
    return musicSection?.key?.replace("/library/sections/", "") || "1";
  } catch (error) {
    console.error("Error getting music library section:", error);
    return "1"; // Default to section 1
  }
}

/**
 * Build Plex image URL
 */
function getPlexImageUrl(thumb: string | undefined, baseUrl: string, token: string): Quality {
  if (!thumb) {
    return "";
  }

  const imageUrl = `${baseUrl}${thumb}?X-Plex-Token=${token}`;
  // Return as array format: [low, medium, high]
  return [
    { quality: "low", link: imageUrl },
    { quality: "medium", link: imageUrl },
    { quality: "high", link: imageUrl },
  ];
}

/**
 * Build Plex streaming URL for audio playback
 */
function getPlexStreamUrl(partKey: string, baseUrl: string, token: string): string {
  return `${baseUrl}${partKey}?X-Plex-Token=${token}`;
}

/**
 * Map Plex track to Song format
 */
function mapPlexTrackToSong(plexTrack: PlexTrack, baseUrl: string, token: string, index: number = 0): Song {
  const partKey = plexTrack.media?.[0]?.parts?.[0]?.key || "";
  const streamUrl = partKey ? getPlexStreamUrl(partKey, baseUrl, token) : "";

  return {
    id: plexTrack.ratingKey || `song-${index}`,
    name: plexTrack.title || "Unknown",
    subtitle: plexTrack.grandparentTitle || plexTrack.originalTitle || "",
    header_desc: plexTrack.summary || "",
    type: "song",
    url: `/song/${plexTrack.ratingKey || index}`,
    image: getPlexImageUrl(plexTrack.thumb || plexTrack.grandparentThumb, baseUrl, token),
    language: "unknown",
    year: plexTrack.year || 0,
    play_count: plexTrack.viewCount || 0,
    explicit: false,
    list: "",
    list_type: "",
    list_count: 0,
    music: streamUrl,
    song: streamUrl,
    album: plexTrack.parentTitle || "",
    album_id: plexTrack.parentKey || "",
    album_url: `/album/${plexTrack.parentKey || ""}`,
    label: "",
    label_url: "",
    origin: "",
    is_dolby_content: false,
    "320kbps": true,
    download_url: [
      { quality: "poor", link: streamUrl },
      { quality: "low", link: streamUrl },
      { quality: "medium", link: streamUrl },
      { quality: "high", link: streamUrl },
      { quality: "excellent", link: streamUrl },
    ],
    duration: Math.floor((plexTrack.duration || 0) / 1000), // Convert ms to seconds
    rights: {
      code: 0,
      reason: "",
      cacheable: true,
      delete_cached_object: false,
    },
    has_lyrics: false,
    lyrics_snippet: "",
    starred: false,
    copyright_text: "",
    artist_map: {
      primary_artists: plexTrack.grandparentTitle ? [{
        id: plexTrack.grandparentKey || "",
        name: plexTrack.grandparentTitle,
        role: "primary_artist",
        image: getPlexImageUrl(plexTrack.grandparentThumb, baseUrl, token),
        url: `/artist/${plexTrack.grandparentKey || ""}`,
        type: "artist",
      }] : [],
      artists: [],
      featured_artists: [],
    },
    vcode: "",
    vlink: "",
    triller_available: false,
  };
}

/**
 * Get home page data from Plex
 */
export async function getHomeData(lang?: Lang[], mini = true): Promise<Modules> {
  // Type assertion needed due to Plex API structure differences
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  try {
    const baseUrl = env.PLEX_URL || "";
    const token = env.PLEX_TOKEN || "";
    const sectionId = await getMusicLibrarySectionId();

    // Get recently added music
    const recentlyAdded = await plexApiCall<PlexMediaContainer<PlexTrack>>(
      `/library/sections/${sectionId}/recentlyAdded?type=10&limit=20`
    );

    // Get all artists for artist recommendations
    const artists = await plexApiCall<PlexMediaContainer<PlexArtist>>(
      `/library/sections/${sectionId}/all?type=8&limit=10`
    );

    // Get playlists
    const playlists = await plexApiCall<PlexMediaContainer<PlexPlaylist>>(
      "/playlists/all?type=10&limit=10"
    );

    const tracks = recentlyAdded.MediaContainer.Metadata || [];
    const mappedSongs = tracks.map((track, index) => 
      mapPlexTrackToSong(track, baseUrl, token, index)
    );

    const mappedArtists = (artists.MediaContainer.Metadata || []).map((artist) => ({
      explicit: false,
      id: artist.ratingKey,
      image: getPlexImageUrl(artist.thumb || artist.art, baseUrl, token),
      url: `/artist/${artist.ratingKey}`,
      subtitle: "",
      name: artist.title,
      type: "artist" as const,
      featured_station_type: "artist" as const,
      query: artist.title,
      station_display_text: artist.title,
    }));

    const mappedPlaylists = (playlists.MediaContainer.Metadata || []).map((playlist) => ({
      explicit: false,
      id: playlist.ratingKey,
      name: playlist.title,
      subtitle: "",
      type: "playlist" as const,
      url: `/playlist/${playlist.ratingKey}`,
      image: getPlexImageUrl(playlist.thumb, baseUrl, token),
      language: "unknown",
      year: 0,
      play_count: 0,
      list_count: playlist.leafCount || 0,
      list_type: "playlist",
      music: "",
      album: "",
      album_id: "",
      album_url: "",
      label: "",
      label_url: "",
      origin: "",
      is_dolby_content: false,
      "320kbps": false,
      download_url: { low: "", medium: "", high: "" },
      duration: playlist.duration || 0,
      rights: { code: 0, reason: "", cache: "" },
      has_lyrics: false,
      lyrics_snippet: "",
      starred: false,
      copyright_text: "",
      artist_map: {
        primary_artists: [],
        artists: [],
        featured_artists: [],
      },
      vcode: "",
      vlink: "",
      triller_available: false,
    }));

    return {
      trending: {
        title: "Recently Added",
        subtitle: "Latest music in your library",
        position: 1,
        source: "plex",
        data: mappedSongs.slice(0, 20),
      },
      artist_recos: {
        title: "Artists",
        subtitle: "Browse by artist",
        position: 2,
        source: "plex",
        data: mappedArtists,
      },
      playlists: {
        title: "Playlists",
        subtitle: "Your music playlists",
        position: 3,
        source: "plex",
        data: mappedPlaylists,
      },
      albums: {
        title: "Albums",
        subtitle: "Browse albums",
        position: 4,
        source: "plex",
        data: [],
      },
      charts: {
        title: "Charts",
        subtitle: "Popular music",
        position: 5,
        source: "plex",
        data: [],
      },
      radio: {
        title: "Radio",
        subtitle: "Radio stations",
        position: 6,
        source: "plex",
        data: [],
      },
      mixes: {
        title: "Mixes",
        subtitle: "Music mixes",
        position: 7,
        source: "plex",
        data: [],
      },
      discover: {
        title: "Discover",
        subtitle: "Discover new music",
        position: 8,
        source: "plex",
        data: [],
      },
      global_config: {
        random_songs_listid: {},
        weekly_top_songs_listid: {},
      },
    } as unknown as Modules;
  } catch (error) {
    console.error("Plex API error in getHomeData:", error);
    return {} as Modules;
  }
}

/**
 * Get song details from Plex
 */
export async function getSongDetails(token: string | string[], mini = false): Promise<SongObj> {
  try {
    const baseUrl = env.PLEX_URL || "";
    const plexToken = env.PLEX_TOKEN || "";
    const ratingKey = Array.isArray(token) ? token[0] : token;

    const data = await plexApiCall<PlexMediaContainer<PlexTrack>>(
      `/library/metadata/${ratingKey}`
    );

    const track = data.MediaContainer.Metadata?.[0];
    if (!track) {
      return { songs: [] };
    }

    const song = mapPlexTrackToSong(track, baseUrl, plexToken);
    return { songs: [song] };
  } catch (error) {
    console.error("Plex API error in getSongDetails:", error);
    return { songs: [] };
  }
}

/**
 * Get album details from Plex
 */
export async function getAlbumDetails(token: string, mini = true): Promise<Album> {
  try {
    const baseUrl = env.PLEX_URL || "";
    const plexToken = env.PLEX_TOKEN || "";

    // Get album metadata
    const albumData = await plexApiCall<PlexMediaContainer<PlexAlbum>>(
      `/library/metadata/${token}`
    );
    const album = albumData.MediaContainer.Metadata?.[0];
    if (!album) {
      return {} as Album;
    }

    // Get album tracks
    const tracksData = await plexApiCall<PlexMediaContainer<PlexTrack>>(
      `/library/metadata/${token}/children`
    );
    const tracks = (tracksData.MediaContainer.Metadata || []).map((track, index) =>
      mapPlexTrackToSong(track, baseUrl, plexToken, index)
    );

    return {
      explicit: false,
      id: album.ratingKey,
      image: getPlexImageUrl(album.thumb || album.art, baseUrl, plexToken),
      url: `/album/${album.ratingKey}`,
      subtitle: album.parentTitle || "",
      name: album.title,
      type: "album",
      header_desc: album.summary || "",
      language: "unknown",
      play_count: album.viewedLeafCount || 0,
      duration: 0,
      year: album.year || 0,
      list_count: album.childCount || 0,
      list_type: "album",
      artist_map: {
        primary_artists: [],
        artists: [],
        featured_artists: [],
      },
      song_count: album.childCount || tracks.length,
      label_url: "",
      copyright_text: "",
      is_dolby_content: false,
      songs: tracks,
      modules: {
        recommend: {
          source: "plex",
          position: 1,
          title: "Recommended",
          subtitle: "",
          params: { id: album.ratingKey },
        },
        currently_trending: {
          source: "plex",
          position: 2,
          title: "Trending",
          subtitle: "",
          params: { type: "album", lang: "unknown" },
        },
        top_albums_from_same_year: {
          source: "plex",
          position: 3,
          title: "Same Year",
          subtitle: "",
          params: { year: String(album.year || 0), lang: "unknown" },
        },
        artists: {
          source: "plex",
          position: 4,
          title: "Artists",
          subtitle: "",
        },
      },
    };
  } catch (error) {
    console.error("Plex API error in getAlbumDetails:", error);
    return {} as Album;
  }
}

/**
 * Get artist details from Plex
 */
export async function getArtistDetails(token: string, mini = true): Promise<Artist> {
  try {
    const baseUrl = env.PLEX_URL || "";
    const plexToken = env.PLEX_TOKEN || "";

    const data = await plexApiCall<PlexMediaContainer<PlexArtist>>(
      `/library/metadata/${token}`
    );
    const artist = data.MediaContainer.Metadata?.[0];
    if (!artist) {
      return {} as Artist;
    }

    // Get artist albums
    const albumsData = await plexApiCall<PlexMediaContainer<PlexAlbum>>(
      `/library/metadata/${token}/children`
    );
    const albums = (albumsData.MediaContainer.Metadata || []).slice(0, 10).map((album) => ({
      explicit: false,
      id: album.ratingKey,
      image: getPlexImageUrl(album.thumb || album.art, baseUrl, plexToken),
      url: `/album/${album.ratingKey}`,
      subtitle: "",
      name: album.title,
      type: "album" as const,
      header_desc: album.summary || "",
      language: "unknown",
      play_count: 0,
      duration: 0,
      year: album.year || 0,
      list_count: album.childCount || 0,
      list_type: "album",
      artist_map: {
        primary_artists: [],
        artists: [],
        featured_artists: [],
      },
      song_count: album.childCount || 0,
      label_url: "",
      copyright_text: "",
      is_dolby_content: false,
      songs: [],
      modules: {
        recommend: { source: "plex", position: 1, title: "", subtitle: "", params: { id: "" } },
        currently_trending: { source: "plex", position: 2, title: "", subtitle: "", params: { type: "", lang: "" } },
        top_albums_from_same_year: { source: "plex", position: 3, title: "", subtitle: "", params: { year: "", lang: "" } },
        artists: { source: "plex", position: 4, title: "", subtitle: "" },
      },
    }));

    return {
      id: artist.ratingKey,
      name: artist.title,
      subtitle: "",
      image: getPlexImageUrl(artist.thumb || artist.art, baseUrl, plexToken),
      follower_count: 0,
      type: "artist",
      is_verified: false,
      dominant_language: "unknown",
      dominant_type: "artist",
      top_songs: [],
      top_albums: albums,
      dedicated_artist_playlist: [],
      featured_artist_playlist: [],
      singles: [],
      latest_release: [],
      similar_artists: [],
      is_radio_present: false,
      bio: [],
      dob: "",
      fb: "",
      twitter: "",
      wiki: "",
      urls: {
        albums: "",
        bio: "",
        comments: "",
        songs: "",
      },
      available_languages: [],
      fan_count: 0,
      is_followed: false,
      modules: {
        top_songs: { title: "", subtitle: "", source: "", position: 1 },
        latest_release: { title: "", subtitle: "", source: "", position: 2 },
        top_albums: { title: "", subtitle: "", source: "", position: 3 },
        dedicated_artist_playlist: { title: "", subtitle: "", source: "", position: 4 },
        featured_artist_playlist: { title: "", subtitle: "", source: "", position: 5 },
        singles: { title: "", subtitle: "", source: "", position: 6 },
        similar_artists: { title: "", subtitle: "", source: "", position: 7 },
      },
    };
  } catch (error) {
    console.error("Plex API error in getArtistDetails:", error);
    return {} as Artist;
  }
}

/**
 * Search in Plex library
 */
export async function searchAll(query: string): Promise<AllSearch> {
  try {
    const baseUrl = env.PLEX_URL || "";
    const plexToken = env.PLEX_TOKEN || "";
    const sectionId = await getMusicLibrarySectionId();

    const results = await plexApiCall<PlexMediaContainer<any>>(
      `/library/search?query=${encodeURIComponent(query)}&type=10&sectionId=${sectionId}`
    );

    const tracks = (results.MediaContainer.Metadata || []).filter((item: any) => item.type === "track");
    const albums = (results.MediaContainer.Metadata || []).filter((item: any) => item.type === "album");
    const artists = (results.MediaContainer.Metadata || []).filter((item: any) => item.type === "artist");

    return {
      songs: {
        count: tracks.length,
        last_page: true,
        data: tracks.map((track: PlexTrack, index: number) => ({
          id: track.ratingKey,
          name: track.title,
          subtitle: track.grandparentTitle || "",
          album: track.parentTitle || "",
          url: `/song/${track.ratingKey}`,
          type: "song" as const,
          position: index,
          primary_artists: track.grandparentTitle || "",
          singers: track.grandparentTitle || "",
          language: "unknown",
          image: getPlexImageUrl(track.thumb || track.grandparentThumb, baseUrl, plexToken),
        })),
      },
      albums: {
        count: albums.length,
        last_page: true,
        data: albums.map((album: PlexAlbum, index: number) => ({
          id: album.ratingKey,
          name: album.title,
          subtitle: "",
          image: getPlexImageUrl(album.thumb || album.art, baseUrl, plexToken),
          music: "",
          url: `/album/${album.ratingKey}`,
          type: "album" as const,
          position: index,
          year: album.year || 0,
          is_movie: false,
          language: "unknown",
          song_pids: "",
        })),
      },
      artists: {
        count: artists.length,
        last_page: true,
        data: artists.map((artist: PlexArtist, index: number) => ({
          id: artist.ratingKey,
          name: artist.title,
          image: getPlexImageUrl(artist.thumb || artist.art, baseUrl, plexToken),
          extra: "",
          url: `/artist/${artist.ratingKey}`,
          type: "artist" as const,
          subtitle: "",
          entity: 0,
          position: index,
        })),
      },
      playlists: {
        count: 0,
        last_page: true,
        data: [],
      },
      top_query: {
        count: 0,
        last_page: true,
        data: [],
      },
      shows: {
        count: 0,
        last_page: true,
        data: [],
      },
    };
  } catch (error) {
    console.error("Plex API error in searchAll:", error);
    return {
      songs: { count: 0, last_page: true, data: [] },
      albums: { count: 0, last_page: true, data: [] },
      artists: { count: 0, last_page: true, data: [] },
      playlists: { count: 0, last_page: true, data: [] },
      top_query: { count: 0, last_page: true, data: [] },
      shows: { count: 0, last_page: true, data: [] },
    };
  }
}

/**
 * Get mega menu data
 */
export async function getMegaMenu(entity = false, lang?: Lang[]): Promise<MegaMenu> {
  try {
    const baseUrl = env.PLEX_URL || "";
    const plexToken = env.PLEX_TOKEN || "";

    // Get recently added albums
    const sectionId = await getMusicLibrarySectionId();
    const recentAlbums = await plexApiCall<PlexMediaContainer<PlexAlbum>>(
      `/library/sections/${sectionId}/recentlyAdded?type=9&limit=10`
    );

    // Get playlists
    const playlists = await plexApiCall<PlexMediaContainer<PlexPlaylist>>(
      "/playlists/all?type=10&limit=10"
    );

    // Get top artists
    const artists = await plexApiCall<PlexMediaContainer<PlexArtist>>(
      `/library/sections/${sectionId}/all?type=8&limit=10`
    );

    return {
      new_releases: (recentAlbums.MediaContainer.Metadata || []).map((album) => ({
        name: album.title,
        url: `/album/${album.ratingKey}`,
      })),
      top_playlists: (playlists.MediaContainer.Metadata || []).map((playlist) => ({
        name: playlist.title,
        url: `/playlist/${playlist.ratingKey}`,
      })),
      top_artists: (artists.MediaContainer.Metadata || []).map((artist) => ({
        name: artist.title,
        url: `/artist/${artist.ratingKey}`,
      })),
    };
  } catch (error) {
    console.error("Plex API error in getMegaMenu:", error);
    return {
      top_artists: [],
      top_playlists: [],
      new_releases: [],
    };
  }
}

/**
 * Get footer details
 */
export async function getFooterDetails(lang?: Lang[]): Promise<FooterDetails> {
  try {
    const sectionId = await getMusicLibrarySectionId();
    
    // Get top artists
    const artists = await plexApiCall<PlexMediaContainer<PlexArtist>>(
      `/library/sections/${sectionId}/all?type=8&limit=10&sort=viewCount:desc`
    );

    // Get recent albums
    const albums = await plexApiCall<PlexMediaContainer<PlexAlbum>>(
      `/library/sections/${sectionId}/recentlyAdded?type=9&limit=10`
    );

    // Get playlists
    const playlists = await plexApiCall<PlexMediaContainer<PlexPlaylist>>(
      "/playlists/all?type=10&limit=10"
    );

    return {
      artist: (artists.MediaContainer.Metadata || []).map((artist, index) => ({
        id: artist.ratingKey || `artist-${index}`,
        title: artist.title,
        action: `/artist/${artist.ratingKey}`,
      })),
      album: (albums.MediaContainer.Metadata || []).map((album, index) => ({
        id: album.ratingKey || `album-${index}`,
        title: album.title,
        action: `/album/${album.ratingKey}`,
      })),
      playlist: (playlists.MediaContainer.Metadata || []).map((playlist, index) => ({
        id: playlist.ratingKey || `playlist-${index}`,
        title: playlist.title,
        action: `/playlist/${playlist.ratingKey}`,
      })),
      actor: [],
    };
  } catch (error) {
    console.error("Plex API error in getFooterDetails:", error);
    return {
      playlist: [],
      artist: [],
      album: [],
      actor: [],
    };
  }
}

/**
 * Get top searches
 */
export async function getTopSearches(): Promise<TopSearch[]> {
  try {
    const sectionId = await getMusicLibrarySectionId();
    
    // Get most played tracks
    const popular = await plexApiCall<PlexMediaContainer<PlexTrack>>(
      `/library/sections/${sectionId}/all?type=10&sort=viewCount:desc&limit=10`
    );

    const baseUrl = env.PLEX_URL || "";
    const plexToken = env.PLEX_TOKEN || "";

    return (popular.MediaContainer.Metadata || []).map((track) => ({
      id: track.ratingKey,
      name: track.title,
      explicit: false, // Plex doesn't provide explicit flag
      subtitle: track.grandparentTitle || "",
      type: "song" as const,
      image: getPlexImageUrl(track.thumb || track.grandparentThumb, baseUrl, plexToken),
      url: `/song/${track.ratingKey}`,
      album: track.parentTitle || "",
      artist_map: track.grandparentTitle ? [{
        primary_artists: [{
          id: track.grandparentKey || "",
          name: track.grandparentTitle,
          role: "primary_artist",
          image: getPlexImageUrl(track.grandparentThumb, baseUrl, plexToken),
          url: `/artist/${track.grandparentKey || ""}`,
          type: "artist" as const,
        }],
        artists: [],
        featured_artists: [],
      }] : [],
    }));
  } catch (error) {
    console.error("Plex API error in getTopSearches:", error);
    return [];
  }
}

// Stub functions for other API endpoints that may be called
export async function getSongRecommendations(id: string, lang?: Lang[], mini = true): Promise<Song[]> {
  return [];
}

export async function getAlbumRecommendations(id: string, lang?: Lang[], mini = true): Promise<Album[]> {
  return [];
}

export async function getPlaylistDetails(token: string, mini = true): Promise<Playlist> {
  return {} as Playlist;
}

export async function getTrending(type: "song" | "album" | "playlist", lang?: Lang[], mini = true): Promise<any> {
  return [];
}

export async function getLyrics(id: string): Promise<any> {
  return {};
}

export async function getArtistTopSongs(
  artistId: string,
  songId: string,
  lang: Lang,
  page = 1,
  cat: any = "latest",
  sort: any = "asc",
  mini = true
): Promise<Song[]> {
  return [];
}

export async function getActorsTopSongs(
  actorID: string,
  songId: string,
  lang: Lang,
  mini = true
): Promise<Song[]> {
  return [];
}

export async function getArtistsSongs(
  id: string,
  page = 0,
  cat: any = "popularity",
  sort: any = "asc",
  mini = true
): Promise<Omit<ArtistSongsOrAlbums, "albums">> {
  return {} as Omit<ArtistSongsOrAlbums, "albums">;
}

export async function getArtistsAlbums(
  id: string,
  page = 0,
  cat: any = "popularity",
  sort: any = "asc",
  mini = true
): Promise<Omit<ArtistSongsOrAlbums, "songs">> {
  return {} as Omit<ArtistSongsOrAlbums, "songs">;
}
