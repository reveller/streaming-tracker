/**
 * Rating Routes
 *
 * Routes for rating endpoints.
 */

import express from 'express';
import * as ratingController from '../controllers/rating.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// All rating routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/ratings/my-ratings
 * @desc    Get all ratings for authenticated user
 * @access  Private
 */
router.get('/my-ratings', ratingController.getUserRatings);

/**
 * @route   GET /api/ratings/stats
 * @desc    Get rating statistics for authenticated user
 * @access  Private
 */
router.get('/stats', ratingController.getUserRatingStats);

/**
 * @route   GET /api/ratings/top-rated
 * @desc    Get top rated titles for authenticated user
 * @access  Private
 */
router.get('/top-rated', ratingController.getTopRatedTitles);

/**
 * @route   GET /api/ratings/recent
 * @desc    Get recently rated titles for authenticated user
 * @access  Private
 */
router.get('/recent', ratingController.getRecentlyRatedTitles);

/**
 * @route   GET /api/ratings/by-stars/:stars
 * @desc    Get titles with a specific rating
 * @access  Private
 */
router.get('/by-stars/:stars', ratingController.getTitlesByRating);

/**
 * @route   PUT /api/ratings/titles/:titleId
 * @desc    Create or update a rating for a title
 * @access  Private
 */
router.put('/titles/:titleId', ratingController.upsertRating);

/**
 * @route   GET /api/ratings/titles/:titleId
 * @desc    Get rating for a title
 * @access  Private
 */
router.get('/titles/:titleId', ratingController.getRatingByTitle);

/**
 * @route   DELETE /api/ratings/titles/:titleId
 * @desc    Delete a rating
 * @access  Private
 */
router.delete('/titles/:titleId', ratingController.deleteRating);

export default router;
