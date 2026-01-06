/**
 * List Group Routes
 *
 * Routes for list group endpoints.
 */

import express from 'express';
import * as listController from '../controllers/list.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// All list routes require authentication
router.use(requireAuth);

/**
 * @route   POST /api/lists
 * @desc    Create a new list group
 * @access  Private
 */
router.post('/', listController.createListGroup);

/**
 * @route   GET /api/lists
 * @desc    Get all list groups for authenticated user
 * @access  Private
 */
router.get('/', listController.getListGroups);

/**
 * @route   GET /api/lists/:listGroupId
 * @desc    Get a specific list group with all its titles
 * @access  Private
 */
router.get('/:listGroupId', listController.getListGroupById);

/**
 * @route   DELETE /api/lists/:listGroupId
 * @desc    Delete a list group
 * @access  Private
 */
router.delete('/:listGroupId', listController.deleteListGroup);

/**
 * @route   GET /api/lists/:listGroupId/stats
 * @desc    Get statistics for a list group
 * @access  Private
 */
router.get('/:listGroupId/stats', listController.getListGroupStats);

export default router;
