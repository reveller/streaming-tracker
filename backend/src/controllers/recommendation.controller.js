/**
 * Recommendation Controller
 *
 * HTTP request handlers for AI recommendation endpoints.
 */

import * as aiService from '../services/ai-recommendation.service.js';

/**
 * Get personalized recommendations for the authenticated user.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getRecommendations(req, res) {
  try {
    const { count = 5, genre } = req.query;

    const options = {
      count: parseInt(count, 10),
      genre: genre || null
    };

    const recommendations = await aiService.getRecommendations(req.userId, options);

    return res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    if (error instanceof aiService.AIError) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'AI_SERVICE_ERROR',
          message: error.message
        }
      });
    }

    console.error('Get recommendations error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate recommendations'
      }
    });
  }
}

/**
 * Get recommendations for a specific genre.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getRecommendationsByGenre(req, res) {
  try {
    const { genreName } = req.params;
    const { count = 5 } = req.query;

    const recommendations = await aiService.getRecommendationsByGenre(
      req.userId,
      genreName,
      parseInt(count, 10)
    );

    return res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    if (error instanceof aiService.AIError) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'AI_SERVICE_ERROR',
          message: error.message
        }
      });
    }

    console.error('Get genre recommendations error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate recommendations'
      }
    });
  }
}

/**
 * Get explanation for why a title is recommended.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function explainRecommendation(req, res) {
  try {
    const { titleName } = req.body;

    if (!titleName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title name is required'
        }
      });
    }

    const explanation = await aiService.explainRecommendation(req.userId, titleName);

    return res.status(200).json({
      success: true,
      data: { explanation }
    });
  } catch (error) {
    if (error instanceof aiService.AIError) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'AI_SERVICE_ERROR',
          message: error.message
        }
      });
    }

    console.error('Explain recommendation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate explanation'
      }
    });
  }
}
