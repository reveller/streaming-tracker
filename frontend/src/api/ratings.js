/**
 * Ratings API
 *
 * API functions for managing title ratings and reviews.
 */

import apiClient from './client.js';

/**
 * Create or update a rating for a title.
 *
 * @param {string} titleId - Title ID
 * @param {Object} ratingData - Rating data
 * @param {number} ratingData.stars - Star rating (1-5)
 * @param {string} [ratingData.review] - Optional review text
 * @returns {Promise<Object>} Created/updated rating
 */
export async function upsertRating(titleId, ratingData) {
  const response = await apiClient.put(`/ratings/titles/${titleId}`, ratingData);
  return response.data;
}

/**
 * Get rating for a specific title.
 *
 * @param {string} titleId - Title ID
 * @returns {Promise<Object>} Rating data
 */
export async function getRatingByTitle(titleId) {
  const response = await apiClient.get(`/ratings/titles/${titleId}`);
  return response.data;
}

/**
 * Delete a rating.
 *
 * @param {string} titleId - Title ID
 * @returns {Promise<Object>} Success confirmation
 */
export async function deleteRating(titleId) {
  const response = await apiClient.delete(`/ratings/titles/${titleId}`);
  return response.data;
}

/**
 * Get all ratings for current user.
 *
 * @returns {Promise<Object>} User's ratings
 */
export async function getUserRatings() {
  const response = await apiClient.get('/ratings/my-ratings');
  return response.data;
}

/**
 * Get rating statistics for current user.
 *
 * @returns {Promise<Object>} Rating statistics
 */
export async function getUserRatingStats() {
  const response = await apiClient.get('/ratings/stats');
  return response.data;
}

/**
 * Get top-rated titles for current user.
 *
 * @param {number} [limit=10] - Max results
 * @returns {Promise<Object>} Top-rated titles
 */
export async function getTopRatedTitles(limit = 10) {
  const response = await apiClient.get('/ratings/top-rated', {
    params: { limit }
  });
  return response.data;
}

/**
 * Get recently rated titles for current user.
 *
 * @param {number} [limit=10] - Max results
 * @returns {Promise<Object>} Recently rated titles
 */
export async function getRecentlyRatedTitles(limit = 10) {
  const response = await apiClient.get('/ratings/recent', {
    params: { limit }
  });
  return response.data;
}

/**
 * Get titles with a specific star rating.
 *
 * @param {number} stars - Star rating (1-5)
 * @returns {Promise<Object>} Titles with specified rating
 */
export async function getTitlesByStars(stars) {
  const response = await apiClient.get(`/ratings/by-stars/${stars}`);
  return response.data;
}
