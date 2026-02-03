/**
 * Unified Music API Layer
 * 
 * This file provides a unified interface for music data, routing to either
 * JioSaavn API, Plex API, Synology NAS (available to all users), or custom API based on configuration.
 * 
 * Note: Synology NAS music is accessible to all users (guests can read, authenticated users can interact).
 * Write operations (favorites, playlists) remain restricted to authenticated users.
 */

import { env } from "./env";
import * as jiosaavnApi from "./jiosaavn-api";
import * as plexApi from "./plex-api";
import * as synologyApi from "./synology-api";

// Re-export all types
export * from "./jiosaavn-api";

/**
 * Get the active API provider based on environment configuration
 */
function getApiProvider() {
  const provider = env.API_PROVIDER || "jiosaavn";
  
  if (provider === "plex") {
    // Validate Plex configuration
    if (!env.PLEX_URL || !env.PLEX_TOKEN) {
      console.warn("Plex API selected but PLEX_URL or PLEX_TOKEN not configured. Falling back to JioSaavn.");
      return "jiosaavn";
    }
    return "plex";
  }
  
  if (provider === "custom") {
    // Custom API would use JioSaavn format but different URL
    return "jiosaavn"; // Uses JIOSAAVN_API_URL which can point to custom API
  }
  
  return "jiosaavn";
}

/**
 * Unified API functions that route to the correct provider
 * Synology NAS is available to all users when configured
 */
export async function getHomeData(lang?: any[], mini = true) {
  // Synology is available to all users (guests can read, authenticated users can interact)
  const synologyConfigured = env.SYNOLOGY_SERVER_URL && env.SYNOLOGY_USERNAME && env.SYNOLOGY_PASSWORD;
  
  console.log("🎵 getHomeData - Synology check:", {
    synologyConfigured,
    hasServerUrl: !!env.SYNOLOGY_SERVER_URL,
    hasUsername: !!env.SYNOLOGY_USERNAME,
    hasPassword: !!env.SYNOLOGY_PASSWORD,
  });
  
  if (synologyConfigured) {
    try {
      console.log("🎵 Using Synology NAS API (available to all users)");
      const data = await synologyApi.getHomeData(lang, mini);
      console.log("🎵 Synology API returned:", {
        sections: Object.keys(data),
        totalEntries: Object.values(data).reduce((sum, section) => sum + (section.data?.length || 0), 0),
      });
      return data;
    } catch (error) {
      console.error("❌ Synology API error, falling back to default provider:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Stack:", error.stack);
      }
    }
  }
  
  const provider = getApiProvider();
  console.log("🎵 Using provider:", provider);
  
  if (provider === "plex") {
    return plexApi.getHomeData(lang, mini);
  }
  
  return jiosaavnApi.getHomeData(lang, mini);
}

export async function getSongDetails(token: string | string[], mini = false) {
  const synologyConfigured = env.SYNOLOGY_SERVER_URL && env.SYNOLOGY_USERNAME && env.SYNOLOGY_PASSWORD;
  
  if (synologyConfigured) {
    try {
      return await synologyApi.getSongDetails(token, mini);
    } catch (error) {
      console.error("Synology API error, falling back to default provider:", error);
    }
  }
  
  const provider = getApiProvider();
  
  if (provider === "plex") {
    return plexApi.getSongDetails(token, mini);
  }
  
  return jiosaavnApi.getSongDetails(token, mini);
}

export async function getAlbumDetails(token: string, mini = true) {
  const synologyConfigured = env.SYNOLOGY_SERVER_URL && env.SYNOLOGY_USERNAME && env.SYNOLOGY_PASSWORD;
  
  if (synologyConfigured) {
    try {
      return await synologyApi.getAlbumDetails(token, mini);
    } catch (error) {
      console.error("Synology API error, falling back to default provider:", error);
    }
  }
  
  const provider = getApiProvider();
  
  if (provider === "plex") {
    return plexApi.getAlbumDetails(token, mini);
  }
  
  return jiosaavnApi.getAlbumDetails(token, mini);
}

export async function getArtistDetails(token: string, mini = true) {
  const synologyConfigured = env.SYNOLOGY_SERVER_URL && env.SYNOLOGY_USERNAME && env.SYNOLOGY_PASSWORD;
  
  if (synologyConfigured) {
    try {
      return await synologyApi.getArtistDetails(token, mini);
    } catch (error) {
      console.error("Synology API error, falling back to default provider:", error);
    }
  }
  
  const provider = getApiProvider();
  
  if (provider === "plex") {
    return plexApi.getArtistDetails(token, mini);
  }
  
  return jiosaavnApi.getArtistDetails(token, mini);
}

export async function searchAll(query: string) {
  const synologyConfigured = env.SYNOLOGY_SERVER_URL && env.SYNOLOGY_USERNAME && env.SYNOLOGY_PASSWORD;
  
  if (synologyConfigured) {
    try {
      return await synologyApi.searchAll(query);
    } catch (error) {
      console.error("Synology API error, falling back to default provider:", error);
    }
  }
  
  const provider = getApiProvider();
  
  if (provider === "plex") {
    return plexApi.searchAll(query);
  }
  
  return jiosaavnApi.searchAll(query);
}

export async function getMegaMenu(entity = false, lang?: any[]) {
  const provider = getApiProvider();
  
  if (provider === "plex") {
    return plexApi.getMegaMenu(entity, lang);
  }
  
  return jiosaavnApi.getMegaMenu(entity, lang);
}

export async function getFooterDetails(lang?: any[]) {
  const provider = getApiProvider();
  
  if (provider === "plex") {
    return plexApi.getFooterDetails(lang);
  }
  
  return jiosaavnApi.getFooterDetails(lang);
}

export async function getTopSearches() {
  const provider = getApiProvider();
  
  if (provider === "plex") {
    return plexApi.getTopSearches();
  }
  
  return jiosaavnApi.getTopSearches();
}

// Re-export other functions (they'll use the default provider logic)
export const getSongRecommendations = jiosaavnApi.getSongRecommendations;
export const getAlbumRecommendations = jiosaavnApi.getAlbumRecommendations;
export const getPlaylistDetails = jiosaavnApi.getPlaylistDetails;
export const getTrending = jiosaavnApi.getTrending;
export const getLyrics = jiosaavnApi.getLyrics;
export const getArtistTopSongs = jiosaavnApi.getArtistTopSongs;
export const getActorsTopSongs = jiosaavnApi.getActorsTopSongs;
export const getArtistsSongs = jiosaavnApi.getArtistsSongs;
export const getArtistsAlbums = jiosaavnApi.getArtistsAlbums;
export const getShowDetails = jiosaavnApi.getShowDetails;
export const getShowEpisodes = jiosaavnApi.getShowEpisodes;
export const getEpisodeDetails = jiosaavnApi.getEpisodeDetails;
export const search = jiosaavnApi.search;
export const getTopAlbums = jiosaavnApi.getTopAlbums;
export const getCharts = jiosaavnApi.getCharts;
export const getFeaturedPlaylists = jiosaavnApi.getFeaturedPlaylists;
export const getTopArtists = jiosaavnApi.getTopArtists;
export const getTopShows = jiosaavnApi.getTopShows;
export const getFeaturedRadioStations = jiosaavnApi.getFeaturedRadioStations;
export const getLabelDetails = jiosaavnApi.getLabelDetails;
export const getMixDetails = jiosaavnApi.getMixDetails;
