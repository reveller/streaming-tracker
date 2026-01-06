/**
 * Authentication Routes
 *
 * Defines HTTP routes for authentication endpoints.
 */

import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get tokens
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', authController.refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Protected
 */
router.post('/logout', requireAuth, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Protected
 */
router.get('/me', requireAuth, authController.getMe);

/**
 * @route   PATCH /api/auth/profile
 * @desc    Update user profile
 * @access  Protected
 */
router.patch('/profile', requireAuth, authController.updateProfile);

/**
 * @route   PATCH /api/auth/password
 * @desc    Change user password
 * @access  Protected
 */
router.patch('/password', requireAuth, authController.changePassword);

export default router;
