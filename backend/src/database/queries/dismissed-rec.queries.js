/**
 * Dismissed Recommendation Database Queries
 *
 * Neo4j Cypher queries for managing the dismissed recommendations list.
 * Dismissed titles are stored as a string array on the User node (FIFO, max 100).
 */

import connection from '../connection.js';

const MAX_DISMISSED = 100;

/**
 * Get dismissed recommendation titles for a user.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array<string>>} List of dismissed title names
 */
export async function getDismissedRecs(userId) {
  const cypher = `
    MATCH (u:User {id: $userId})
    RETURN COALESCE(u.dismissedRecs, []) AS dismissed
  `;

  const result = await connection.executeQuery(cypher, { userId });
  return result[0]?.get('dismissed') || [];
}

/**
 * Add titles to the dismissed recommendations list (FIFO, max 100).
 *
 * @param {string} userId - User ID
 * @param {Array<string>} titles - Title names to dismiss
 * @returns {Promise<void>}
 */
export async function addDismissedRecs(userId, titles) {
  // Reason: Build the merged list in JS to avoid complex Cypher list operations
  const existing = await getDismissedRecs(userId);

  // Deduplicate: remove incoming titles from existing list, then append them at the end
  const filtered = existing.filter(t => !titles.includes(t));
  const merged = [...filtered, ...titles].slice(-MAX_DISMISSED);

  const cypher = `
    MATCH (u:User {id: $userId})
    SET u.dismissedRecs = $dismissed
  `;

  await connection.executeQuery(cypher, { userId, dismissed: merged });
}
