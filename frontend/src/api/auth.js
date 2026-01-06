/**
 * Authentication API
 *
 * API functions for user authentication and profile management.
 */

import apiClient from './client.js';

/**
 * Register a new user.
 *
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.username - Username
 * @param {string} userData.password - Password
 * @returns {Promise<Object>} User data and tokens
 */
export async function register(userData) {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
}

/**
 * Login with email and password.
 *
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - Password
 * @returns {Promise<Object>} User data and tokens
 */
export async function login(credentials) {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
}

/**
 * Logout current user.
 *
 * @returns {Promise<Object>} Logout confirmation
 */
export async function logout() {
  const response = await apiClient.post('/auth/logout');
  return response.data;
}

/**
 * Refresh access token.
 *
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New tokens
 */
export async function refreshToken(refreshToken) {
  const response = await apiClient.post('/auth/refresh', { refreshToken });
  return response.data;
}

/**
 * Get current authenticated user.
 *
 * @returns {Promise<Object>} User data with statistics
 */
export async function getCurrentUser() {
  const response = await apiClient.get('/auth/me');
  return response.data;
}

/**
 * Update user profile.
 *
 * @param {Object} updates - Profile updates
 * @param {string} [updates.email] - New email
 * @param {string} [updates.username] - New username
 * @returns {Promise<Object>} Updated user data
 */
export async function updateProfile(updates) {
  const response = await apiClient.patch('/auth/profile', updates);
  return response.data;
}

/**
 * Change user password.
 *
 * @param {Object} passwords - Password data
 * @param {string} passwords.currentPassword - Current password
 * @param {string} passwords.newPassword - New password
 * @returns {Promise<Object>} Success confirmation
 */
export async function changePassword(passwords) {
  const response = await apiClient.patch('/auth/password', passwords);
  return response.data;
}
