/**
 * Rating Service
 *
 * Business logic for rating operations and analytics.
 */

import * as ratingQueries from '../database/queries/rating.queries.js';
import * as titleQueries from '../database/queries/title.queries.js';
import { ValidationError, NotFoundError } from './list.service.js';

/**
 * Create or update a rating for a title.
 *
 * @param {string} titleId - Title ID
 * @param {number} stars - Rating (1-5)
 * @param {string} [review] - Optional review text
 * @returns {Promise<Object>} Created/updated rating
 * @throws {ValidationError} If validation fails
 * @throws {NotFoundError} If title not found
 */
export async function upsertRating(titleId, stars, review = null) {
  // Validate stars
  if (typeof stars !== 'number' || stars < 1 || stars > 5 || !Number.isInteger(stars)) {
    throw new ValidationError('Stars must be an integer between 1 and 5');
  }

  // Verify title exists
  const title = await titleQueries.getTitleById(titleId);
  if (!title) {
    throw new NotFoundError('Title not found');
  }

  return await ratingQueries.upsertRating(titleId, stars, review);
}

/**
 * Get rating for a title.
 *
 * @param {string} titleId - Title ID
 * @returns {Promise<Object|null>} Rating or null
 */
export async function getRatingByTitle(titleId) {
  return await ratingQueries.getRatingByTitle(titleId);
}

/**
 * Delete a rating.
 *
 * @param {string} titleId - Title ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteRating(titleId) {
  return await ratingQueries.deleteRating(titleId);
}

/**
 * Get all ratings for a user.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of ratings with title info
 */
export async function getRatingsByUser(userId) {
  return await ratingQueries.getRatingsByUser(userId);
}

/**
 * Get rating statistics for a user.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Rating statistics
 */
export async function getUserRatingStats(userId) {
  return await ratingQueries.getUserRatingStats(userId);
}

/**
 * Get top rated titles for a user.
 *
 * @param {string} userId - User ID
 * @param {number} [limit=10] - Max results
 * @returns {Promise<Array>} Top rated titles
 */
export async function getTopRatedTitles(userId, limit = 10) {
  return await ratingQueries.getTopRatedTitles(userId, limit);
}

/**
 * Get recently rated titles for a user.
 *
 * @param {string} userId - User ID
 * @param {number} [limit=10] - Max results
 * @returns {Promise<Array>} Recently rated titles
 */
export async function getRecentlyRatedTitles(userId, limit = 10) {
  return await ratingQueries.getRecentlyRatedTitles(userId, limit);
}

/**
 * Get titles with specific rating.
 *
 * @param {string} userId - User ID
 * @param {number} stars - Star rating to filter by
 * @returns {Promise<Array>} Titles with that rating
 * @throws {ValidationError} If validation fails
 */
export async function getTitlesByRating(userId, stars) {
  // Validate stars
  if (typeof stars !== 'number' || stars < 1 || stars > 5 || !Number.isInteger(stars)) {
    throw new ValidationError('Stars must be an integer between 1 and 5');
  }

  return await ratingQueries.getTitlesByRating(userId, stars);
}
