/**
 * Invitation Service
 *
 * Business logic for the invitation-only registration system.
 * Handles creating invitations, validating tokens, and redeeming invitations.
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as invitationQueries from '../database/queries/invitation.queries.js';
import * as userQueries from '../database/queries/user.queries.js';
import * as emailService from './email.service.js';

const SALT_ROUNDS = 10;

/**
 * Custom error for invitation-related failures.
 */
export class InvitationError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'InvitationError';
    this.statusCode = statusCode;
  }
}

/**
 * Create a new invitation and send the invitation email.
 *
 * Only admin users can create invitations. Checks for duplicate emails
 * (both existing users and pending invitations).
 *
 * @param {string} inviterUserId - User ID of the admin sending the invitation
 * @param {string} email - Email address to invite
 * @returns {Promise<Object>} Created invitation object
 * @throws {InvitationError} If user is not admin or email already exists
 */
export async function createInvitation(inviterUserId, email) {
  // Verify the inviter is an admin
  const inviter = await userQueries.findUserById(inviterUserId);
  if (!inviter) {
    throw new InvitationError('Inviter user not found', 404);
  }
  if (inviter.role !== 'admin') {
    throw new InvitationError('Only administrators can send invitations', 403);
  }

  // Check if email is already registered
  const emailTaken = await userQueries.emailExists(email);
  if (emailTaken) {
    throw new InvitationError('A user with this email already exists');
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');

  // Calculate expiration time
  const expiryMinutes = parseInt(process.env.INVITATION_EXPIRY_MINUTES, 10) || 10;
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

  // Store invitation in database
  const invitation = await invitationQueries.createInvitation({
    email,
    token,
    expiresAt,
    invitedByUserId: inviterUserId,
  });

  // Send invitation email
  await emailService.sendInvitationEmail(email, token, inviter.username);

  return invitation;
}

/**
 * Validate an invitation token.
 *
 * Checks that the token exists, has not been used, and has not expired.
 *
 * @param {string} token - Invitation token to validate
 * @returns {Promise<Object>} Invitation object with email
 * @throws {InvitationError} If token is invalid, used, or expired
 */
export async function validateInvitationToken(token) {
  const invitation = await invitationQueries.findInvitationByToken(token);

  if (!invitation) {
    throw new InvitationError('Invalid or expired invitation token');
  }

  return {
    email: invitation.email,
    expiresAt: invitation.expiresAt,
  };
}

/**
 * Redeem an invitation to create a new user account.
 *
 * Atomically marks the invitation as used and creates the user.
 * Returns the new user object and JWT tokens.
 *
 * @param {string} token - Invitation token
 * @param {Object} userData - User registration data
 * @param {string} userData.username - Desired username
 * @param {string} userData.password - Desired password (plain text)
 * @returns {Promise<Object>} Object containing user data and tokens
 * @throws {InvitationError} If token is invalid or username is taken
 */
export async function redeemInvitation(token, { username, password }) {
  // Atomically mark invitation as used (prevents race conditions)
  const invitation = await invitationQueries.markInvitationUsed(token);

  if (!invitation) {
    throw new InvitationError('Invalid or expired invitation token');
  }

  // Check if username already exists
  const usernameTaken = await userQueries.usernameExists(username);
  if (usernameTaken) {
    throw new InvitationError('Username already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user with email from invitation
  const user = await userQueries.createUser({
    email: invitation.email,
    username,
    passwordHash,
  });

  // Generate JWT tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role || 'user',
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * List all invitations created by a specific admin user.
 *
 * @param {string} userId - Admin user ID
 * @returns {Promise<Array<Object>>} List of invitation objects
 */
export async function listInvitations(userId) {
  return invitationQueries.findInvitationsByInviter(userId);
}

/**
 * Delete an invitation by ID.
 *
 * @param {string} userId - Admin user ID
 * @param {string} invitationId - Invitation ID to delete
 * @returns {Promise<void>}
 * @throws {InvitationError} If invitation not found
 */
export async function deleteInvitation(userId, invitationId) {
  const deleted = await invitationQueries.deleteInvitation(invitationId, userId);

  if (!deleted) {
    throw new InvitationError('Invitation not found', 404);
  }
}

/**
 * Generate an access token (JWT).
 *
 * @param {string} userId - User ID to encode in the token
 * @returns {string} Signed JWT access token
 */
function generateAccessToken(userId) {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

/**
 * Generate a refresh token (JWT).
 *
 * @param {string} userId - User ID to encode in the token
 * @returns {string} Signed JWT refresh token
 */
function generateRefreshToken(userId) {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );
}
