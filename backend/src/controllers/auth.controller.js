/**
 * Authentication Controller
 *
 * HTTP request handlers for authentication endpoints.
 */

import * as authService from '../services/auth.service.js';
import {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword
} from '../models/user.model.js';

/**
 * Register a new user.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function register(req, res) {
  // Reason: Registration is now invitation-only. Users must use the
  // /api/invitations/redeem endpoint with a valid invitation token.
  return res.status(403).json({
    success: false,
    error: {
      code: 'REGISTRATION_DISABLED',
      message: 'Registration is invitation-only. Please request an invitation from an administrator.',
    },
  });
}

/**
 * Login user.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function login(req, res) {
  try {
    // Validate request body
    const { error, value } = validateLogin(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      });
    }

    // Login user
    const result = await authService.login(value.email, value.password);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Login successful'
    });
  } catch (error) {
    if (error instanceof authService.AccountLockedError) {
      return res.status(423).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: error.message,
          minutesRemaining: error.minutesRemaining
        }
      });
    }

    if (error instanceof authService.AuthenticationError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: error.message
        }
      });
    }

    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during login'
      }
    });
  }
}

/**
 * Refresh access token.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required'
        }
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    if (error instanceof authService.AuthenticationError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: error.message
        }
      });
    }

    console.error('Refresh error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during token refresh'
      }
    });
  }
}

/**
 * Get current user profile.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getMe(req, res) {
  try {
    const user = await authService.getUserById(req.userId);

    return res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching user profile'
      }
    });
  }
}

/**
 * Update user profile.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function updateProfile(req, res) {
  try {
    // Validate request body
    const { error, value } = validateUpdateProfile(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      });
    }

    const updatedUser = await authService.updateProfile(req.userId, value);

    return res.status(200).json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    if (error instanceof authService.ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }

    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating profile'
      }
    });
  }
}

/**
 * Change user password.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function changePassword(req, res) {
  try {
    // Validate request body
    const { error, value } = validateChangePassword(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      });
    }

    await authService.changePassword(
      req.userId,
      value.currentPassword,
      value.newPassword
    );

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    if (error instanceof authService.AuthenticationError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: error.message
        }
      });
    }

    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while changing password'
      }
    });
  }
}

/**
 * Request a password reset email.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function forgotPassword(req, res) {
  try {
    const { error, value } = validateForgotPassword(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      });
    }

    await authService.requestPasswordReset(value.email);

    // Reason: Always return success to prevent email enumeration
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request'
      }
    });
  }
}

/**
 * Reset password using a token from email.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function resetPassword(req, res) {
  try {
    const { error, value } = validateResetPassword(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      });
    }

    await authService.resetPassword(value.token, value.newPassword);

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    if (error instanceof authService.AuthenticationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RESET_TOKEN',
          message: error.message
        }
      });
    }

    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while resetting your password'
      }
    });
  }
}

/**
 * Logout user (client-side only - invalidate token).
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function logout(req, res) {
  // In a stateless JWT setup, logout is primarily handled client-side
  // by removing the token. This endpoint exists for consistency and
  // could be extended to implement token blacklisting if needed.

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
}
