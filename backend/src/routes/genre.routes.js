/**
 * Genre Routes
 *
 * Routes for genre endpoints.
 */

import express from 'express';
import * as genreController from '../controllers/genre.controller.js';

const router = express.Router();

/**
 * @route   GET /api/genres
 * @desc    Get all genres
 * @access  Public
 */
router.get('/', genreController.getAllGenres);

/**
 * @route   GET /api/genres/:genreId
 * @desc    Get genre by ID
 * @access  Public
 */
router.get('/:genreId', genreController.getGenreById);

export default router;
