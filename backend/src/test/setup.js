/**
 * Test Setup Configuration
 *
 * Global setup for Jest tests.
 */

import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Use in-memory or test database if needed
if (!process.env.NEO4J_DATABASE) {
  process.env.NEO4J_DATABASE = 'test';
}

// Mock console methods to reduce test noise (Jest provides jest globally)
/* global jest */
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
  // Keep console.error for debugging test failures
};
