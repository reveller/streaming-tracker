/**
 * Streaming Services API
 *
 * API functions for retrieving streaming service information.
 */

import apiClient from './client.js';

/**
 * Get all streaming services.
 *
 * @returns {Promise<Object>} Array of streaming services
 */
export async function getAllServices() {
  const response = await apiClient.get('/services');
  return response.data;
}

/**
 * Get streaming service by ID.
 *
 * @param {string} serviceId - Service ID
 * @returns {Promise<Object>} Service details
 */
export async function getServiceById(serviceId) {
  const response = await apiClient.get(`/services/${serviceId}`);
  return response.data;
}

/**
 * Get titles available on a streaming service.
 *
 * @param {string} serviceId - Service ID
 * @param {number} [limit=50] - Max results
 * @returns {Promise<Object>} Titles on the service
 */
export async function getTitlesByService(serviceId, limit = 50) {
  const response = await apiClient.get(`/services/${serviceId}/titles`, {
    params: { limit }
  });
  return response.data;
}
