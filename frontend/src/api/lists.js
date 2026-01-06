/**
 * List Groups API
 *
 * API functions for managing genre-based list groups.
 */

import apiClient from './client.js';

/**
 * Create a new list group.
 *
 * @param {string} genreId - Genre ID
 * @returns {Promise<Object>} Created list group
 */
export async function createListGroup(genreId) {
  const response = await apiClient.post('/lists', { genreId });
  return response.data;
}

/**
 * Get all list groups for current user.
 *
 * @returns {Promise<Object>} Array of list groups
 */
export async function getListGroups() {
  const response = await apiClient.get('/lists');
  return response.data;
}

/**
 * Get a specific list group with all its titles.
 *
 * @param {string} listGroupId - List group ID
 * @returns {Promise<Object>} List group with titles organized by type
 */
export async function getListGroupById(listGroupId) {
  const response = await apiClient.get(`/lists/${listGroupId}`);
  return response.data;
}

/**
 * Delete a list group.
 *
 * @param {string} listGroupId - List group ID
 * @returns {Promise<Object>} Success confirmation
 */
export async function deleteListGroup(listGroupId) {
  const response = await apiClient.delete(`/lists/${listGroupId}`);
  return response.data;
}

/**
 * Get statistics for a list group.
 *
 * @param {string} listGroupId - List group ID
 * @returns {Promise<Object>} List group statistics
 */
export async function getListGroupStats(listGroupId) {
  const response = await apiClient.get(`/lists/${listGroupId}/stats`);
  return response.data;
}
