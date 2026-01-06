/**
 * Recommendations API
 *
 * API functions for AI-powered personalized recommendations.
 */

import apiClient from './client.js';

/**
 * Get personalized recommendations.
 *
 * @param {Object} [options={}] - Recommendation options
 * @param {number} [options.count=5] - Number of recommendations
 * @param {string} [options.genre] - Filter by genre
 * @returns {Promise<Object>} Recommendations with reasoning
 */
export async function getRecommendations(options = {}) {
  const response = await apiClient.get('/recommendations', {
    params: options
  });
  return response.data;
}

/**
 * Get recommendations for a specific genre.
 *
 * @param {string} genreName - Genre name
 * @param {number} [count=5] - Number of recommendations
 * @returns {Promise<Object>} Genre-specific recommendations
 */
export async function getRecommendationsByGenre(genreName, count = 5) {
  const response = await apiClient.get(`/recommendations/genre/${genreName}`, {
    params: { count }
  });
  return response.data;
}

/**
 * Get explanation for why a title is recommended.
 *
 * @param {string} titleName - Title name
 * @returns {Promise<Object>} Recommendation explanation
 */
export async function explainRecommendation(titleName) {
  const response = await apiClient.post('/recommendations/explain', {
    titleName
  });
  return response.data;
}
