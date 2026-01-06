/**
 * API Index
 *
 * Central export for all API modules.
 */

export * as authAPI from './auth.js';
export * as listsAPI from './lists.js';
export * as titlesAPI from './titles.js';
export * as ratingsAPI from './ratings.js';
export * as genresAPI from './genres.js';
export * as servicesAPI from './services.js';
export * as recommendationsAPI from './recommendations.js';
export * as tmdbAPI from './tmdb.js';

export { default as apiClient } from './client.js';
