/**
 * TMDB Controller
 *
 * HTTP request handlers for TMDB API integration endpoints.
 */

import * as tmdbService from '../services/tmdb.service.js';

/**
 * Search for movies on TMDB.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function searchMovies(req, res) {
  try {
    const { q: query, page = 1 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Search query (q) is required'
        }
      });
    }

    const results = await tmdbService.searchMovies(query, parseInt(page, 10));

    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    if (error instanceof tmdbService.TMDBError) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'TMDB_SERVICE_ERROR',
          message: error.message
        }
      });
    }

    console.error('Search movies error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to search movies'
      }
    });
  }
}

/**
 * Search for TV series on TMDB.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function searchTVSeries(req, res) {
  try {
    const { q: query, page = 1 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Search query (q) is required'
        }
      });
    }

    const results = await tmdbService.searchTVSeries(query, parseInt(page, 10));

    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    if (error instanceof tmdbService.TMDBError) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'TMDB_SERVICE_ERROR',
          message: error.message
        }
      });
    }

    console.error('Search TV series error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to search TV series'
      }
    });
  }
}

/**
 * Search for both movies and TV series on TMDB.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function searchMulti(req, res) {
  try {
    const { q: query, page = 1 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Search query (q) is required'
        }
      });
    }

    const results = await tmdbService.searchMulti(query, parseInt(page, 10));

    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    if (error instanceof tmdbService.TMDBError) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'TMDB_SERVICE_ERROR',
          message: error.message
        }
      });
    }

    console.error('Search multi error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to search titles'
      }
    });
  }
}

/**
 * Get detailed movie information by TMDB ID.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getMovieDetails(req, res) {
  try {
    const { tmdbId } = req.params;

    const movie = await tmdbService.getMovieDetails(parseInt(tmdbId, 10));

    return res.status(200).json({
      success: true,
      data: { movie }
    });
  } catch (error) {
    if (error instanceof tmdbService.TMDBError) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'TMDB_SERVICE_ERROR',
          message: error.message
        }
      });
    }

    console.error('Get movie details error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve movie details'
      }
    });
  }
}

/**
 * Get detailed TV series information by TMDB ID.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getTVSeriesDetails(req, res) {
  try {
    const { tmdbId } = req.params;

    const tvSeries = await tmdbService.getTVSeriesDetails(parseInt(tmdbId, 10));

    return res.status(200).json({
      success: true,
      data: { tvSeries }
    });
  } catch (error) {
    if (error instanceof tmdbService.TMDBError) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'TMDB_SERVICE_ERROR',
          message: error.message
        }
      });
    }

    console.error('Get TV series details error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve TV series details'
      }
    });
  }
}
