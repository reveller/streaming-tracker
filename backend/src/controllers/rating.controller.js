/**
 * Rating Controller
 *
 * HTTP request handlers for rating endpoints.
 */

import * as ratingService from '../services/rating.service.js';
import Joi from 'joi';

/**
 * Validation schema for creating/updating a rating.
 */
const upsertRatingSchema = Joi.object({
  stars: Joi.number().integer().min(1).max(5).required(),
  review: Joi.string().max(1000).optional().allow('')
});

/**
 * Create or update a rating for a title.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function upsertRating(req, res) {
  try {
    const { titleId } = req.params;
    const { error, value } = upsertRatingSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const rating = await ratingService.upsertRating(
      titleId,
      value.stars,
      value.review || null
    );

    return res.status(200).json({
      success: true,
      data: { rating },
      message: 'Rating saved successfully'
    });
  } catch (error) {
    if (error instanceof ratingService.ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }

    if (error instanceof ratingService.NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }

    console.error('Upsert rating error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to save rating'
      }
    });
  }
}

/**
 * Get rating for a title.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getRatingByTitle(req, res) {
  try {
    const { titleId } = req.params;

    const rating = await ratingService.getRatingByTitle(titleId);

    if (!rating) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Rating not found'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: { rating }
    });
  } catch (error) {
    console.error('Get rating error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve rating'
      }
    });
  }
}

/**
 * Delete a rating.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function deleteRating(req, res) {
  try {
    const { titleId } = req.params;

    const deleted = await ratingService.deleteRating(titleId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Rating not found'
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete rating'
      }
    });
  }
}

/**
 * Get all ratings for the authenticated user.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getUserRatings(req, res) {
  try {
    const ratings = await ratingService.getRatingsByUser(req.userId);

    return res.status(200).json({
      success: true,
      data: { ratings }
    });
  } catch (error) {
    console.error('Get user ratings error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve ratings'
      }
    });
  }
}

/**
 * Get rating statistics for the authenticated user.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getUserRatingStats(req, res) {
  try {
    const stats = await ratingService.getUserRatingStats(req.userId);

    return res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get rating stats error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve statistics'
      }
    });
  }
}

/**
 * Get top rated titles for the authenticated user.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getTopRatedTitles(req, res) {
  try {
    const { limit = 10 } = req.query;

    const titles = await ratingService.getTopRatedTitles(req.userId, parseInt(limit, 10));

    return res.status(200).json({
      success: true,
      data: { titles }
    });
  } catch (error) {
    console.error('Get top rated titles error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve top rated titles'
      }
    });
  }
}

/**
 * Get recently rated titles for the authenticated user.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getRecentlyRatedTitles(req, res) {
  try {
    const { limit = 10 } = req.query;

    const titles = await ratingService.getRecentlyRatedTitles(req.userId, parseInt(limit, 10));

    return res.status(200).json({
      success: true,
      data: { titles }
    });
  } catch (error) {
    console.error('Get recently rated titles error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve recently rated titles'
      }
    });
  }
}

/**
 * Get titles with a specific rating.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getTitlesByRating(req, res) {
  try {
    const { stars } = req.params;
    const starsNum = parseInt(stars, 10);

    if (isNaN(starsNum)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Stars must be a valid number'
        }
      });
    }

    const titles = await ratingService.getTitlesByRating(req.userId, starsNum);

    return res.status(200).json({
      success: true,
      data: { titles }
    });
  } catch (error) {
    if (error instanceof ratingService.ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }

    console.error('Get titles by rating error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve titles'
      }
    });
  }
}
