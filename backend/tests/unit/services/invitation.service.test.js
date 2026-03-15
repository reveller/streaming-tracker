/**
 * Invitation Service Unit Tests
 *
 * Tests for invitation.service.js functions.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before importing modules that use them
const mockFindUserById = jest.fn();
const mockEmailExists = jest.fn();
const mockUsernameExists = jest.fn();
const mockCreateUser = jest.fn();

const mockCreateInvitation = jest.fn();
const mockFindInvitationByToken = jest.fn();
const mockMarkInvitationUsed = jest.fn();
const mockFindInvitationsByInviter = jest.fn();

const mockSendInvitationEmail = jest.fn();

const mockBcryptHash = jest.fn();

jest.unstable_mockModule('../../../src/database/queries/user.queries.js', () => ({
  findUserById: mockFindUserById,
  emailExists: mockEmailExists,
  usernameExists: mockUsernameExists,
  createUser: mockCreateUser,
}));

jest.unstable_mockModule('../../../src/database/queries/invitation.queries.js', () => ({
  createInvitation: mockCreateInvitation,
  findInvitationByToken: mockFindInvitationByToken,
  markInvitationUsed: mockMarkInvitationUsed,
  findInvitationsByInviter: mockFindInvitationsByInviter,
}));

jest.unstable_mockModule('../../../src/services/email.service.js', () => ({
  sendInvitationEmail: mockSendInvitationEmail,
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash: mockBcryptHash,
  },
}));

// Import service after mocking
const invitationService = await import('../../../src/services/invitation.service.js');

// Set up test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-unit-tests';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-key-for-unit-tests';
process.env.JWT_EXPIRES_IN = '24h';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
process.env.INVITATION_EXPIRY_MINUTES = '10';

describe('InvitationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvitation', () => {
    it('should create an invitation and send email successfully', async () => {
      // Arrange
      const inviterUserId = 'admin-123';
      const email = 'newuser@example.com';
      const mockAdmin = {
        id: inviterUserId,
        email: 'admin@example.com',
        username: 'adminuser',
        role: 'admin',
      };
      const mockInvitation = {
        id: 'inv-123',
        email,
        token: 'some-token',
        used: false,
        expiresAt: new Date(Date.now() + 600000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      mockFindUserById.mockResolvedValue(mockAdmin);
      mockEmailExists.mockResolvedValue(false);
      mockCreateInvitation.mockResolvedValue(mockInvitation);
      mockSendInvitationEmail.mockResolvedValue({});

      // Act
      const result = await invitationService.createInvitation(inviterUserId, email);

      // Assert
      expect(result).toEqual(mockInvitation);
      expect(mockFindUserById).toHaveBeenCalledWith(inviterUserId);
      expect(mockEmailExists).toHaveBeenCalledWith(email);
      expect(mockCreateInvitation).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          invitedByUserId: inviterUserId,
        })
      );
      expect(mockSendInvitationEmail).toHaveBeenCalledWith(
        email,
        expect.any(String),
        mockAdmin.username
      );
    });

    it('should throw error if inviter is not an admin', async () => {
      // Arrange
      const inviterUserId = 'user-456';
      const mockUser = {
        id: inviterUserId,
        email: 'user@example.com',
        username: 'regularuser',
        role: 'user',
      };

      mockFindUserById.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(invitationService.createInvitation(inviterUserId, 'new@example.com'))
        .rejects
        .toThrow(invitationService.InvitationError);
      await expect(invitationService.createInvitation(inviterUserId, 'new@example.com'))
        .rejects
        .toThrow('Only administrators can send invitations');
    });

    it('should throw error if email is already registered', async () => {
      // Arrange
      const inviterUserId = 'admin-123';
      const mockAdmin = {
        id: inviterUserId,
        email: 'admin@example.com',
        username: 'adminuser',
        role: 'admin',
      };

      mockFindUserById.mockResolvedValue(mockAdmin);
      mockEmailExists.mockResolvedValue(true);

      // Act & Assert
      await expect(invitationService.createInvitation(inviterUserId, 'existing@example.com'))
        .rejects
        .toThrow(invitationService.InvitationError);
      await expect(invitationService.createInvitation(inviterUserId, 'existing@example.com'))
        .rejects
        .toThrow('A user with this email already exists');
    });
  });

  describe('validateInvitationToken', () => {
    it('should return invitation data for a valid token', async () => {
      // Arrange
      const token = 'valid-token-hex';
      const mockInvitation = {
        id: 'inv-123',
        email: 'invited@example.com',
        token,
        used: false,
        expiresAt: new Date(Date.now() + 600000).toISOString(),
      };

      mockFindInvitationByToken.mockResolvedValue(mockInvitation);

      // Act
      const result = await invitationService.validateInvitationToken(token);

      // Assert
      expect(result).toHaveProperty('email', mockInvitation.email);
      expect(result).toHaveProperty('expiresAt', mockInvitation.expiresAt);
      expect(mockFindInvitationByToken).toHaveBeenCalledWith(token);
    });

    it('should throw error for expired or used token', async () => {
      // Arrange
      mockFindInvitationByToken.mockResolvedValue(null);

      // Act & Assert
      await expect(invitationService.validateInvitationToken('expired-token'))
        .rejects
        .toThrow(invitationService.InvitationError);
      await expect(invitationService.validateInvitationToken('expired-token'))
        .rejects
        .toThrow('Invalid or expired invitation token');
    });

    it('should throw InvitationError (not generic error) for invalid tokens', async () => {
      // Arrange
      mockFindInvitationByToken.mockResolvedValue(null);

      // Act & Assert
      try {
        await invitationService.validateInvitationToken('bad-token');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(invitationService.InvitationError);
        expect(error.statusCode).toBe(400);
      }
    });
  });

  describe('redeemInvitation', () => {
    it('should redeem invitation and create user successfully', async () => {
      // Arrange
      const token = 'valid-redeem-token';
      const userData = { username: 'newuser', password: 'Password123!' };
      const mockInvitation = {
        id: 'inv-123',
        email: 'invited@example.com',
        token,
        used: true,
        usedAt: new Date().toISOString(),
      };
      const mockUser = {
        id: 'user-new-123',
        email: 'invited@example.com',
        username: 'newuser',
        role: 'user',
        createdAt: new Date().toISOString(),
      };

      mockMarkInvitationUsed.mockResolvedValue(mockInvitation);
      mockUsernameExists.mockResolvedValue(false);
      mockBcryptHash.mockResolvedValue('hashedpassword');
      mockCreateUser.mockResolvedValue(mockUser);

      // Act
      const result = await invitationService.redeemInvitation(token, userData);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(mockInvitation.email);
      expect(result.user.username).toBe(userData.username);
      expect(mockMarkInvitationUsed).toHaveBeenCalledWith(token);
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: mockInvitation.email,
        username: userData.username,
        passwordHash: 'hashedpassword',
      });
    });

    it('should throw error for invalid or already-used token', async () => {
      // Arrange
      mockMarkInvitationUsed.mockResolvedValue(null);

      // Act & Assert
      await expect(
        invitationService.redeemInvitation('used-token', {
          username: 'newuser',
          password: 'Password123!',
        })
      )
        .rejects
        .toThrow('Invalid or expired invitation token');
    });

    it('should throw error if username is already taken', async () => {
      // Arrange
      const mockInvitation = {
        id: 'inv-123',
        email: 'invited@example.com',
        token: 'valid-token',
        used: true,
      };

      mockMarkInvitationUsed.mockResolvedValue(mockInvitation);
      mockUsernameExists.mockResolvedValue(true);

      // Act & Assert
      await expect(
        invitationService.redeemInvitation('valid-token', {
          username: 'takenuser',
          password: 'Password123!',
        })
      )
        .rejects
        .toThrow('Username already exists');
    });
  });

  describe('listInvitations', () => {
    it('should return list of invitations for admin', async () => {
      // Arrange
      const userId = 'admin-123';
      const mockInvitations = [
        { id: 'inv-1', email: 'a@example.com', used: false },
        { id: 'inv-2', email: 'b@example.com', used: true },
      ];

      mockFindInvitationsByInviter.mockResolvedValue(mockInvitations);

      // Act
      const result = await invitationService.listInvitations(userId);

      // Assert
      expect(result).toEqual(mockInvitations);
      expect(mockFindInvitationsByInviter).toHaveBeenCalledWith(userId);
    });

    it('should return empty array when no invitations exist', async () => {
      // Arrange
      mockFindInvitationsByInviter.mockResolvedValue([]);

      // Act
      const result = await invitationService.listInvitations('admin-123');

      // Assert
      expect(result).toEqual([]);
    });

    it('should propagate database errors', async () => {
      // Arrange
      mockFindInvitationsByInviter.mockRejectedValue(new Error('DB connection failed'));

      // Act & Assert
      await expect(invitationService.listInvitations('admin-123'))
        .rejects
        .toThrow('DB connection failed');
    });
  });
});
