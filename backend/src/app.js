/**
 * Express Application Setup
 *
 * Configures and exports the Express application.
 */

import express from 'express';
import dotenv from 'dotenv';
import corsMiddleware from './middleware/cors.middleware.js';
import { generalLimiter } from './middleware/rate-limit.middleware.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';
import routes from './routes/index.js';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

/**
 * Middleware
 */

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use(corsMiddleware);

// Rate limiting
app.use(generalLimiter);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'debug';
    logger[level](`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
  });
  next();
});

/**
 * Routes
 */

// API routes
const apiPrefix = process.env.API_PREFIX || '/api';
app.use(apiPrefix, routes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Streaming Tracker API',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

/**
 * Error Handling
 */

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;
