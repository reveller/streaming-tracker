/**
 * Genres API
 *
 * API functions for retrieving genre information.
 */

import apiClient from './client.js';

/**
 * Get all available genres.
 *
 * @returns {Promise<Object>} Array of genres
 */
export async function getAllGenres() {
  const response = await apiClient.get('/genres');
  return response.data;
}

/**
 * Get genre by ID.
 *
 * @param {string} genreId - Genre ID
 * @returns {Promise<Object>} Genre details
 */
export async function getGenreById(genreId) {
  const response = await apiClient.get(`/genres/${genreId}`);
  return response.data;
}
