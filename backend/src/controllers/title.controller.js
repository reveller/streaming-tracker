/**
 * Title Controller
 *
 * HTTP request handlers for title endpoints.
 */

import * as titleService from '../services/title.service.js';
import Joi from 'joi';

/**
 * Validation schemas.
 */
const createTitleSchema = Joi.object({
  type: Joi.string().valid('MOVIE', 'TV_SERIES').required(),
  name: Joi.string().required().min(1).max(255),
  tmdbId: Joi.string().optional(),
  releaseYear: Joi.string().optional(),
  posterUrl: Joi.string().uri().optional(),
  overview: Joi.string().optional()
});

const addToListSchema = Joi.object({
  listGroupId: Joi.string().required(),
  listType: Joi.string().valid('WATCH_QUEUE', 'CURRENTLY_WATCHING', 'ALREADY_WATCHED').required()
});

const moveToListSchema = Joi.object({
  listGroupId: Joi.string().required(),
  newListType: Joi.string().valid('WATCH_QUEUE', 'CURRENTLY_WATCHING', 'ALREADY_WATCHED').required(),
  newPosition: Joi.number().integer().min(0).optional()
});

const updatePositionSchema = Joi.object({
  listGroupId: Joi.string().required(),
  newPosition: Joi.number().integer().min(0).required()
});

const linkServiceSchema = Joi.object({
  serviceId: Joi.string().required()
});

/**
 * Create a new title.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function createTitle(req, res) {
  try {
    const { error, value } = createTitleSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const title = await titleService.createTitle(value);

    return res.status(201).json({
      success: true,
      data: { title },
      message: 'Title created successfully'
    });
  } catch (error) {
    if (error instanceof titleService.ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }

    console.error('Create title error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create title'
      }
    });
  }
}

/**
 * Get title by ID.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getTitleById(req, res) {
  try {
    const { titleId } = req.params;

    const title = await titleService.getTitleById(titleId);

    return res.status(200).json({
      success: true,
      data: { title }
    });
  } catch (error) {
    if (error instanceof titleService.NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }

    console.error('Get title error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve title'
      }
    });
  }
}

/**
 * Add title to a list group.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function addTitleToList(req, res) {
  try {
    const { titleId } = req.params;
    const { error, value } = addToListSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const relationship = await titleService.addTitleToList(
      titleId,
      value.listGroupId,
      req.userId,
      value.listType
    );

    return res.status(200).json({
      success: true,
      data: { relationship },
      message: 'Title added to list successfully'
    });
  } catch (error) {
    if (error instanceof titleService.ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }

    if (error instanceof titleService.NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }

    console.error('Add title to list error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to add title to list'
      }
    });
  }
}

/**
 * Move title to a different list.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function moveTitleToList(req, res) {
  try {
    const { titleId } = req.params;
    const { error, value } = moveToListSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    await titleService.moveTitleToList(
      titleId,
      value.listGroupId,
      req.userId,
      value.newListType,
      value.newPosition
    );

    return res.status(200).json({
      success: true,
      message: 'Title moved successfully'
    });
  } catch (error) {
    if (error instanceof titleService.ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }

    if (error instanceof titleService.NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }

    console.error('Move title error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to move title'
      }
    });
  }
}

/**
 * Update title position within the same list.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function updateTitlePosition(req, res) {
  try {
    const { titleId } = req.params;
    const { error, value } = updatePositionSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    await titleService.updateTitlePosition(
      titleId,
      value.listGroupId,
      req.userId,
      value.newPosition
    );

    return res.status(200).json({
      success: true,
      message: 'Title position updated successfully'
    });
  } catch (error) {
    if (error instanceof titleService.ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }

    if (error instanceof titleService.NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }

    console.error('Update position error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update position'
      }
    });
  }
}

/**
 * Remove title from a list group.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function removeTitleFromList(req, res) {
  try {
    const { titleId, listGroupId } = req.params;

    await titleService.removeTitleFromList(titleId, listGroupId, req.userId);

    return res.status(200).json({
      success: true,
      message: 'Title removed from list successfully'
    });
  } catch (error) {
    if (error instanceof titleService.NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }

    console.error('Remove title error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to remove title'
      }
    });
  }
}

/**
 * Link title to streaming service.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function linkTitleToService(req, res) {
  try {
    const { titleId } = req.params;
    const { error, value } = linkServiceSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    await titleService.linkTitleToService(titleId, value.serviceId);

    return res.status(200).json({
      success: true,
      message: 'Title linked to service successfully'
    });
  } catch (error) {
    if (error instanceof titleService.NotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }

    console.error('Link service error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to link service'
      }
    });
  }
}

/**
 * Unlink title from streaming service.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function unlinkTitleFromService(req, res) {
  try {
    const { titleId, serviceId } = req.params;

    await titleService.unlinkTitleFromService(titleId, serviceId);

    return res.status(200).json({
      success: true,
      message: 'Title unlinked from service successfully'
    });
  } catch (error) {
    console.error('Unlink service error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to unlink service'
      }
    });
  }
}

/**
 * Search titles by name.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function searchTitles(req, res) {
  try {
    const { q: searchTerm, limit = 20 } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Search term (q) is required'
        }
      });
    }

    const titles = await titleService.searchTitles(searchTerm, parseInt(limit, 10));

    return res.status(200).json({
      success: true,
      data: { titles }
    });
  } catch (error) {
    if (error instanceof titleService.ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }

    console.error('Search titles error:', error);
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
 * Get all titles for the authenticated user.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getUserTitles(req, res) {
  try {
    const titles = await titleService.getTitlesByUser(req.userId);

    return res.status(200).json({
      success: true,
      data: { titles }
    });
  } catch (error) {
    console.error('Get user titles error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve titles'
      }
    });
  }
}
