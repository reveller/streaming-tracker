/**
 * Authentication API Integration Tests
 *
 * Tests for authentication endpoints with real HTTP requests.
 */

import { describe, it, expect, jest, beforeEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

// Set up test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-integration-tests';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-key-for-integration-tests';
process.env.JWT_EXPIRES_IN = '24h';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
process.env.API_PREFIX = '/api';

// Mock dependencies before importing modules
const mockEmailExists = jest.fn();
const mockUsernameExists = jest.fn();
const mockCreateUser = jest.fn();
const mockFindUserByEmail = jest.fn();
const mockFindUserById = jest.fn();
const mockUpdateLastLogin = jest.fn();
const mockGetUserStats = jest.fn();
const mockUpdateUserProfile = jest.fn();
const mockUpdateUserPassword = jest.fn();

jest.unstable_mockModule('../../src/database/queries/user.queries.js', () => ({
  emailExists: mockEmailExists,
  usernameExists: mockUsernameExists,
  createUser: mockCreateUser,
  findUserByEmail: mockFindUserByEmail,
  findUserById: mockFindUserById,
  updateLastLogin: mockUpdateLastLogin,
  getUserStats: mockGetUserStats,
  updateUserProfile: mockUpdateUserProfile,
  updateUserPassword: mockUpdateUserPassword
}));

jest.unstable_mockModule('../../src/database/connection.js', () => ({
  default: {
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    executeQuery: jest.fn()
  }
}));

// Import app after mocking
const { default: app } = await import('../../src/app.js');
import bcrypt from 'bcrypt';

describe('Authentication API Integration Tests', () => {
  beforeAll(async () => {
    // Setup complete
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const newUser = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!'
      };

      mockEmailExists.mockResolvedValue(false);
      mockUsernameExists.mockResolvedValue(false);
      mockCreateUser.mockResolvedValue({
        id: 'user-123',
        email: newUser.email,
        username: newUser.username,
        createdAt: new Date().toISOString()
      });

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(newUser.email);
      expect(response.body.data.user.username).toBe(newUser.username);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return 400 for invalid email format', async () => {
      // Arrange
      const invalidUser = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'Password123!'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for weak password', async () => {
      // Arrange
      const invalidUser = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'weak'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if email already exists', async () => {
      // Arrange
      const existingUser = {
        email: 'existing@example.com',
        username: 'testuser',
        password: 'Password123!'
      };

      mockEmailExists.mockResolvedValue(true);

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUser);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully with valid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      const mockUser = {
        id: 'user-123',
        email: credentials.email,
        username: 'testuser',
        passwordHash: await bcrypt.hash(credentials.password, 10)
      };

      mockFindUserByEmail.mockResolvedValue(mockUser);
      mockUpdateLastLogin.mockResolvedValue();

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(credentials.email);
      expect(mockUpdateLastLogin).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return 401 for invalid email', async () => {
      // Arrange
      mockFindUserByEmail.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid email or password');
    });

    it('should return 401 for invalid password', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('CorrectPassword123!', 10)
      };

      mockFindUserByEmail.mockResolvedValue(mockUser);

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user data with valid token', async () => {
      // Arrange
      const password = 'Password123!';
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        passwordHash: await bcrypt.hash(password, 10)
      };

      const mockStats = {
        totalLists: 5,
        totalTitles: 42,
        totalRatings: 30
      };

      // Setup login
      mockFindUserByEmail.mockResolvedValue(mockUser);
      mockUpdateLastLogin.mockResolvedValue();

      // Get access token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password
        });

      const accessToken = loginResponse.body.data?.accessToken;

      // Setup for me endpoint
      mockFindUserById.mockResolvedValue(mockUser);
      mockGetUserStats.mockResolvedValue(mockStats);

      if (accessToken) {
        // Act
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${accessToken}`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data.user.email).toBe(mockUser.email);
        expect(response.body.data.user.username).toBe(mockUser.username);
        expect(response.body.data.user).toHaveProperty('stats');
      } else {
        throw new Error('Failed to get access token');
      }
    });

    it('should return 401 without authorization header', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/me');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('No authorization token provided');
    });

    it('should return 401 with invalid token', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      // Arrange
      const password = 'Password123!';
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: await bcrypt.hash(password, 10)
      };

      mockFindUserByEmail.mockResolvedValue(mockUser);
      mockUpdateLastLogin.mockResolvedValue();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password
        });

      const accessToken = loginResponse.body.data?.accessToken;

      if (accessToken) {
        // Act
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Logged out successfully');
      } else {
        throw new Error('Failed to get access token');
      }
    });

    it('should return 401 without authorization', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/logout');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
