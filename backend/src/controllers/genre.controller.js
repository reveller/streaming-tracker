/**
 * Genre Controller
 *
 * HTTP request handlers for genre endpoints.
 */

import * as genreQueries from '../database/queries/genre.queries.js';

/**
 * Get all genres.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getAllGenres(req, res) {
  try {
    const genres = await genreQueries.getAllGenres();

    return res.status(200).json({
      success: true,
      data: { genres }
    });
  } catch (error) {
    console.error('Get genres error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve genres'
      }
    });
  }
}

/**
 * Get genre by ID.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getGenreById(req, res) {
  try {
    const { genreId } = req.params;

    const genre = await genreQueries.getGenreById(genreId);

    if (!genre) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Genre not found'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: { genre }
    });
  } catch (error) {
    console.error('Get genre error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve genre'
      }
    });
  }
}
