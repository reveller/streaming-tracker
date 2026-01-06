/**
 * Title Service
 *
 * Business logic for title operations and list movement.
 */

import * as titleQueries from '../database/queries/title.queries.js';
import * as listQueries from '../database/queries/list.queries.js';
import { ValidationError, NotFoundError } from './list.service.js';

/**
 * List types enumeration.
 */
export const ListType = {
  WATCH_QUEUE: 'WATCH_QUEUE',
  CURRENTLY_WATCHING: 'CURRENTLY_WATCHING',
  ALREADY_WATCHED: 'ALREADY_WATCHED'
};

/**
 * Create a new title.
 *
 * @param {Object} titleData - Title data
 * @returns {Promise<Object>} Created title
 * @throws {ValidationError} If validation fails
 */
export async function createTitle(titleData) {
  // Validate title type
  if (!['MOVIE', 'TV_SERIES'].includes(titleData.type)) {
    throw new ValidationError('Title type must be MOVIE or TV_SERIES');
  }

  // Check if TMDB title already exists
  if (titleData.tmdbId) {
    const existing = await titleQueries.findTitleByTmdbId(titleData.tmdbId);
    if (existing) {
      return existing;
    }
  }

  return await titleQueries.createTitle(titleData);
}

/**
 * Get title by ID.
 *
 * @param {string} titleId - Title ID
 * @returns {Promise<Object>} Title
 * @throws {NotFoundError} If title not found
 */
export async function getTitleById(titleId) {
  const title = await titleQueries.getTitleById(titleId);

  if (!title) {
    throw new NotFoundError('Title not found');
  }

  return title;
}

/**
 * Add title to a list group.
 *
 * @param {string} titleId - Title ID
 * @param {string} listGroupId - List group ID
 * @param {string} userId - User ID
 * @param {string} listType - List type
 * @returns {Promise<Object>} Relationship properties
 * @throws {ValidationError} If validation fails
 * @throws {NotFoundError} If resources not found
 */
export async function addTitleToList(titleId, listGroupId, userId, listType) {
  // Validate list type
  if (!Object.values(ListType).includes(listType)) {
    throw new ValidationError('Invalid list type');
  }

  // Verify title exists
  const title = await titleQueries.getTitleById(titleId);
  if (!title) {
    throw new NotFoundError('Title not found');
  }

  // Verify list group exists and belongs to user
  const listGroupExists = await listQueries.listGroupExists(listGroupId, userId);
  if (!listGroupExists) {
    throw new NotFoundError('List group not found');
  }

  // Check if title already in this list group
  const alreadyInList = await titleQueries.titleExistsInList(titleId, listGroupId);
  if (alreadyInList) {
    throw new ValidationError('Title already exists in this list group');
  }

  // Get next position for this list type
  const maxPosition = await titleQueries.getMaxPosition(listGroupId, listType);
  const newPosition = maxPosition + 1;

  // Add title to list
  const relationship = await titleQueries.addTitleToList(
    titleId,
    listGroupId,
    listType,
    newPosition
  );

  // Update list group timestamp
  await listQueries.touchListGroup(listGroupId);

  return relationship;
}

/**
 * Move title to a different list within same list group.
 *
 * @param {string} titleId - Title ID
 * @param {string} listGroupId - List group ID
 * @param {string} userId - User ID
 * @param {string} newListType - New list type
 * @param {number} [newPosition] - New position (optional, will append if not provided)
 * @returns {Promise<boolean>} True if moved
 * @throws {ValidationError} If validation fails
 * @throws {NotFoundError} If resources not found
 */
export async function moveTitleToList(titleId, listGroupId, userId, newListType, newPosition) {
  // Validate list type
  if (!Object.values(ListType).includes(newListType)) {
    throw new ValidationError('Invalid list type');
  }

  // Verify list group belongs to user
  const listGroupExists = await listQueries.listGroupExists(listGroupId, userId);
  if (!listGroupExists) {
    throw new NotFoundError('List group not found');
  }

  // Verify title is in this list group
  const titleInList = await titleQueries.titleExistsInList(titleId, listGroupId);
  if (!titleInList) {
    throw new NotFoundError('Title not in this list group');
  }

  // If position not provided, append to end of new list
  if (newPosition === undefined || newPosition === null) {
    const maxPosition = await titleQueries.getMaxPosition(listGroupId, newListType);
    newPosition = maxPosition + 1;
  }

  // Move title
  const moved = await titleQueries.moveTitleToList(
    titleId,
    listGroupId,
    newListType,
    newPosition
  );

  // Update list group timestamp
  await listQueries.touchListGroup(listGroupId);

  return moved;
}

/**
 * Update title position within the same list.
 *
 * @param {string} titleId - Title ID
 * @param {string} listGroupId - List group ID
 * @param {string} userId - User ID
 * @param {number} newPosition - New position
 * @returns {Promise<boolean>} True if updated
 * @throws {ValidationError} If validation fails
 * @throws {NotFoundError} If resources not found
 */
export async function updateTitlePosition(titleId, listGroupId, userId, newPosition) {
  // Validate position
  if (typeof newPosition !== 'number' || newPosition < 0) {
    throw new ValidationError('Position must be a non-negative number');
  }

  // Verify list group belongs to user
  const listGroupExists = await listQueries.listGroupExists(listGroupId, userId);
  if (!listGroupExists) {
    throw new NotFoundError('List group not found');
  }

  // Verify title is in this list group
  const titleInList = await titleQueries.titleExistsInList(titleId, listGroupId);
  if (!titleInList) {
    throw new NotFoundError('Title not in this list group');
  }

  // Update position
  const updated = await titleQueries.updateTitlePosition(titleId, listGroupId, newPosition);

  // Update list group timestamp
  await listQueries.touchListGroup(listGroupId);

  return updated;
}

/**
 * Remove title from a list group.
 *
 * @param {string} titleId - Title ID
 * @param {string} listGroupId - List group ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if removed
 * @throws {NotFoundError} If resources not found
 */
export async function removeTitleFromList(titleId, listGroupId, userId) {
  // Verify list group belongs to user
  const listGroupExists = await listQueries.listGroupExists(listGroupId, userId);
  if (!listGroupExists) {
    throw new NotFoundError('List group not found');
  }

  // Verify title is in this list group
  const titleInList = await titleQueries.titleExistsInList(titleId, listGroupId);
  if (!titleInList) {
    throw new NotFoundError('Title not in this list group');
  }

  // Remove title
  const removed = await titleQueries.removeTitleFromList(titleId, listGroupId);

  // Update list group timestamp
  await listQueries.touchListGroup(listGroupId);

  return removed;
}

/**
 * Link title to streaming service.
 *
 * @param {string} titleId - Title ID
 * @param {string} serviceId - Service ID
 * @returns {Promise<boolean>} True if linked
 * @throws {NotFoundError} If title not found
 */
export async function linkTitleToService(titleId, serviceId) {
  const title = await titleQueries.getTitleById(titleId);
  if (!title) {
    throw new NotFoundError('Title not found');
  }

  return await titleQueries.linkTitleToService(titleId, serviceId);
}

/**
 * Unlink title from streaming service.
 *
 * @param {string} titleId - Title ID
 * @param {string} serviceId - Service ID
 * @returns {Promise<boolean>} True if unlinked
 */
export async function unlinkTitleFromService(titleId, serviceId) {
  return await titleQueries.unlinkTitleFromService(titleId, serviceId);
}

/**
 * Search titles by name.
 *
 * @param {string} searchTerm - Search term
 * @param {number} [limit=20] - Max results
 * @returns {Promise<Array>} Matching titles
 */
export async function searchTitles(searchTerm, limit = 20) {
  if (!searchTerm || searchTerm.trim().length === 0) {
    throw new ValidationError('Search term is required');
  }

  return await titleQueries.searchTitles(searchTerm, limit);
}

/**
 * Get all titles for a user.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array>} All user's titles
 */
export async function getTitlesByUser(userId) {
  return await titleQueries.getTitlesByUser(userId);
}

/**
 * Update title metadata.
 *
 * @param {string} titleId - Title ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated title
 * @throws {NotFoundError} If title not found
 */
export async function updateTitle(titleId, updates) {
  const title = await titleQueries.getTitleById(titleId);
  if (!title) {
    throw new NotFoundError('Title not found');
  }

  return await titleQueries.updateTitle(titleId, updates);
}

/**
 * Delete a title completely.
 *
 * @param {string} titleId - Title ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteTitle(titleId) {
  return await titleQueries.deleteTitle(titleId);
}
