/**
 * Streaming Service Routes
 *
 * Routes for streaming service endpoints.
 */

import express from 'express';
import * as serviceController from '../controllers/service.controller.js';

const router = express.Router();

/**
 * @route   GET /api/services
 * @desc    Get all streaming services
 * @access  Public
 */
router.get('/', serviceController.getAllServices);

/**
 * @route   GET /api/services/:serviceId
 * @desc    Get streaming service by ID
 * @access  Public
 */
router.get('/:serviceId', serviceController.getServiceById);

/**
 * @route   GET /api/services/:serviceId/titles
 * @desc    Get titles available on a service
 * @access  Public
 */
router.get('/:serviceId/titles', serviceController.getTitlesByService);

export default router;
