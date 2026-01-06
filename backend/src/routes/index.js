/**
 * Routes Index
 *
 * Aggregates and exports all route modules.
 */

import express from 'express';
import authRoutes from './auth.routes.js';
import listRoutes from './list.routes.js';
import titleRoutes from './title.routes.js';
import ratingRoutes from './rating.routes.js';
import genreRoutes from './genre.routes.js';
import serviceRoutes from './service.routes.js';
import recommendationRoutes from './recommendation.routes.js';
import tmdbRoutes from './tmdb.routes.js';

const router = express.Router();

/**
 * Health check endpoint.
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

/**
 * Mount route modules.
 */
router.use('/auth', authRoutes);
router.use('/lists', listRoutes);
router.use('/titles', titleRoutes);
router.use('/ratings', ratingRoutes);
router.use('/genres', genreRoutes);
router.use('/services', serviceRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/tmdb', tmdbRoutes);

export default router;
