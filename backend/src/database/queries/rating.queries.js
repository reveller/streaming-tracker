/**
 * Rating Database Queries
 *
 * Neo4j Cypher queries for managing title ratings.
 */

import connection from '../connection.js';
import { serializeNeo4jValue } from '../../utils/neo4j-serializer.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create or update a rating for a title.
 *
 * @param {string} titleId - Title ID
 * @param {number} stars - Rating (1-5)
 * @param {string} [review] - Optional review text
 * @returns {Promise<Object>} Created/updated rating
 */
export async function upsertRating(titleId, stars, review = null) {
  const cypher = `
    MATCH (t:Title {id: $titleId})
    MERGE (t)-[rel:HAS_RATING]->(r:Rating)
    ON CREATE SET
      r.id = $id,
      r.stars = $stars,
      r.review = $review,
      r.createdAt = datetime(),
      r.updatedAt = datetime()
    ON MATCH SET
      r.stars = $stars,
      r.review = $review,
      r.updatedAt = datetime()
    RETURN r {.*} AS rating
  `;

  const params = {
    id: uuidv4(),
    titleId,
    stars,
    review
  };

  const result = await connection.executeQuery(cypher, params);
  const rating = result[0]?.get('rating');
  return rating ? serializeNeo4jValue(rating) : null;
}

/**
 * Get rating for a title.
 *
 * @param {string} titleId - Title ID
 * @returns {Promise<Object|null>} Rating or null
 */
export async function getRatingByTitle(titleId) {
  const cypher = `
    MATCH (t:Title {id: $titleId})-[:HAS_RATING]->(r:Rating)
    RETURN r {.*} AS rating
  `;

  const result = await connection.executeQuery(cypher, { titleId });
  return result[0]?.get('rating');
}

/**
 * Delete a rating.
 *
 * @param {string} titleId - Title ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteRating(titleId) {
  const cypher = `
    MATCH (t:Title {id: $titleId})-[rel:HAS_RATING]->(r:Rating)
    DELETE rel, r
    RETURN count(r) AS deleted
  `;

  const result = await connection.executeQuery(cypher, { titleId });
  return result[0]?.get('deleted') > 0;
}

/**
 * Get all ratings for a user (across all titles).
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of ratings with title info
 */
export async function getRatingsByUser(userId) {
  const cypher = `
    MATCH (u:User {id: $userId})-[:HAS_LIST_GROUP]->(lg:ListGroup)
    MATCH (lg)<-[:IN_LIST_GROUP]-(t:Title)
    MATCH (t)-[:HAS_RATING]->(r:Rating)
    RETURN r {
      .*,
      title: t {.*}
    } AS rating
    ORDER BY r.updatedAt DESC
  `;

  const result = await connection.executeQuery(cypher, { userId });
  return result.map(record => serializeNeo4jValue(record.get('rating')));
}

/**
 * Get rating statistics for a user.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Rating statistics
 */
export async function getUserRatingStats(userId) {
  const cypher = `
    MATCH (u:User {id: $userId})-[:HAS_LIST_GROUP]->(lg:ListGroup)
    MATCH (lg)<-[:IN_LIST_GROUP]-(t:Title)
    OPTIONAL MATCH (t)-[:HAS_RATING]->(r:Rating)
    RETURN {
      totalRated: count(DISTINCT r),
      averageRating: avg(r.stars),
      fiveStars: count(CASE WHEN r.stars = 5 THEN 1 END),
      fourStars: count(CASE WHEN r.stars = 4 THEN 1 END),
      threeStars: count(CASE WHEN r.stars = 3 THEN 1 END),
      twoStars: count(CASE WHEN r.stars = 2 THEN 1 END),
      oneStar: count(CASE WHEN r.stars = 1 THEN 1 END)
    } AS stats
  `;

  const result = await connection.executeQuery(cypher, { userId });
  const stats = result[0]?.get('stats');
  return stats ? serializeNeo4jValue(stats) : {
    totalRated: 0,
    averageRating: null,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStar: 0
  };
}

/**
 * Get top rated titles for a user.
 *
 * @param {string} userId - User ID
 * @param {number} [limit=10] - Max results
 * @returns {Promise<Array>} Top rated titles
 */
export async function getTopRatedTitles(userId, limit = 10) {
  const cypher = `
    MATCH (u:User {id: $userId})-[:HAS_LIST_GROUP]->(lg:ListGroup)
    MATCH (lg)<-[:IN_LIST_GROUP]-(t:Title)
    MATCH (t)-[:HAS_RATING]->(r:Rating)
    OPTIONAL MATCH (t)-[:AVAILABLE_ON]->(s:StreamingService)
    RETURN t {
      .*,
      rating: r {.*},
      services: collect(DISTINCT s {.*})
    } AS title
    ORDER BY r.stars DESC, r.updatedAt DESC
    LIMIT $limit
  `;

  const result = await connection.executeQuery(cypher, { userId, limit });
  return result.map(record => serializeNeo4jValue(record.get('title')));
}

/**
 * Get recently rated titles for a user.
 *
 * @param {string} userId - User ID
 * @param {number} [limit=10] - Max results
 * @returns {Promise<Array>} Recently rated titles
 */
export async function getRecentlyRatedTitles(userId, limit = 10) {
  const cypher = `
    MATCH (u:User {id: $userId})-[:HAS_LIST_GROUP]->(lg:ListGroup)
    MATCH (lg)<-[:IN_LIST_GROUP]-(t:Title)
    MATCH (t)-[:HAS_RATING]->(r:Rating)
    OPTIONAL MATCH (t)-[:AVAILABLE_ON]->(s:StreamingService)
    RETURN t {
      .*,
      rating: r {.*},
      services: collect(DISTINCT s {.*})
    } AS title
    ORDER BY r.updatedAt DESC
    LIMIT $limit
  `;

  const result = await connection.executeQuery(cypher, { userId, limit });
  return result.map(record => serializeNeo4jValue(record.get('title')));
}

/**
 * Get titles with specific rating.
 *
 * @param {string} userId - User ID
 * @param {number} stars - Star rating to filter by
 * @returns {Promise<Array>} Titles with that rating
 */
export async function getTitlesByRating(userId, stars) {
  const cypher = `
    MATCH (u:User {id: $userId})-[:HAS_LIST_GROUP]->(lg:ListGroup)
    MATCH (lg)<-[:IN_LIST_GROUP]-(t:Title)
    MATCH (t)-[:HAS_RATING]->(r:Rating {stars: $stars})
    OPTIONAL MATCH (t)-[:AVAILABLE_ON]->(s:StreamingService)
    RETURN t {
      .*,
      rating: r {.*},
      services: collect(DISTINCT s {.*})
    } AS title
    ORDER BY t.name
  `;

  const result = await connection.executeQuery(cypher, { userId, stars });
  return result.map(record => serializeNeo4jValue(record.get('title')));
}
