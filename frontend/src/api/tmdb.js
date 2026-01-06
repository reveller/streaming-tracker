/**
 * TMDB API
 *
 * API functions for searching and retrieving movie/TV data from TMDB.
 */

import apiClient from './client.js';

/**
 * Search for movies on TMDB.
 *
 * @param {string} query - Search query
 * @param {number} [page=1] - Page number
 * @returns {Promise<Object>} Movie search results
 */
export async function searchMovies(query, page = 1) {
  const response = await apiClient.get('/tmdb/search/movies', {
    params: { q: query, page }
  });
  return response.data;
}

/**
 * Search for TV series on TMDB.
 *
 * @param {string} query - Search query
 * @param {number} [page=1] - Page number
 * @returns {Promise<Object>} TV series search results
 */
export async function searchTVSeries(query, page = 1) {
  const response = await apiClient.get('/tmdb/search/tv', {
    params: { q: query, page }
  });
  return response.data;
}

/**
 * Search for both movies and TV series on TMDB.
 *
 * @param {string} query - Search query
 * @param {number} [page=1] - Page number
 * @returns {Promise<Object>} Multi-search results
 */
export async function searchMulti(query, page = 1) {
  const response = await apiClient.get('/tmdb/search/multi', {
    params: { q: query, page }
  });
  return response.data;
}

/**
 * Get detailed movie information from TMDB.
 *
 * @param {string} tmdbId - TMDB movie ID
 * @returns {Promise<Object>} Movie details
 */
export async function getMovieDetails(tmdbId) {
  const response = await apiClient.get(`/tmdb/movie/${tmdbId}`);
  return response.data;
}

/**
 * Get detailed TV series information from TMDB.
 *
 * @param {string} tmdbId - TMDB TV series ID
 * @returns {Promise<Object>} TV series details
 */
export async function getTVSeriesDetails(tmdbId) {
  const response = await apiClient.get(`/tmdb/tv/${tmdbId}`);
  return response.data;
}
