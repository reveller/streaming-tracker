import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
global.import.meta = {
  env: {
    VITE_API_BASE_URL: 'http://localhost:3001/api',
    VITE_API_TIMEOUT: '10000',
    VITE_TMDB_IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
    VITE_ENABLE_RECOMMENDATIONS: 'true',
    VITE_ITEMS_PER_PAGE: '20',
    VITE_ENV: 'test'
  }
};

// Add custom matchers if needed
expect.extend({
  // Custom matchers can be added here
});
