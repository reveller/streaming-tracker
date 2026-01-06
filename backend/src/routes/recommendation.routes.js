/**
 * Recommendation Routes
 *
 * Routes for AI recommendation endpoints.
 */

import express from 'express';
import * as recommendationController from '../controllers/recommendation.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// All recommendation routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/recommendations
 * @desc    Get personalized recommendations
 * @access  Private
 */
router.get('/', recommendationController.getRecommendations);

/**
 * @route   GET /api/recommendations/genre/:genreName
 * @desc    Get recommendations for a specific genre
 * @access  Private
 */
router.get('/genre/:genreName', recommendationController.getRecommendationsByGenre);

/**
 * @route   POST /api/recommendations/explain
 * @desc    Get explanation for why a title is recommended
 * @access  Private
 */
router.post('/explain', recommendationController.explainRecommendation);

export default router;
