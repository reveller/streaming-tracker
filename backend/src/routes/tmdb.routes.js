/**
 * TMDB Routes
 *
 * Routes for TMDB API integration endpoints.
 */

import express from 'express';
import * as tmdbController from '../controllers/tmdb.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// All TMDB routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/tmdb/search/movies
 * @desc    Search for movies on TMDB
 * @access  Private
 */
router.get('/search/movies', tmdbController.searchMovies);

/**
 * @route   GET /api/tmdb/search/tv
 * @desc    Search for TV series on TMDB
 * @access  Private
 */
router.get('/search/tv', tmdbController.searchTVSeries);

/**
 * @route   GET /api/tmdb/search/multi
 * @desc    Search for both movies and TV series on TMDB
 * @access  Private
 */
router.get('/search/multi', tmdbController.searchMulti);

/**
 * @route   GET /api/tmdb/movie/:tmdbId
 * @desc    Get detailed movie information by TMDB ID
 * @access  Private
 */
router.get('/movie/:tmdbId', tmdbController.getMovieDetails);

/**
 * @route   GET /api/tmdb/tv/:tmdbId
 * @desc    Get detailed TV series information by TMDB ID
 * @access  Private
 */
router.get('/tv/:tmdbId', tmdbController.getTVSeriesDetails);

export default router;
