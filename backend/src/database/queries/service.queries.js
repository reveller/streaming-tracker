/**
 * Streaming Service Database Queries
 *
 * Neo4j Cypher queries for managing streaming services.
 */

import connection from '../connection.js';
import { serializeNeo4jValue } from '../../utils/neo4j-serializer.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all streaming services.
 *
 * @returns {Promise<Array>} List of all streaming services
 */
export async function getAllServices() {
  const cypher = `
    MATCH (s:StreamingService)
    RETURN s {.*} AS service
    ORDER BY s.name
  `;

  const result = await connection.executeQuery(cypher);
  return result.map(record => serializeNeo4jValue(record.get('service')));
}

/**
 * Get streaming service by ID.
 *
 * @param {string} serviceId - Service ID
 * @returns {Promise<Object|null>} Service or null
 */
export async function getServiceById(serviceId) {
  const cypher = `
    MATCH (s:StreamingService {id: $serviceId})
    RETURN s {.*} AS service
  `;

  const result = await connection.executeQuery(cypher, { serviceId });
  const service = result[0]?.get('service');
  return service ? serializeNeo4jValue(service) : null;
}

/**
 * Find streaming service by name.
 *
 * @param {string} name - Service name
 * @returns {Promise<Object|null>} Service or null
 */
export async function findServiceByName(name) {
  const cypher = `
    MATCH (s:StreamingService)
    WHERE toLower(s.name) = toLower($name)
    RETURN s {.*} AS service
    LIMIT 1
  `;

  const result = await connection.executeQuery(cypher, { name });
  const service = result[0]?.get('service');
  return service ? serializeNeo4jValue(service) : null;
}

/**
 * Create a new streaming service.
 *
 * @param {Object} serviceData - Service data
 * @param {string} serviceData.name - Service name
 * @param {string} [serviceData.logoUrl] - Logo URL
 * @returns {Promise<Object>} Created service
 */
export async function createService(serviceData) {
  const cypher = `
    CREATE (s:StreamingService {
      id: $id,
      name: $name,
      logoUrl: $logoUrl,
      createdAt: datetime()
    })
    RETURN s {.*} AS service
  `;

  const params = {
    id: uuidv4(),
    name: serviceData.name,
    logoUrl: serviceData.logoUrl || null
  };

  const result = await connection.executeQuery(cypher, params);
  const service = result[0]?.get('service');
  return service ? serializeNeo4jValue(service) : null;
}

/**
 * Update streaming service.
 *
 * @param {string} serviceId - Service ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated service
 */
export async function updateService(serviceId, updates) {
  const allowedFields = ['name', 'logoUrl'];
  const setClauses = [];
  const params = { serviceId };

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      setClauses.push(`s.${key} = $${key}`);
      params[key] = updates[key];
    }
  });

  if (setClauses.length === 0) {
    return getServiceById(serviceId);
  }

  const cypher = `
    MATCH (s:StreamingService {id: $serviceId})
    SET ${setClauses.join(', ')}
    RETURN s {.*} AS service
  `;

  const result = await connection.executeQuery(cypher, params);
  const service = result[0]?.get('service');
  return service ? serializeNeo4jValue(service) : null;
}

/**
 * Delete a streaming service.
 *
 * @param {string} serviceId - Service ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteService(serviceId) {
  const cypher = `
    MATCH (s:StreamingService {id: $serviceId})
    OPTIONAL MATCH (s)<-[r]-()
    DELETE r, s
    RETURN count(s) AS deleted
  `;

  const result = await connection.executeQuery(cypher, { serviceId });
  return result[0]?.get('deleted') > 0;
}

/**
 * Check if service name already exists.
 *
 * @param {string} name - Service name
 * @param {string} [excludeId] - Service ID to exclude (for updates)
 * @returns {Promise<boolean>} True if exists
 */
export async function serviceNameExists(name, excludeId = null) {
  const cypher = excludeId
    ? `
      MATCH (s:StreamingService)
      WHERE toLower(s.name) = toLower($name) AND s.id <> $excludeId
      RETURN count(s) > 0 AS exists
    `
    : `
      MATCH (s:StreamingService)
      WHERE toLower(s.name) = toLower($name)
      RETURN count(s) > 0 AS exists
    `;

  const params = excludeId ? { name, excludeId } : { name };
  const result = await connection.executeQuery(cypher, params);
  return result[0]?.get('exists') || false;
}

/**
 * Get titles available on a service.
 *
 * @param {string} serviceId - Service ID
 * @param {number} [limit=50] - Max results
 * @returns {Promise<Array>} Titles on this service
 */
export async function getTitlesByService(serviceId, limit = 50) {
  const cypher = `
    MATCH (s:StreamingService {id: $serviceId})<-[:AVAILABLE_ON]-(t:Title)
    RETURN t {.*} AS title
    ORDER BY t.name
    LIMIT $limit
  `;

  const result = await connection.executeQuery(cypher, { serviceId, limit });
  return result.map(record => serializeNeo4jValue(record.get('title')));
}
