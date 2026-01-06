/**
 * Title Routes
 *
 * Routes for title endpoints.
 */

import express from 'express';
import * as titleController from '../controllers/title.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// All title routes require authentication
router.use(requireAuth);

/**
 * @route   POST /api/titles
 * @desc    Create a new title
 * @access  Private
 */
router.post('/', titleController.createTitle);

/**
 * @route   GET /api/titles/search
 * @desc    Search titles by name
 * @access  Private
 */
router.get('/search', titleController.searchTitles);

/**
 * @route   GET /api/titles/my-titles
 * @desc    Get all titles for authenticated user
 * @access  Private
 */
router.get('/my-titles', titleController.getUserTitles);

/**
 * @route   GET /api/titles/:titleId
 * @desc    Get title by ID
 * @access  Private
 */
router.get('/:titleId', titleController.getTitleById);

/**
 * @route   POST /api/titles/:titleId/add-to-list
 * @desc    Add title to a list group
 * @access  Private
 */
router.post('/:titleId/add-to-list', titleController.addTitleToList);

/**
 * @route   PATCH /api/titles/:titleId/move
 * @desc    Move title to a different list
 * @access  Private
 */
router.patch('/:titleId/move', titleController.moveTitleToList);

/**
 * @route   PATCH /api/titles/:titleId/position
 * @desc    Update title position within the same list
 * @access  Private
 */
router.patch('/:titleId/position', titleController.updateTitlePosition);

/**
 * @route   DELETE /api/titles/:titleId/lists/:listGroupId
 * @desc    Remove title from a list group
 * @access  Private
 */
router.delete('/:titleId/lists/:listGroupId', titleController.removeTitleFromList);

/**
 * @route   POST /api/titles/:titleId/services
 * @desc    Link title to streaming service
 * @access  Private
 */
router.post('/:titleId/services', titleController.linkTitleToService);

/**
 * @route   DELETE /api/titles/:titleId/services/:serviceId
 * @desc    Unlink title from streaming service
 * @access  Private
 */
router.delete('/:titleId/services/:serviceId', titleController.unlinkTitleFromService);

export default router;
