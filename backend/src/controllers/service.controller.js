/**
 * Streaming Service Controller
 *
 * HTTP request handlers for streaming service endpoints.
 */

import * as serviceQueries from '../database/queries/service.queries.js';

/**
 * Get all streaming services.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getAllServices(req, res) {
  try {
    const services = await serviceQueries.getAllServices();

    return res.status(200).json({
      success: true,
      data: { services }
    });
  } catch (error) {
    console.error('Get services error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve streaming services'
      }
    });
  }
}

/**
 * Get streaming service by ID.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getServiceById(req, res) {
  try {
    const { serviceId } = req.params;

    const service = await serviceQueries.getServiceById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Streaming service not found'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: { service }
    });
  } catch (error) {
    console.error('Get service error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve streaming service'
      }
    });
  }
}

/**
 * Get titles available on a service.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getTitlesByService(req, res) {
  try {
    const { serviceId } = req.params;
    const { limit = 50 } = req.query;

    const titles = await serviceQueries.getTitlesByService(serviceId, parseInt(limit, 10));

    return res.status(200).json({
      success: true,
      data: { titles }
    });
  } catch (error) {
    console.error('Get titles by service error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve titles'
      }
    });
  }
}
