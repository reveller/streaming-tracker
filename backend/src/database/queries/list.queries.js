/**
 * List Group Database Queries
 *
 * Neo4j Cypher queries for managing list groups (genre-based collections).
 */

import connection from '../connection.js';
import { serializeRecords, serializeNeo4jValue } from '../../utils/neo4j-serializer.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new list group for a user.
 *
 * @param {string} userId - User ID
 * @param {string} genreId - Genre ID
 * @returns {Promise<Object>} Created list group
 */
export async function createListGroup(userId, genreId) {
  const cypher = `
    MATCH (u:User {id: $userId})
    MATCH (g:Genre {id: $genreId})
    CREATE (lg:ListGroup {
      id: $id,
      createdAt: datetime(),
      updatedAt: datetime()
    })
    CREATE (u)-[:HAS_LIST_GROUP]->(lg)
    CREATE (lg)-[:FOR_GENRE]->(g)
    RETURN lg {.*, genre: g {.*}} AS listGroup
  `;

  const params = {
    id: uuidv4(),
    userId,
    genreId
  };

  const result = await connection.executeQuery(cypher, params);
  const listGroup = result[0]?.get('listGroup');
  return listGroup ? serializeNeo4jValue(listGroup) : null;
}

/**
 * Get all list groups for a user.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of list groups with genres
 */
export async function getListGroupsByUser(userId) {
  const cypher = `
    MATCH (u:User {id: $userId})-[:HAS_LIST_GROUP]->(lg:ListGroup)
    MATCH (lg)-[:FOR_GENRE]->(g:Genre)
    OPTIONAL MATCH (lg)<-[:IN_LIST_GROUP]-(t:Title)
    WITH lg, g, count(t) AS titleCount
    RETURN lg {
      .*,
      genre: g {.*},
      titleCount: titleCount
    } AS listGroup
    ORDER BY g.name
  `;

  const records = await connection.executeQuery(cypher, { userId });
  return serializeRecords(records, 'listGroup');
}

/**
 * Get a specific list group by ID.
 *
 * @param {string} listGroupId - List group ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object|null>} List group or null
 */
export async function getListGroupById(listGroupId, userId) {
  const cypher = `
    MATCH (u:User {id: $userId})-[:HAS_LIST_GROUP]->(lg:ListGroup {id: $listGroupId})
    MATCH (lg)-[:FOR_GENRE]->(g:Genre)
    RETURN lg {.*, genre: g {.*}} AS listGroup
  `;

  const result = await connection.executeQuery(cypher, { listGroupId, userId });
  const listGroup = result[0]?.get('listGroup');
  return listGroup ? serializeNeo4jValue(listGroup) : null;
}

/**
 * Check if list group exists and belongs to user.
 *
 * @param {string} listGroupId - List group ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if exists and belongs to user
 */
export async function listGroupExists(listGroupId, userId) {
  const cypher = `
    MATCH (u:User {id: $userId})-[:HAS_LIST_GROUP]->(lg:ListGroup {id: $listGroupId})
    RETURN count(lg) > 0 AS exists
  `;

  const result = await connection.executeQuery(cypher, { listGroupId, userId });
  return result[0]?.get('exists') || false;
}

/**
 * Get all titles in a list group organized by list type.
 *
 * @param {string} listGroupId - List group ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Object with watchQueue, currentlyWatching, alreadyWatched arrays
 */
export async function getTitlesByListGroup(listGroupId, userId) {
  const cypher = `
    MATCH (u:User {id: $userId})-[:HAS_LIST_GROUP]->(lg:ListGroup {id: $listGroupId})
    MATCH (lg)<-[r:IN_LIST_GROUP]-(t:Title)
    OPTIONAL MATCH (t)-[:AVAILABLE_ON]->(s:StreamingService)
    OPTIONAL MATCH (t)-[:HAS_RATING]->(rating:Rating)
    WITH t, r, collect(DISTINCT s {.*}) AS services, head(collect(rating)) AS rating
    RETURN t {
      .*,
      listType: r.listType,
      position: r.position,
      services: services,
      rating: rating {.*}
    } AS title
    ORDER BY r.position
  `;

  const result = await connection.executeQuery(cypher, { listGroupId, userId });
  const titles = result.map(record => serializeNeo4jValue(record.get('title')));

  // Organize by list type
  return {
    watchQueue: titles.filter(t => t.listType === 'WATCH_QUEUE'),
    currentlyWatching: titles.filter(t => t.listType === 'CURRENTLY_WATCHING'),
    alreadyWatched: titles.filter(t => t.listType === 'ALREADY_WATCHED')
  };
}

/**
 * Delete a list group and all its title relationships.
 *
 * @param {string} listGroupId - List group ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteListGroup(listGroupId, userId) {
  const cypher = `
    MATCH (u:User {id: $userId})-[r1:HAS_LIST_GROUP]->(lg:ListGroup {id: $listGroupId})
    OPTIONAL MATCH (lg)-[r2:FOR_GENRE]->(:Genre)
    OPTIONAL MATCH (lg)<-[r3:IN_LIST_GROUP]-(:Title)
    DELETE r1, r2, r3, lg
    RETURN count(lg) AS deleted
  `;

  const result = await connection.executeQuery(cypher, { listGroupId, userId });
  return result[0]?.get('deleted') > 0;
}

/**
 * Get list group statistics.
 *
 * @param {string} listGroupId - List group ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Statistics object
 */
export async function getListGroupStats(listGroupId, userId) {
  const cypher = `
    MATCH (u:User {id: $userId})-[:HAS_LIST_GROUP]->(lg:ListGroup {id: $listGroupId})
    MATCH (lg)<-[r:IN_LIST_GROUP]-(t:Title)
    OPTIONAL MATCH (t)-[:HAS_RATING]->(rating:Rating)
    RETURN {
      totalTitles: count(DISTINCT t),
      watchQueue: count(CASE WHEN r.listType = 'WATCH_QUEUE' THEN 1 END),
      currentlyWatching: count(CASE WHEN r.listType = 'CURRENTLY_WATCHING' THEN 1 END),
      alreadyWatched: count(CASE WHEN r.listType = 'ALREADY_WATCHED' THEN 1 END),
      ratedCount: count(DISTINCT rating),
      averageRating: avg(rating.stars)
    } AS stats
  `;

  const result = await connection.executeQuery(cypher, { listGroupId, userId });
  const stats = result[0]?.get('stats');
  return stats ? serializeNeo4jValue(stats) : {
    totalTitles: 0,
    watchQueue: 0,
    currentlyWatching: 0,
    alreadyWatched: 0,
    ratedCount: 0,
    averageRating: null
  };
}

/**
 * Update list group's updated timestamp.
 *
 * @param {string} listGroupId - List group ID
 * @returns {Promise<void>}
 */
export async function touchListGroup(listGroupId) {
  const cypher = `
    MATCH (lg:ListGroup {id: $listGroupId})
    SET lg.updatedAt = datetime()
  `;

  await connection.executeQuery(cypher, { listGroupId });
}
