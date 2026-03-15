/**
 * Invitations API
 *
 * API functions for managing user invitations.
 */

import apiClient from './client.js';

/**
 * Create a new invitation for the given email.
 *
 * @param {string} email - Email address to invite
 * @returns {Promise<Object>} Created invitation data
 * @throws {Error} If invitation creation fails
 */
export async function createInvitation(email) {
  const response = await apiClient.post('/invitations', { email });
  return response.data;
}

/**
 * Validate an invitation token.
 *
 * @param {string} token - Invitation token to validate
 * @returns {Promise<Object>} Invitation data including email
 * @throws {Error} If token is invalid or expired
 */
export async function validateToken(token) {
  const response = await apiClient.get(`/invitations/validate?token=${encodeURIComponent(token)}`);
  return response.data;
}

/**
 * Redeem an invitation to create a new account.
 *
 * @param {Object} data - Redemption data
 * @param {string} data.token - Invitation token
 * @param {string} data.username - Desired username
 * @param {string} data.password - Desired password
 * @returns {Promise<Object>} User data and tokens
 * @throws {Error} If redemption fails
 */
export async function redeemInvitation({ token, username, password }) {
  const response = await apiClient.post('/invitations/redeem', {
    token,
    username,
    password
  });
  return response.data;
}

/**
 * List all invitations (admin only).
 *
 * @returns {Promise<Object>} List of invitations
 * @throws {Error} If listing fails or user is not admin
 */
export async function listInvitations() {
  const response = await apiClient.get('/invitations');
  return response.data;
}
