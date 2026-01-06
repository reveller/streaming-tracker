/**
 * Titles API
 *
 * API functions for managing movies and TV series.
 */

import apiClient from './client.js';

/**
 * Create a new title.
 *
 * @param {Object} titleData - Title data
 * @param {string} titleData.type - Title type (MOVIE or TV_SERIES)
 * @param {string} titleData.name - Title name
 * @param {string} [titleData.tmdbId] - TMDB ID
 * @param {string} [titleData.releaseYear] - Release year
 * @param {string} [titleData.posterUrl] - Poster image URL
 * @param {string} [titleData.overview] - Description
 * @returns {Promise<Object>} Created title
 */
export async function createTitle(titleData) {
  const response = await apiClient.post('/titles', titleData);
  return response.data;
}

/**
 * Get title by ID.
 *
 * @param {string} titleId - Title ID
 * @returns {Promise<Object>} Title details
 */
export async function getTitleById(titleId) {
  const response = await apiClient.get(`/titles/${titleId}`);
  return response.data;
}

/**
 * Search titles by name.
 *
 * @param {string} query - Search query
 * @param {number} [limit=20] - Max results
 * @returns {Promise<Object>} Search results
 */
export async function searchTitles(query, limit = 20) {
  const response = await apiClient.get('/titles/search', {
    params: { q: query, limit }
  });
  return response.data;
}

/**
 * Get all titles for current user.
 *
 * @returns {Promise<Object>} User's titles
 */
export async function getUserTitles() {
  const response = await apiClient.get('/titles/my-titles');
  return response.data;
}

/**
 * Add title to a list.
 *
 * @param {string} titleId - Title ID
 * @param {string} listGroupId - List group ID
 * @param {string} listType - List type (WATCH_QUEUE, CURRENTLY_WATCHING, ALREADY_WATCHED)
 * @returns {Promise<Object>} Success confirmation
 */
export async function addTitleToList(titleId, listGroupId, listType) {
  const response = await apiClient.post(`/titles/${titleId}/add-to-list`, {
    listGroupId,
    listType
  });
  return response.data;
}

/**
 * Move title to a different list (drag-and-drop).
 *
 * @param {string} titleId - Title ID
 * @param {string} listGroupId - List group ID
 * @param {string} newListType - New list type
 * @param {number} [newPosition] - New position in list
 * @returns {Promise<Object>} Success confirmation
 */
export async function moveTitleToList(
  titleId,
  listGroupId,
  newListType,
  newPosition
) {
  const response = await apiClient.patch(`/titles/${titleId}/move`, {
    listGroupId,
    newListType,
    newPosition
  });
  return response.data;
}

/**
 * Update title position within same list (reorder).
 *
 * @param {string} titleId - Title ID
 * @param {string} listGroupId - List group ID
 * @param {number} newPosition - New position
 * @returns {Promise<Object>} Success confirmation
 */
export async function updateTitlePosition(titleId, listGroupId, newPosition) {
  const response = await apiClient.patch(`/titles/${titleId}/position`, {
    listGroupId,
    newPosition
  });
  return response.data;
}

/**
 * Remove title from list.
 *
 * @param {string} titleId - Title ID
 * @param {string} listGroupId - List group ID
 * @returns {Promise<Object>} Success confirmation
 */
export async function removeTitleFromList(titleId, listGroupId) {
  const response = await apiClient.delete(
    `/titles/${titleId}/lists/${listGroupId}`
  );
  return response.data;
}

/**
 * Link title to streaming service.
 *
 * @param {string} titleId - Title ID
 * @param {string} serviceId - Streaming service ID
 * @returns {Promise<Object>} Success confirmation
 */
export async function linkTitleToService(titleId, serviceId) {
  const response = await apiClient.post(`/titles/${titleId}/services`, {
    serviceId
  });
  return response.data;
}

/**
 * Unlink title from streaming service.
 *
 * @param {string} titleId - Title ID
 * @param {string} serviceId - Streaming service ID
 * @returns {Promise<Object>} Success confirmation
 */
export async function unlinkTitleFromService(titleId, serviceId) {
  const response = await apiClient.delete(
    `/titles/${titleId}/services/${serviceId}`
  );
  return response.data;
}
