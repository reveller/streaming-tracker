/**
 * Authentication Middleware
 *
 * Middleware for protecting routes and verifying JWT tokens.
 */

import { verifyAccessToken, AuthenticationError } from '../services/auth.service.js';

/**
 * Middleware to require authentication for protected routes.
 *
 * Extracts JWT from Authorization header, verifies it, and attaches
 * user ID to the request object.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
export function requireAuth(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No authorization token provided'
        }
      });
    }

    // Check for Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Authorization token must be in Bearer format'
        }
      });
    }

    // Extract token
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No authorization token provided'
        }
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user ID to request object
    req.userId = decoded.userId;

    // Continue to next middleware
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: error.message
        }
      });
    }

    // Unexpected error
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during authentication'
      }
    });
  }
}

/**
 * Optional authentication middleware.
 *
 * Attempts to authenticate user but doesn't fail if no token provided.
 * Useful for routes that have different behavior for authenticated users.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.userId = null;
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      req.userId = null;
      return next();
    }

    const decoded = verifyAccessToken(token);
    req.userId = decoded.userId;

    next();
  } catch {
    // If token is invalid, treat as unauthenticated
    req.userId = null;
    next();
  }
}
