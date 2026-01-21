/**
 * Title Database Queries
 *
 * Neo4j Cypher queries for managing titles (movies/TV series).
 */

import connection from '../connection.js';
import { serializeNeo4jValue } from '../../utils/neo4j-serializer.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new title.
 *
 * @param {Object} titleData - Title data
 * @param {string} titleData.type - 'MOVIE' or 'TV_SERIES'
 * @param {string} titleData.name - Title name
 * @param {string} [titleData.tmdbId] - TMDB ID
 * @param {string} [titleData.releaseYear] - Release year
 * @param {string} [titleData.posterUrl] - Poster image URL
 * @param {string} [titleData.overview] - Description
 * @returns {Promise<Object>} Created title
 */
export async function createTitle(titleData) {
  const cypher = `
    CREATE (t:Title {
      id: $id,
      type: $type,
      name: $name,
      tmdbId: $tmdbId,
      releaseYear: $releaseYear,
      posterUrl: $posterUrl,
      overview: $overview,
      createdAt: datetime(),
      updatedAt: datetime()
    })
    RETURN t {.*} AS title
  `;

  const params = {
    id: uuidv4(),
    type: titleData.type,
    name: titleData.name,
    tmdbId: titleData.tmdbId || null,
    releaseYear: titleData.releaseYear || null,
    posterUrl: titleData.posterUrl || null,
    overview: titleData.overview || null
  };

  const result = await connection.executeQuery(cypher, params);
  const title = result[0]?.get('title');
  return title ? serializeNeo4jValue(title) : null;
}

/**
 * Get title by ID.
 *
 * @param {string} titleId - Title ID
 * @returns {Promise<Object|null>} Title or null
 */
export async function getTitleById(titleId) {
  const cypher = `
    MATCH (t:Title {id: $titleId})
    OPTIONAL MATCH (t)-[:AVAILABLE_ON]->(s:StreamingService)
    OPTIONAL MATCH (t)-[:HAS_RATING]->(r:Rating)
    WITH t, collect(DISTINCT s {.*}) AS services, head(collect(r)) AS rating
    RETURN t {
      .*,
      services: services,
      rating: rating {.*}
    } AS title
  `;

  const result = await connection.executeQuery(cypher, { titleId });
  const title = result[0]?.get('title');
  return title ? serializeNeo4jValue(title) : null;
}

/**
 * Find title by TMDB ID.
 *
 * @param {string} tmdbId - TMDB ID
 * @returns {Promise<Object|null>} Title or null
 */
export async function findTitleByTmdbId(tmdbId) {
  const cypher = `
    MATCH (t:Title {tmdbId: $tmdbId})
    RETURN t {.*} AS title
    LIMIT 1
  `;

  const result = await connection.executeQuery(cypher, { tmdbId });
  return result[0]?.get('title');
}

/**
 * Add title to a list group.
 *
 * @param {string} titleId - Title ID
 * @param {string} listGroupId - List group ID
 * @param {string} listType - 'WATCH_QUEUE', 'CURRENTLY_WATCHING', or 'ALREADY_WATCHED'
 * @param {number} position - Position in list
 * @returns {Promise<Object>} Relationship properties
 */
export async function addTitleToList(titleId, listGroupId, listType, position) {
  const cypher = `
    MATCH (t:Title {id: $titleId})
    MATCH (lg:ListGroup {id: $listGroupId})
    MERGE (t)-[r:IN_LIST_GROUP {listGroupId: $listGroupId}]->(lg)
    SET r.listType = $listType,
        r.position = $position,
        r.addedAt = datetime(),
        r.updatedAt = datetime()
    RETURN r {.*} AS relationship
  `;

  const result = await connection.executeQuery(cypher, {
    titleId,
    listGroupId,
    listType,
    position
  });

  const relationship = result[0]?.get('relationship');
  return relationship ? serializeNeo4jValue(relationship) : null;
}

/**
 * Move title to different list within same list group.
 *
 * @param {string} titleId - Title ID
 * @param {string} listGroupId - List group ID
 * @param {string} newListType - New list type
 * @param {number} newPosition - New position
 * @returns {Promise<boolean>} True if moved
 */
export async function moveTitleToList(titleId, listGroupId, newListType, newPosition) {
  // Get the current list type and position
  const getCurrentCypher = `
    MATCH (t:Title {id: $titleId})-[r:IN_LIST_GROUP {listGroupId: $listGroupId}]->(lg:ListGroup)
    RETURN r.listType AS oldListType, r.position AS oldPosition
  `;

  const currentResult = await connection.executeQuery(getCurrentCypher, { titleId, listGroupId });
  const oldListType = currentResult[0]?.get('oldListType');
  const oldPositionRaw = currentResult[0]?.get('oldPosition');
  const oldPosition = serializeNeo4jValue(oldPositionRaw);

  console.log(`[moveTitleToList] titleId=${titleId}, oldListType=${oldListType}, oldPosition=${oldPosition}, newListType=${newListType}, newPosition=${newPosition}`);

  // If moving within the same list, we need to reorder positions
  if (oldListType === newListType) {
    console.log(`[moveTitleToList] Same-list reordering detected`);
    // Same list reordering
    const reorderCypher = `
      MATCH (lg:ListGroup)<-[r:IN_LIST_GROUP {listGroupId: $listGroupId}]-(t:Title)
      WHERE r.listType = $listType AND t.id <> $titleId
      WITH r,
           CASE
             WHEN $oldPosition < $newPosition AND r.position > $oldPosition AND r.position <= $newPosition THEN r.position - 1
             WHEN $oldPosition > $newPosition AND r.position >= $newPosition AND r.position < $oldPosition THEN r.position + 1
             ELSE r.position
           END AS adjustedPosition
      SET r.position = adjustedPosition
      RETURN count(r) AS adjusted
    `;

    await connection.executeQuery(reorderCypher, {
      listGroupId,
      listType: oldListType,
      titleId,
      oldPosition,
      newPosition
    });
  } else {
    // Moving to different list - shift positions in old list
    const shiftOldCypher = `
      MATCH (lg:ListGroup)<-[r:IN_LIST_GROUP {listGroupId: $listGroupId}]-(t:Title)
      WHERE r.listType = $oldListType AND r.position > $oldPosition
      SET r.position = r.position - 1
      RETURN count(r) AS shifted
    `;

    await connection.executeQuery(shiftOldCypher, {
      listGroupId,
      oldListType,
      oldPosition
    });

    // Shift positions in new list to make room
    const shiftNewCypher = `
      MATCH (lg:ListGroup)<-[r:IN_LIST_GROUP {listGroupId: $listGroupId}]-(t:Title)
      WHERE r.listType = $newListType AND r.position >= $newPosition
      SET r.position = r.position + 1
      RETURN count(r) AS shifted
    `;

    await connection.executeQuery(shiftNewCypher, {
      listGroupId,
      newListType,
      newPosition
    });
  }

  // Finally, update the moved title
  const updateCypher = `
    MATCH (t:Title {id: $titleId})-[r:IN_LIST_GROUP {listGroupId: $listGroupId}]->(lg:ListGroup)
    SET r.listType = $newListType,
        r.position = $newPosition,
        r.updatedAt = datetime()
    RETURN count(r) AS updated
  `;

  const result = await connection.executeQuery(updateCypher, {
    titleId,
    listGroupId,
    newListType,
    newPosition
  });

  // Normalize all positions in both lists to remove gaps
  const normalizeOldCypher = `
    MATCH (lg:ListGroup {id: $listGroupId})<-[r:IN_LIST_GROUP]-(t:Title)
    WHERE r.listType = $oldListType
    WITH r ORDER BY r.position
    WITH collect(r) AS rels
    UNWIND range(0, size(rels) - 1) AS idx
    WITH rels[idx] AS rel, idx
    SET rel.position = idx
    RETURN count(rel) AS normalized
  `;

  await connection.executeQuery(normalizeOldCypher, {
    listGroupId,
    oldListType
  });

  if (oldListType !== newListType) {
    const normalizeNewCypher = `
      MATCH (lg:ListGroup {id: $listGroupId})<-[r:IN_LIST_GROUP]-(t:Title)
      WHERE r.listType = $newListType
      WITH r ORDER BY r.position
      WITH collect(r) AS rels
      UNWIND range(0, size(rels) - 1) AS idx
      WITH rels[idx] AS rel, idx
      SET rel.position = idx
      RETURN count(rel) AS normalized
    `;

    await connection.executeQuery(normalizeNewCypher, {
      listGroupId,
      newListType
    });
  }

  console.log(`[moveTitleToList] Positions normalized for both lists`);

  return result[0]?.get('updated') > 0;
}

/**
 * Update title position within the same list.
 *
 * @param {string} titleId - Title ID
 * @param {string} listGroupId - List group ID
 * @param {number} newPosition - New position
 * @returns {Promise<boolean>} True if updated
 */
export async function updateTitlePosition(titleId, listGroupId, newPosition) {
  const cypher = `
    MATCH (t:Title {id: $titleId})-[r:IN_LIST_GROUP {listGroupId: $listGroupId}]->(:ListGroup)
    SET r.position = $newPosition,
        r.updatedAt = datetime()
    RETURN count(r) AS updated
  `;

  const result = await connection.executeQuery(cypher, {
    titleId,
    listGroupId,
    newPosition
  });

  return result[0]?.get('updated') > 0;
}

/**
 * Remove title from a list group.
 *
 * @param {string} titleId - Title ID
 * @param {string} listGroupId - List group ID
 * @returns {Promise<boolean>} True if removed
 */
export async function removeTitleFromList(titleId, listGroupId) {
  const cypher = `
    MATCH (t:Title {id: $titleId})-[r:IN_LIST_GROUP {listGroupId: $listGroupId}]->(:ListGroup)
    DELETE r
    RETURN count(r) AS deleted
  `;

  const result = await connection.executeQuery(cypher, { titleId, listGroupId });
  return result[0]?.get('deleted') > 0;
}

/**
 * Get max position for a list type in a list group.
 *
 * @param {string} listGroupId - List group ID
 * @param {string} listType - List type
 * @returns {Promise<number>} Max position (or -1 if empty)
 */
export async function getMaxPosition(listGroupId, listType) {
  const cypher = `
    MATCH (:ListGroup {id: $listGroupId})<-[r:IN_LIST_GROUP]-(t:Title)
    WHERE r.listType = $listType
    RETURN coalesce(max(r.position), -1) AS maxPosition
  `;

  const result = await connection.executeQuery(cypher, { listGroupId, listType });
  const maxPosition = result[0]?.get('maxPosition');
  return maxPosition !== null && maxPosition !== undefined ? serializeNeo4jValue(maxPosition) : -1;
}

/**
 * Link title to streaming service.
 *
 * @param {string} titleId - Title ID
 * @param {string} serviceId - Streaming service ID
 * @returns {Promise<boolean>} True if linked
 */
export async function linkTitleToService(titleId, serviceId) {
  const cypher = `
    MATCH (t:Title {id: $titleId})
    MATCH (s:StreamingService {id: $serviceId})
    MERGE (t)-[r:AVAILABLE_ON]->(s)
    RETURN count(r) AS created
  `;

  const result = await connection.executeQuery(cypher, { titleId, serviceId });
  return result[0]?.get('created') > 0;
}

/**
 * Unlink title from streaming service.
 *
 * @param {string} titleId - Title ID
 * @param {string} serviceId - Streaming service ID
 * @returns {Promise<boolean>} True if unlinked
 */
export async function unlinkTitleFromService(titleId, serviceId) {
  const cypher = `
    MATCH (t:Title {id: $titleId})-[r:AVAILABLE_ON]->(s:StreamingService {id: $serviceId})
    DELETE r
    RETURN count(r) AS deleted
  `;

  const result = await connection.executeQuery(cypher, { titleId, serviceId });
  return result[0]?.get('deleted') > 0;
}

/**
 * Search titles by name.
 *
 * @param {string} searchTerm - Search term
 * @param {number} [limit=20] - Max results
 * @returns {Promise<Array>} Matching titles
 */
export async function searchTitles(searchTerm, limit = 20) {
  const cypher = `
    MATCH (t:Title)
    WHERE toLower(t.name) CONTAINS toLower($searchTerm)
    OPTIONAL MATCH (t)-[:AVAILABLE_ON]->(s:StreamingService)
    WITH t, collect(DISTINCT s {.*}) AS services
    RETURN t {
      .*,
      services: services
    } AS title
    ORDER BY t.name
    LIMIT $limit
  `;

  const result = await connection.executeQuery(cypher, { searchTerm, limit });
  return result.map(record => serializeNeo4jValue(record.get('title')));
}

/**
 * Get titles by user (all titles across all list groups).
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array>} All user's titles
 */
export async function getTitlesByUser(userId) {
  const cypher = `
    MATCH (u:User {id: $userId})-[:HAS_LIST_GROUP]->(lg:ListGroup)
    MATCH (lg)<-[r:IN_LIST_GROUP]-(t:Title)
    OPTIONAL MATCH (t)-[:AVAILABLE_ON]->(s:StreamingService)
    OPTIONAL MATCH (t)-[:HAS_RATING]->(rating:Rating)
    WITH DISTINCT t, collect(DISTINCT s {.*}) AS services, head(collect(rating)) AS rating
    RETURN t {
      .*,
      services: services,
      rating: rating {.*}
    } AS title
    ORDER BY t.name
  `;

  const result = await connection.executeQuery(cypher, { userId });
  return result.map(record => serializeNeo4jValue(record.get('title')));
}

/**
 * Delete title completely.
 *
 * @param {string} titleId - Title ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteTitle(titleId) {
  const cypher = `
    MATCH (t:Title {id: $titleId})
    OPTIONAL MATCH (t)-[r]-()
    DELETE r, t
    RETURN count(t) AS deleted
  `;

  const result = await connection.executeQuery(cypher, { titleId });
  return result[0]?.get('deleted') > 0;
}

/**
 * Check if title exists in a specific list.
 *
 * @param {string} titleId - Title ID
 * @param {string} listGroupId - List group ID
 * @returns {Promise<boolean>} True if exists
 */
export async function titleExistsInList(titleId, listGroupId) {
  const cypher = `
    MATCH (t:Title {id: $titleId})-[r:IN_LIST_GROUP {listGroupId: $listGroupId}]->(:ListGroup)
    RETURN count(r) > 0 AS exists
  `;

  const result = await connection.executeQuery(cypher, { titleId, listGroupId });
  return result[0]?.get('exists') || false;
}

/**
 * Update title metadata.
 *
 * @param {string} titleId - Title ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated title
 */
export async function updateTitle(titleId, updates) {
  const allowedFields = ['name', 'releaseYear', 'posterUrl', 'overview'];
  const setClauses = [];
  const params = { titleId };

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      setClauses.push(`t.${key} = $${key}`);
      params[key] = updates[key];
    }
  });

  if (setClauses.length === 0) {
    return getTitleById(titleId);
  }

  const cypher = `
    MATCH (t:Title {id: $titleId})
    SET ${setClauses.join(', ')},
        t.updatedAt = datetime()
    RETURN t {.*} AS title
  `;

  const result = await connection.executeQuery(cypher, params);
  const title = result[0]?.get('title');
  return title ? serializeNeo4jValue(title) : null;
}
