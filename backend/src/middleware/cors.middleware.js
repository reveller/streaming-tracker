/**
 * CORS Middleware Configuration
 *
 * Cross-Origin Resource Sharing configuration.
 * Allows explicit origins from env var plus any private network origin.
 */

import cors from 'cors';

/**
 * Checks if origin hostname is a private/local network address.
 *
 * @param {string} origin - The request origin URL
 * @returns {boolean} True if the origin is from a private network
 */
function isPrivateNetworkOrigin(origin) {
  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    // Reason: Match RFC 1918 private address ranges and localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (hostname.startsWith('192.168.')) return true;
    if (hostname.startsWith('10.')) return true;

    // 172.16.0.0 - 172.31.255.255
    const match = hostname.match(/^172\.(\d+)\./);
    if (match) {
      const second = parseInt(match[1], 10);
      if (second >= 16 && second <= 31) return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * CORS options configuration.
 */
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];

    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || isPrivateNetworkOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // 10 minutes
};

export default cors(corsOptions);
