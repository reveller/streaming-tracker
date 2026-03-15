/**
 * Admin Middleware Unit Tests
 *
 * Tests for admin.middleware.js requireAdmin function.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before importing
const mockFindUserById = jest.fn();

jest.unstable_mockModule('../../../src/database/queries/user.queries.js', () => ({
  findUserById: mockFindUserById,
}));

// Import after mocking
const { requireAdmin } = await import('../../../src/middleware/admin.middleware.js');

describe('requireAdmin middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { userId: 'user-123' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('should call next() when user is admin', async () => {
    // Arrange
    const mockAdmin = {
      id: 'user-123',
      email: 'admin@example.com',
      username: 'admin',
      role: 'admin',
    };
    mockFindUserById.mockResolvedValue(mockAdmin);

    // Act
    await requireAdmin(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(mockFindUserById).toHaveBeenCalledWith('user-123');
  });

  it('should return 403 when user is not admin', async () => {
    // Arrange
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      username: 'regularuser',
      role: 'user',
    };
    mockFindUserById.mockResolvedValue(mockUser);

    // Act
    await requireAdmin(req, res, next);

    // Assert
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  });

  it('should return 404 when user is not found', async () => {
    // Arrange
    mockFindUserById.mockResolvedValue(null);

    // Act
    await requireAdmin(req, res, next);

    // Assert
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      },
    });
  });

  it('should return 500 when database query fails', async () => {
    // Arrange
    mockFindUserById.mockRejectedValue(new Error('DB error'));

    // Act
    await requireAdmin(req, res, next);

    // Assert
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while checking permissions',
      },
    });
  });
});
