/**
 * Authentication Service
 *
 * Business logic for user authentication, registration, and token management.
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userQueries from '../database/queries/user.queries.js';
import * as emailService from './email.service.js';

const SALT_ROUNDS = 10;

/**
 * Custom error for authentication failures.
 */
export class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

/**
 * Custom error for account lockout.
 */
export class AccountLockedError extends Error {
  constructor(minutesRemaining) {
    super(`Account is locked. Try again in ${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'}.`);
    this.name = 'AccountLockedError';
    this.statusCode = 423;
    this.minutesRemaining = minutesRemaining;
  }
}

/**
 * Custom error for validation failures.
 */
export class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

/**
 * Register a new user.
 *
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.username - User username
 * @param {string} userData.password - User password (plain text)
 * @returns {Promise<Object>} User object and tokens
 * @throws {ValidationError} If email or username already exists
 */
export async function register({ email, username, password }) {
  // Check if email already exists
  const emailTaken = await userQueries.emailExists(email);
  if (emailTaken) {
    throw new ValidationError('Email already exists');
  }

  // Check if username already exists
  const usernameTaken = await userQueries.usernameExists(username);
  if (usernameTaken) {
    throw new ValidationError('Username already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await userQueries.createUser({
    email,
    username,
    passwordHash
  });

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role || 'user',
      createdAt: user.createdAt
    },
    accessToken,
    refreshToken
  };
}

/**
 * Login user with email and password.
 *
 * @param {string} email - User email
 * @param {string} password - User password (plain text)
 * @returns {Promise<Object>} User object and tokens
 * @throws {AuthenticationError} If credentials are invalid
 */
export async function login(email, password) {
  const maxAttempts = parseInt(process.env.ACCOUNT_LOCKOUT_ATTEMPTS, 10) || 5;
  const lockoutMinutes = parseInt(process.env.ACCOUNT_LOCKOUT_DURATION_MINUTES, 10) || 10;

  // Check if account is locked
  const lockoutStatus = await userQueries.getLoginLockoutStatus(email);
  if (lockoutStatus && lockoutStatus.lockedUntil) {
    const lockedUntil = new Date(lockoutStatus.lockedUntil);
    if (lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil((lockedUntil - new Date()) / 60000);
      throw new AccountLockedError(minutesRemaining);
    }
  }

  // Find user by email
  const user = await userQueries.findUserByEmail(email);

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    await userQueries.incrementFailedLoginAttempts(email, maxAttempts, lockoutMinutes);
    throw new AuthenticationError('Invalid email or password');
  }

  // Reason: Reset failed attempts on successful login to clear any partial lockout state
  await userQueries.resetFailedLoginAttempts(user.id);

  // Update last login timestamp
  await userQueries.updateLastLogin(user.id);

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role || 'user',
      lastLoginAt: new Date().toISOString()
    },
    accessToken,
    refreshToken
  };
}

/**
 * Refresh access token using refresh token.
 *
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New tokens
 * @throws {AuthenticationError} If refresh token is invalid
 */
export async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Verify user still exists
    const user = await userQueries.findUserById(decoded.userId);

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Get user by ID.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User object with statistics
 * @throws {Error} If user not found
 */
export async function getUserById(userId) {
  const user = await userQueries.findUserById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const stats = await userQueries.getUserStats(userId);

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role || 'user',
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    stats
  };
}

/**
 * Update user profile.
 *
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @param {string} [updates.email] - New email
 * @param {string} [updates.username] - New username
 * @returns {Promise<Object>} Updated user object
 * @throws {ValidationError} If email or username already taken
 */
export async function updateProfile(userId, updates) {
  // Check if new email is already taken
  if (updates.email) {
    const emailTaken = await userQueries.emailExists(updates.email, userId);
    if (emailTaken) {
      throw new ValidationError('Email already exists');
    }
  }

  // Check if new username is already taken
  if (updates.username) {
    const usernameTaken = await userQueries.usernameExists(updates.username, userId);
    if (usernameTaken) {
      throw new ValidationError('Username already exists');
    }
  }

  const updatedUser = await userQueries.updateUserProfile(userId, updates);

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    username: updatedUser.username,
    updatedAt: updatedUser.updatedAt
  };
}

/**
 * Change user password.
 *
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 * @throws {AuthenticationError} If current password is invalid
 */
export async function changePassword(userId, currentPassword, newPassword) {
  // Get user with password hash
  const user = await userQueries.findUserById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Get user with passwordHash for verification
  const userWithPassword = await userQueries.findUserByEmail(user.email);

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.passwordHash);

  if (!isPasswordValid) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password
  await userQueries.updateUserPassword(userId, newPasswordHash);
}

/**
 * Request a password reset email.
 *
 * Generates a secure token, stores its hash, and sends the raw token via email.
 * Silently succeeds if the email doesn't exist to prevent email enumeration.
 *
 * @param {string} email - User email address
 * @returns {Promise<void>}
 */
export async function requestPasswordReset(email) {
  const user = await userQueries.findUserByEmail(email);

  // Reason: Return silently for non-existent emails to prevent enumeration attacks
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const expiryMinutes = parseInt(process.env.PASSWORD_RESET_EXPIRY_MINUTES, 10) || 15;
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

  await userQueries.storePasswordResetToken(email, hashedToken, expiresAt);
  await emailService.sendPasswordResetEmail(email, rawToken);
}

/**
 * Reset a user's password using a valid reset token.
 *
 * @param {string} rawToken - Raw reset token from email
 * @param {string} newPassword - New password (plain text)
 * @returns {Promise<void>}
 * @throws {AuthenticationError} If token is invalid or expired
 */
export async function resetPassword(rawToken, newPassword) {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const user = await userQueries.findUserByResetToken(hashedToken);

  if (!user) {
    throw new AuthenticationError('Invalid or expired reset token');
  }

  const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userQueries.updateUserPassword(user.id, newPasswordHash);
  await userQueries.clearPasswordResetToken(user.id);

  // Reason: Unlock the account if it was locked due to failed attempts
  await userQueries.resetFailedLoginAttempts(user.id);
}

/**
 * Generate access token (JWT).
 *
 * @param {string} userId - User ID
 * @returns {string} Access token
 */
function generateAccessToken(userId) {
  const payload = {
    userId,
    type: 'access'
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
}

/**
 * Generate refresh token (JWT).
 *
 * @param {string} userId - User ID
 * @returns {string} Refresh token
 */
function generateRefreshToken(userId) {
  const payload = {
    userId,
    type: 'refresh'
  };

  const options = {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  };

  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, options);
}

/**
 * Verify access token.
 *
 * @param {string} token - Access token
 * @returns {Object} Decoded token payload
 * @throws {AuthenticationError} If token is invalid or expired
 */
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'access') {
      throw new AuthenticationError('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Access token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid access token');
    }
    throw error;
  }
}
