/**
 * Server Entry Point
 *
 * Starts the Express server and initializes database connection.
 */

import app from './app.js';
import connection from './database/connection.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 3001;

/**
 * Start server.
 */
async function startServer() {
  try {
    // Connect to Neo4j
    logger.info('Connecting to Neo4j...');
    await connection.connect();
    logger.info('Neo4j connected successfully');

    // Start Express server
    app.listen(PORT, () => {
      logger.info('Server started', {
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        apiUrl: `http://localhost:${PORT}${process.env.API_PREFIX || '/api'}`,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler.
 */
async function gracefulShutdown(signal) {
  logger.info(`${signal} received, starting graceful shutdown`);

  try {
    await connection.disconnect();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason: String(reason) });
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();
