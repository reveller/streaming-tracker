/**
 * Authentication Service Unit Tests
 *
 * Tests for auth.service.js functions.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before importing modules that use them
const mockEmailExists = jest.fn();
const mockUsernameExists = jest.fn();
const mockCreateUser = jest.fn();
const mockFindUserByEmail = jest.fn();
const mockFindUserById = jest.fn();
const mockUpdateLastLogin = jest.fn();
const mockGetUserStats = jest.fn();
const mockUpdateUserProfile = jest.fn();
const mockUpdateUserPassword = jest.fn();

const mockBcryptHash = jest.fn();
const mockBcryptCompare = jest.fn();

jest.unstable_mockModule('../../../src/database/queries/user.queries.js', () => ({
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

jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash: mockBcryptHash,
    compare: mockBcryptCompare
  }
}));

// Import auth service after mocking dependencies
const authService = await import('../../../src/services/auth.service.js');

// Import JWT for testing
import jwt from 'jsonwebtoken';

// Set up test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-unit-tests';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-key-for-unit-tests';
process.env.JWT_EXPIRES_IN = '24h';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!'
      };

      mockEmailExists.mockResolvedValue(false);
      mockUsernameExists.mockResolvedValue(false);
      mockBcryptHash.mockResolvedValue('hashedpassword');
      mockCreateUser.mockResolvedValue({
        id: 'user-123',
        email: userData.email,
        username: userData.username,
        createdAt: new Date().toISOString()
      });

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.username).toBe(userData.username);
      expect(mockEmailExists).toHaveBeenCalledWith(userData.email);
      expect(mockUsernameExists).toHaveBeenCalledWith(userData.username);
      expect(mockBcryptHash).toHaveBeenCalledWith(userData.password, 10);
    });

    it('should throw ValidationError if email already exists', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        username: 'testuser',
        password: 'Password123!'
      };

      mockEmailExists.mockResolvedValue(true);

      // Act & Assert
      await expect(authService.register(userData))
        .rejects
        .toThrow(authService.ValidationError);
      await expect(authService.register(userData))
        .rejects
        .toThrow('Email already exists');
    });

    it('should throw ValidationError if username already exists', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        username: 'existinguser',
        password: 'Password123!'
      };

      mockEmailExists.mockResolvedValue(false);
      mockUsernameExists.mockResolvedValue(true);

      // Act & Assert
      await expect(authService.register(userData))
        .rejects
        .toThrow(authService.ValidationError);
      await expect(authService.register(userData))
        .rejects
        .toThrow('Username already exists');
    });
  });

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'Password123!';
      const mockUser = {
        id: 'user-123',
        email,
        username: 'testuser',
        passwordHash: 'hashedpassword'
      };

      mockFindUserByEmail.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true);
      mockUpdateLastLogin.mockResolvedValue();

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(email);
      expect(mockBcryptCompare).toHaveBeenCalledWith(password, mockUser.passwordHash);
      expect(mockUpdateLastLogin).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw AuthenticationError if user not found', async () => {
      // Arrange
      mockFindUserByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login('nonexistent@example.com', 'password'))
        .rejects
        .toThrow(authService.AuthenticationError);
      await expect(authService.login('nonexistent@example.com', 'password'))
        .rejects
        .toThrow('Invalid email or password');
    });

    it('should throw AuthenticationError if password is invalid', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashedpassword'
      };

      mockFindUserByEmail.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login('test@example.com', 'wrongpassword'))
        .rejects
        .toThrow(authService.AuthenticationError);
      await expect(authService.login('test@example.com', 'wrongpassword'))
        .rejects
        .toThrow('Invalid email or password');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      // Arrange
      const token = 'valid.jwt.token';
      const decoded = { userId: 'user-123', type: 'access' };

      jest.spyOn(jwt, 'verify').mockReturnValue(decoded);

      // Act
      const result = authService.verifyAccessToken(token);

      // Assert
      expect(result).toEqual(decoded);
      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
    });

    it('should throw AuthenticationError for invalid token type', () => {
      // Arrange
      const token = 'valid.jwt.token';
      const decoded = { userId: 'user-123', type: 'refresh' };

      jest.spyOn(jwt, 'verify').mockReturnValue(decoded);

      // Act & Assert
      expect(() => authService.verifyAccessToken(token))
        .toThrow(authService.AuthenticationError);
      expect(() => authService.verifyAccessToken(token))
        .toThrow('Invalid token type');
    });

    it('should throw AuthenticationError for expired token', () => {
      // Arrange
      const token = 'expired.jwt.token';

      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired');
      });

      // Act & Assert
      expect(() => authService.verifyAccessToken(token))
        .toThrow(authService.AuthenticationError);
      expect(() => authService.verifyAccessToken(token))
        .toThrow('Access token expired');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      // Arrange
      const refreshToken = 'valid.refresh.token';
      const decoded = { userId: 'user-123', type: 'refresh' };
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser'
      };

      jest.spyOn(jwt, 'verify').mockReturnValue(decoded);
      mockFindUserById.mockResolvedValue(mockUser);

      // Act
      const result = await authService.refreshAccessToken(refreshToken);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      expect(mockFindUserById).toHaveBeenCalledWith(decoded.userId);
    });

    it('should throw AuthenticationError if user not found', async () => {
      // Arrange
      const refreshToken = 'valid.refresh.token';
      const decoded = { userId: 'nonexistent-user', type: 'refresh' };

      jest.spyOn(jwt, 'verify').mockReturnValue(decoded);
      mockFindUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.refreshAccessToken(refreshToken))
        .rejects
        .toThrow(authService.AuthenticationError);
      await expect(authService.refreshAccessToken(refreshToken))
        .rejects
        .toThrow('User not found');
    });

    it('should throw AuthenticationError for invalid refresh token', async () => {
      // Arrange
      const refreshToken = 'invalid.refresh.token';

      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      // Act & Assert
      await expect(authService.refreshAccessToken(refreshToken))
        .rejects
        .toThrow(authService.AuthenticationError);
      await expect(authService.refreshAccessToken(refreshToken))
        .rejects
        .toThrow('Invalid refresh token');
    });

    it('should throw AuthenticationError for expired refresh token', async () => {
      // Arrange
      const refreshToken = 'expired.refresh.token';

      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired');
      });

      // Act & Assert
      await expect(authService.refreshAccessToken(refreshToken))
        .rejects
        .toThrow(authService.AuthenticationError);
      await expect(authService.refreshAccessToken(refreshToken))
        .rejects
        .toThrow('Refresh token expired');
    });
  });

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      const mockStats = {
        totalLists: 5,
        totalTitles: 42,
        totalRatings: 30
      };

      mockFindUserById.mockResolvedValue(mockUser);
      mockGetUserStats.mockResolvedValue(mockStats);

      // Act
      const result = await authService.getUserById(userId);

      // Assert
      expect(result).toHaveProperty('id', userId);
      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).toHaveProperty('username', mockUser.username);
      expect(result).toHaveProperty('stats', mockStats);
      expect(mockFindUserById).toHaveBeenCalledWith(userId);
      expect(mockGetUserStats).toHaveBeenCalledWith(userId);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      mockFindUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.getUserById('nonexistent'))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update email successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const updates = { email: 'newemail@example.com' };
      const mockUpdatedUser = {
        id: userId,
        email: 'newemail@example.com',
        username: 'testuser',
        updatedAt: new Date().toISOString()
      };

      mockEmailExists.mockResolvedValue(false);
      mockUpdateUserProfile.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await authService.updateProfile(userId, updates);

      // Assert
      expect(result.email).toBe(updates.email);
      expect(mockEmailExists).toHaveBeenCalledWith(updates.email, userId);
      expect(mockUpdateUserProfile).toHaveBeenCalledWith(userId, updates);
    });

    it('should update username successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const updates = { username: 'newusername' };
      const mockUpdatedUser = {
        id: userId,
        email: 'test@example.com',
        username: 'newusername',
        updatedAt: new Date().toISOString()
      };

      mockUsernameExists.mockResolvedValue(false);
      mockUpdateUserProfile.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await authService.updateProfile(userId, updates);

      // Assert
      expect(result.username).toBe(updates.username);
      expect(mockUsernameExists).toHaveBeenCalledWith(updates.username, userId);
      expect(mockUpdateUserProfile).toHaveBeenCalledWith(userId, updates);
    });

    it('should throw ValidationError if email already exists', async () => {
      // Arrange
      const userId = 'user-123';
      const updates = { email: 'taken@example.com' };

      mockEmailExists.mockResolvedValue(true);

      // Act & Assert
      await expect(authService.updateProfile(userId, updates))
        .rejects
        .toThrow(authService.ValidationError);
      await expect(authService.updateProfile(userId, updates))
        .rejects
        .toThrow('Email already exists');
    });

    it('should throw ValidationError if username already exists', async () => {
      // Arrange
      const userId = 'user-123';
      const updates = { username: 'takenusername' };

      mockUsernameExists.mockResolvedValue(true);

      // Act & Assert
      await expect(authService.updateProfile(userId, updates))
        .rejects
        .toThrow(authService.ValidationError);
      await expect(authService.updateProfile(userId, updates))
        .rejects
        .toThrow('Username already exists');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const currentPassword = 'OldPassword123!';
      const newPassword = 'NewPassword456!';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser'
      };
      const mockUserWithPassword = {
        ...mockUser,
        passwordHash: 'oldhashedpassword'
      };

      mockFindUserById.mockResolvedValue(mockUser);
      mockFindUserByEmail.mockResolvedValue(mockUserWithPassword);
      mockBcryptCompare.mockResolvedValue(true);
      mockBcryptHash.mockResolvedValue('newhashedpassword');
      mockUpdateUserPassword.mockResolvedValue();

      // Act
      await authService.changePassword(userId, currentPassword, newPassword);

      // Assert
      expect(mockBcryptCompare).toHaveBeenCalledWith(currentPassword, mockUserWithPassword.passwordHash);
      expect(mockBcryptHash).toHaveBeenCalledWith(newPassword, 10);
      expect(mockUpdateUserPassword).toHaveBeenCalledWith(userId, 'newhashedpassword');
    });

    it('should throw AuthenticationError if current password is incorrect', async () => {
      // Arrange
      const userId = 'user-123';
      const currentPassword = 'WrongPassword123!';
      const newPassword = 'NewPassword456!';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser'
      };
      const mockUserWithPassword = {
        ...mockUser,
        passwordHash: 'hashedpassword'
      };

      mockFindUserById.mockResolvedValue(mockUser);
      mockFindUserByEmail.mockResolvedValue(mockUserWithPassword);
      mockBcryptCompare.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.changePassword(userId, currentPassword, newPassword))
        .rejects
        .toThrow(authService.AuthenticationError);
      await expect(authService.changePassword(userId, currentPassword, newPassword))
        .rejects
        .toThrow('Current password is incorrect');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      mockFindUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.changePassword('nonexistent', 'pass', 'newpass'))
        .rejects
        .toThrow('User not found');
    });
  });
});
