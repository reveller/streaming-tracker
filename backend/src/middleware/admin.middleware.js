/**
 * Admin Authorization Middleware
 *
 * Middleware for restricting access to admin-only routes.
 * Must be used after requireAuth middleware so that req.userId is available.
 */

import * as userQueries from '../database/queries/user.queries.js';

/**
 * Middleware to require admin role for protected routes.
 *
 * Looks up the authenticated user by ID and checks their role.
 * Returns 403 Forbidden if the user is not an admin.
 *
 * @param {Object} req - Express request object (must have req.userId from auth middleware)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
export async function requireAdmin(req, res, next) {
  try {
    const user = await userQueries.findUserById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while checking permissions',
      },
    });
  }
}
