/**
 * List Service
 *
 * Business logic for list group operations.
 */

import * as listQueries from '../database/queries/list.queries.js';
import * as genreQueries from '../database/queries/genre.queries.js';

/**
 * Custom error for validation failures.
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

/**
 * Custom error for not found resources.
 */
export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

/**
 * Create a new list group.
 *
 * @param {string} userId - User ID
 * @param {string} genreId - Genre ID
 * @returns {Promise<Object>} Created list group
 * @throws {ValidationError} If genre doesn't exist
 */
export async function createListGroup(userId, genreId) {
  // Verify genre exists
  const genre = await genreQueries.getGenreById(genreId);
  if (!genre) {
    throw new ValidationError('Genre not found');
  }

  const listGroup = await listQueries.createListGroup(userId, genreId);
  return listGroup;
}

/**
 * Get all list groups for a user.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of list groups
 */
export async function getListGroupsByUser(userId) {
  return await listQueries.getListGroupsByUser(userId);
}

/**
 * Get a specific list group with all its titles.
 *
 * @param {string} listGroupId - List group ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} List group with titles
 * @throws {NotFoundError} If list group not found or unauthorized
 */
export async function getListGroupWithTitles(listGroupId, userId) {
  const listGroup = await listQueries.getListGroupById(listGroupId, userId);

  if (!listGroup) {
    throw new NotFoundError('List group not found');
  }

  const titles = await listQueries.getTitlesByListGroup(listGroupId, userId);
  const stats = await listQueries.getListGroupStats(listGroupId, userId);

  return {
    ...listGroup,
    titles,
    stats
  };
}

/**
 * Delete a list group.
 *
 * @param {string} listGroupId - List group ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if deleted
 * @throws {NotFoundError} If list group not found
 */
export async function deleteListGroup(listGroupId, userId) {
  const exists = await listQueries.listGroupExists(listGroupId, userId);

  if (!exists) {
    throw new NotFoundError('List group not found');
  }

  return await listQueries.deleteListGroup(listGroupId, userId);
}

/**
 * Get statistics for a list group.
 *
 * @param {string} listGroupId - List group ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Statistics
 * @throws {NotFoundError} If list group not found
 */
export async function getListGroupStats(listGroupId, userId) {
  const exists = await listQueries.listGroupExists(listGroupId, userId);

  if (!exists) {
    throw new NotFoundError('List group not found');
  }

  return await listQueries.getListGroupStats(listGroupId, userId);
}
