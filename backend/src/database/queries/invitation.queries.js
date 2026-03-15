/**
 * Invitation Database Queries
 *
 * Cypher queries for invitation-related database operations.
 */

import connection from '../connection.js';
import { serializeNeo4jValue } from '../../utils/neo4j-serializer.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new invitation in the database with a relationship to the inviter.
 *
 * @param {Object} invitationData - Invitation data
 * @param {string} invitationData.email - Invitee email address
 * @param {string} invitationData.token - Unique invitation token
 * @param {string} invitationData.expiresAt - ISO 8601 expiration timestamp
 * @param {string} invitationData.invitedByUserId - User ID of the inviter
 * @returns {Promise<Object>} Created invitation object
 * @throws {Error} If creation fails
 */
export async function createInvitation({ email, token, expiresAt, invitedByUserId }) {
  const cypher = `
    MATCH (u:User {id: $invitedByUserId})
    CREATE (i:Invitation {
      id: $id,
      email: $email,
      token: $token,
      used: false,
      expiresAt: datetime($expiresAt),
      createdAt: datetime()
    })
    CREATE (u)-[:INVITED]->(i)
    RETURN i {
      .id,
      .email,
      .token,
      .used,
      .expiresAt,
      .createdAt
    } AS invitation
  `;

  const params = {
    id: uuidv4(),
    email,
    token,
    expiresAt,
    invitedByUserId,
  };

  const result = await connection.executeQuery(cypher, params);

  if (result.length === 0) {
    throw new Error('Failed to create invitation');
  }

  return serializeNeo4jValue(result[0].get('invitation'));
}

/**
 * Find a valid (unused, not expired) invitation by token.
 *
 * @param {string} token - Invitation token
 * @returns {Promise<Object|null>} Invitation object or null if not found/invalid
 */
export async function findInvitationByToken(token) {
  const cypher = `
    MATCH (i:Invitation {token: $token})
    WHERE i.used = false AND i.expiresAt > datetime()
    RETURN i {
      .id,
      .email,
      .token,
      .used,
      .expiresAt,
      .createdAt
    } AS invitation
  `;

  const params = { token };
  const result = await connection.executeQuery(cypher, params, 'READ');

  return result.length > 0 ? serializeNeo4jValue(result[0].get('invitation')) : null;
}

/**
 * Mark an invitation as used atomically.
 *
 * Uses a WHERE clause to prevent race conditions - only marks unused invitations.
 *
 * @param {string} token - Invitation token
 * @returns {Promise<Object|null>} Updated invitation or null if already used/not found
 */
export async function markInvitationUsed(token) {
  // Reason: WHERE i.used = false prevents race conditions when two requests
  // try to redeem the same token simultaneously - only one will succeed.
  const cypher = `
    MATCH (i:Invitation {token: $token})
    WHERE i.used = false AND i.expiresAt > datetime()
    SET i.used = true, i.usedAt = datetime()
    RETURN i {
      .id,
      .email,
      .token,
      .used,
      .expiresAt,
      .createdAt,
      .usedAt
    } AS invitation
  `;

  const params = { token };
  const result = await connection.executeQuery(cypher, params);

  return result.length > 0 ? serializeNeo4jValue(result[0].get('invitation')) : null;
}

/**
 * Find all invitations sent by a specific user.
 *
 * @param {string} userId - Inviter's user ID
 * @returns {Promise<Array<Object>>} List of invitation objects
 */
export async function findInvitationsByInviter(userId) {
  const cypher = `
    MATCH (u:User {id: $userId})-[:INVITED]->(i:Invitation)
    RETURN i {
      .id,
      .email,
      .token,
      .used,
      .expiresAt,
      .createdAt,
      .usedAt
    } AS invitation
    ORDER BY i.createdAt DESC
  `;

  const params = { userId };
  const result = await connection.executeQuery(cypher, params, 'READ');

  return result.map(record => serializeNeo4jValue(record.get('invitation')));
}

/**
 * Delete an invitation by ID.
 *
 * @param {string} invitationId - Invitation ID
 * @param {string} userId - Admin user ID (must be the inviter)
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export async function deleteInvitation(invitationId, userId) {
  const cypher = `
    MATCH (u:User {id: $userId})-[:INVITED]->(i:Invitation {id: $invitationId})
    DETACH DELETE i
    RETURN count(i) > 0 AS deleted
  `;

  const params = { invitationId, userId };
  const result = await connection.executeQuery(cypher, params);

  return result.length > 0 ? result[0].get('deleted') : false;
}

/**
 * Delete all expired and unused invitations.
 *
 * @returns {Promise<number>} Number of deleted invitations
 */
export async function deleteExpiredInvitations() {
  const cypher = `
    MATCH (i:Invitation)
    WHERE i.expiresAt < datetime() AND i.used = false
    DETACH DELETE i
    RETURN count(i) AS deleted
  `;

  const result = await connection.executeQuery(cypher);

  // Reason: Neo4j returns Integer objects; convert to plain number
  return result.length > 0 ? serializeNeo4jValue(result[0].get('deleted')) : 0;
}
