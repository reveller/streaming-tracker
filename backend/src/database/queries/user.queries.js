/**
 * User Database Queries
 *
 * Cypher queries for user-related database operations.
 */

import connection from '../connection.js';
import { serializeNeo4jValue } from '../../utils/neo4j-serializer.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new user in the database.
 *
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.username - User username
 * @param {string} userData.passwordHash - Hashed password
 * @returns {Promise<Object>} Created user object
 */
export async function createUser({ email, username, passwordHash }) {
  const cypher = `
    CREATE (u:User {
      id: $id,
      email: $email,
      username: $username,
      passwordHash: $passwordHash,
      createdAt: datetime(),
      updatedAt: datetime(),
      lastLoginAt: null
    })
    RETURN u {
      .id,
      .email,
      .username,
      .createdAt,
      .updatedAt
    } AS user
  `;

  const params = {
    id: uuidv4(),
    email,
    username,
    passwordHash
  };

  const result = await connection.executeQuery(cypher, params);

  if (result.length === 0) {
    throw new Error('Failed to create user');
  }

  return serializeNeo4jValue(result[0].get('user'));
}

/**
 * Find user by email.
 *
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function findUserByEmail(email) {
  const cypher = `
    MATCH (u:User {email: $email})
    RETURN u {
      .id,
      .email,
      .username,
      .passwordHash,
      .createdAt,
      .updatedAt,
      .lastLoginAt
    } AS user
  `;

  const params = { email };
  const result = await connection.executeQuery(cypher, params, 'READ');

  return result.length > 0 ? serializeNeo4jValue(result[0].get('user')) : null;
}

/**
 * Find user by username.
 *
 * @param {string} username - Username
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function findUserByUsername(username) {
  const cypher = `
    MATCH (u:User {username: $username})
    RETURN u {
      .id,
      .email,
      .username,
      .passwordHash,
      .createdAt,
      .updatedAt,
      .lastLoginAt
    } AS user
  `;

  const params = { username };
  const result = await connection.executeQuery(cypher, params, 'READ');

  return result.length > 0 ? serializeNeo4jValue(result[0].get('user')) : null;
}

/**
 * Find user by ID.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function findUserById(userId) {
  const cypher = `
    MATCH (u:User {id: $userId})
    RETURN u {
      .id,
      .email,
      .username,
      .createdAt,
      .updatedAt,
      .lastLoginAt
    } AS user
  `;

  const params = { userId };
  const result = await connection.executeQuery(cypher, params, 'READ');

  return result.length > 0 ? serializeNeo4jValue(result[0].get('user')) : null;
}

/**
 * Update user's last login timestamp.
 *
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function updateLastLogin(userId) {
  const cypher = `
    MATCH (u:User {id: $userId})
    SET u.lastLoginAt = datetime()
    RETURN u
  `;

  const params = { userId };
  await connection.executeQuery(cypher, params);
}

/**
 * Update user profile.
 *
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @param {string} [updates.email] - New email
 * @param {string} [updates.username] - New username
 * @returns {Promise<Object>} Updated user object
 */
export async function updateUserProfile(userId, updates) {
  const allowedFields = ['email', 'username'];
  const setClauses = [];
  const params = { userId };

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      setClauses.push(`u.${key} = $${key}`);
      params[key] = updates[key];
    }
  });

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }

  setClauses.push('u.updatedAt = datetime()');

  const cypher = `
    MATCH (u:User {id: $userId})
    SET ${setClauses.join(', ')}
    RETURN u {
      .id,
      .email,
      .username,
      .createdAt,
      .updatedAt,
      .lastLoginAt
    } AS user
  `;

  const result = await connection.executeQuery(cypher, params);

  if (result.length === 0) {
    throw new Error('User not found');
  }

  return result[0].get('user');
}

/**
 * Update user password.
 *
 * @param {string} userId - User ID
 * @param {string} newPasswordHash - New hashed password
 * @returns {Promise<void>}
 */
export async function updateUserPassword(userId, newPasswordHash) {
  const cypher = `
    MATCH (u:User {id: $userId})
    SET u.passwordHash = $newPasswordHash,
        u.updatedAt = datetime()
    RETURN u
  `;

  const params = { userId, newPasswordHash };
  const result = await connection.executeQuery(cypher, params);

  if (result.length === 0) {
    throw new Error('User not found');
  }
}

/**
 * Delete user by ID.
 *
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function deleteUser(userId) {
  const cypher = `
    MATCH (u:User {id: $userId})
    DETACH DELETE u
  `;

  const params = { userId };
  await connection.executeQuery(cypher, params);
}

/**
 * Check if email already exists.
 *
 * @param {string} email - Email to check
 * @param {string} [excludeUserId] - User ID to exclude from check
 * @returns {Promise<boolean>} True if email exists
 */
export async function emailExists(email, excludeUserId = null) {
  let cypher = `
    MATCH (u:User {email: $email})
  `;

  const params = { email };

  if (excludeUserId) {
    cypher += ' WHERE u.id <> $excludeUserId';
    params.excludeUserId = excludeUserId;
  }

  cypher += ' RETURN count(u) > 0 AS exists';

  const result = await connection.executeQuery(cypher, params, 'READ');
  return result[0].get('exists');
}

/**
 * Check if username already exists.
 *
 * @param {string} username - Username to check
 * @param {string} [excludeUserId] - User ID to exclude from check
 * @returns {Promise<boolean>} True if username exists
 */
export async function usernameExists(username, excludeUserId = null) {
  let cypher = `
    MATCH (u:User {username: $username})
  `;

  const params = { username };

  if (excludeUserId) {
    cypher += ' WHERE u.id <> $excludeUserId';
    params.excludeUserId = excludeUserId;
  }

  cypher += ' RETURN count(u) > 0 AS exists';

  const result = await connection.executeQuery(cypher, params, 'READ');
  return result[0].get('exists');
}

/**
 * Get user statistics.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User statistics
 */
export async function getUserStats(userId) {
  const cypher = `
    MATCH (u:User {id: $userId})
    OPTIONAL MATCH (u)-[:OWNS]->(lg:ListGroup)
    OPTIONAL MATCH (t:Title)-[:IN_WATCH_QUEUE|CURRENTLY_WATCHING|ALREADY_WATCHED]->(lg)
    OPTIONAL MATCH (u)-[:RATED]->(r:Rating)
    RETURN {
      totalLists: count(DISTINCT lg),
      totalTitles: count(DISTINCT t),
      totalRatings: count(DISTINCT r)
    } AS stats
  `;

  const params = { userId };
  const result = await connection.executeQuery(cypher, params, 'READ');

  return serializeNeo4jValue(result[0].get('stats'));
}
