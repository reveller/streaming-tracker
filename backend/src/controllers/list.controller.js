/**
 * List Group Controller
 *
 * HTTP request handlers for list group endpoints.
 */

import * as listService from '../services/list.service.js';
import Joi from 'joi';

/**
 * Validation schema for creating a list group.
 */
const createListSchema = Joi.object({
  genreId: Joi.string().required()
});

/**
 * Create a new list group.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function createListGroup(req, res) {
  try {
    const { error, value } = createListSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const listGroup = await listService.createListGroup(req.userId, value.genreId);

    return res.status(201).json({
      success: true,
      data: { listGroup },
      message: 'List group created successfully'
    });
  } catch (error) {
    if (error instanceof listService.ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }

    console.error('Create list group error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create list group'
      }
    });
  }
}

/**
 * Get all list groups for the authenticated user.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getListGroups(req, res) {
  try {
    const listGroups = await listService.getListGroupsByUser(req.userId);

    return res.status(200).json({
      success: true,
      data: { listGroups }
    });
  } catch (error) {
    console.error('Get list groups error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve list groups'
      }
    });
  }
}

/**
 * Get a specific list group with all its titles.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getListGroupById(req, res) {
  try {
    const { listGroupId } = req.params;

    const listGroup = await listService.getListGroupWithTitles(listGroupId, req.userId);

    return res.status(200).json({
      success: true,
      data: { listGroup }
    });
  } catch (error) {
    if (error instanceof listService.NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }

    console.error('Get list group error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve list group'
      }
    });
  }
}

/**
 * Delete a list group.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function deleteListGroup(req, res) {
  try {
    const { listGroupId } = req.params;

    await listService.deleteListGroup(listGroupId, req.userId);

    return res.status(200).json({
      success: true,
      message: 'List group deleted successfully'
    });
  } catch (error) {
    if (error instanceof listService.NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }

    console.error('Delete list group error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete list group'
      }
    });
  }
}

/**
 * Get statistics for a list group.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getListGroupStats(req, res) {
  try {
    const { listGroupId } = req.params;

    const stats = await listService.getListGroupStats(listGroupId, req.userId);

    return res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    if (error instanceof listService.NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }

    console.error('Get list group stats error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve statistics'
      }
    });
  }
}
