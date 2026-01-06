/**
 * Authentication Service
 *
 * Business logic for user authentication, registration, and token management.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userQueries from '../database/queries/user.queries.js';

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
  // Find user by email
  const user = await userQueries.findUserByEmail(email);

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

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
