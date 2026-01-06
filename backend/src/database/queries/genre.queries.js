/**
 * Genre Database Queries
 *
 * Neo4j Cypher queries for managing genres.
 */

import connection from '../connection.js';
import { serializeRecords } from '../../utils/neo4j-serializer.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all genres.
 *
 * @returns {Promise<Array>} List of all genres
 */
export async function getAllGenres() {
  const cypher = `
    MATCH (g:Genre)
    RETURN g {.*} AS genre
    ORDER BY g.name
  `;

  const records = await connection.executeQuery(cypher);
  return serializeRecords(records, 'genre');
}

/**
 * Get genre by ID.
 *
 * @param {string} genreId - Genre ID
 * @returns {Promise<Object|null>} Genre or null
 */
export async function getGenreById(genreId) {
  const cypher = `
    MATCH (g:Genre {id: $genreId})
    RETURN g {.*} AS genre
  `;

  const result = await connection.executeQuery(cypher, { genreId });
  return result[0]?.get('genre');
}

/**
 * Find genre by name.
 *
 * @param {string} name - Genre name
 * @returns {Promise<Object|null>} Genre or null
 */
export async function findGenreByName(name) {
  const cypher = `
    MATCH (g:Genre)
    WHERE toLower(g.name) = toLower($name)
    RETURN g {.*} AS genre
    LIMIT 1
  `;

  const result = await connection.executeQuery(cypher, { name });
  return result[0]?.get('genre');
}

/**
 * Create a new genre.
 *
 * @param {string} name - Genre name
 * @returns {Promise<Object>} Created genre
 */
export async function createGenre(name) {
  const cypher = `
    CREATE (g:Genre {
      id: $id,
      name: $name,
      createdAt: datetime()
    })
    RETURN g {.*} AS genre
  `;

  const params = {
    id: uuidv4(),
    name
  };

  const result = await connection.executeQuery(cypher, params);
  return result[0]?.get('genre');
}

/**
 * Update genre name.
 *
 * @param {string} genreId - Genre ID
 * @param {string} newName - New genre name
 * @returns {Promise<Object>} Updated genre
 */
export async function updateGenre(genreId, newName) {
  const cypher = `
    MATCH (g:Genre {id: $genreId})
    SET g.name = $newName
    RETURN g {.*} AS genre
  `;

  const result = await connection.executeQuery(cypher, { genreId, newName });
  return result[0]?.get('genre');
}

/**
 * Delete a genre.
 *
 * @param {string} genreId - Genre ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteGenre(genreId) {
  const cypher = `
    MATCH (g:Genre {id: $genreId})
    OPTIONAL MATCH (g)<-[r]-()
    DELETE r, g
    RETURN count(g) AS deleted
  `;

  const result = await connection.executeQuery(cypher, { genreId });
  return result[0]?.get('deleted') > 0;
}

/**
 * Check if genre name already exists.
 *
 * @param {string} name - Genre name
 * @param {string} [excludeId] - Genre ID to exclude (for updates)
 * @returns {Promise<boolean>} True if exists
 */
export async function genreNameExists(name, excludeId = null) {
  const cypher = excludeId
    ? `
      MATCH (g:Genre)
      WHERE toLower(g.name) = toLower($name) AND g.id <> $excludeId
      RETURN count(g) > 0 AS exists
    `
    : `
      MATCH (g:Genre)
      WHERE toLower(g.name) = toLower($name)
      RETURN count(g) > 0 AS exists
    `;

  const params = excludeId ? { name, excludeId } : { name };
  const result = await connection.executeQuery(cypher, params);
  return result[0]?.get('exists') || false;
}
