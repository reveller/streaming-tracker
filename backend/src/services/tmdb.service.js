/**
 * TMDB Service
 *
 * Integration with The Movie Database (TMDB) API for title metadata.
 */

import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

/**
 * Custom error for TMDB API failures.
 */
export class TMDBError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TMDBError';
    this.statusCode = 503;
  }
}

/**
 * Search for movies on TMDB.
 *
 * @param {string} query - Search query
 * @param {number} [page=1] - Page number
 * @returns {Promise<Object>} Search results with movies
 * @throws {TMDBError} If API call fails
 */
export async function searchMovies(query, page = 1) {
  if (!TMDB_API_KEY) {
    throw new TMDBError('TMDB API key not configured');
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
        page,
        include_adult: false
      },
      timeout: 10000
    });

    return {
      results: response.data.results.map(formatMovie),
      page: response.data.page,
      totalPages: response.data.total_pages,
      totalResults: response.data.total_results
    };
  } catch (error) {
    if (error.response) {
      throw new TMDBError(`TMDB API error: ${error.response.data.status_message || error.message}`);
    }
    throw new TMDBError(`TMDB API request failed: ${error.message}`);
  }
}

/**
 * Search for TV series on TMDB.
 *
 * @param {string} query - Search query
 * @param {number} [page=1] - Page number
 * @returns {Promise<Object>} Search results with TV series
 * @throws {TMDBError} If API call fails
 */
export async function searchTVSeries(query, page = 1) {
  if (!TMDB_API_KEY) {
    throw new TMDBError('TMDB API key not configured');
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
        page,
        include_adult: false
      },
      timeout: 10000
    });

    return {
      results: response.data.results.map(formatTVSeries),
      page: response.data.page,
      totalPages: response.data.total_pages,
      totalResults: response.data.total_results
    };
  } catch (error) {
    if (error.response) {
      throw new TMDBError(`TMDB API error: ${error.response.data.status_message || error.message}`);
    }
    throw new TMDBError(`TMDB API request failed: ${error.message}`);
  }
}

/**
 * Search for both movies and TV series.
 *
 * @param {string} query - Search query
 * @param {number} [page=1] - Page number
 * @returns {Promise<Object>} Combined search results
 * @throws {TMDBError} If API call fails
 */
export async function searchMulti(query, page = 1) {
  if (!TMDB_API_KEY) {
    throw new TMDBError('TMDB API key not configured');
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
        page,
        include_adult: false
      },
      timeout: 10000
    });

    const results = response.data.results
      .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
      .map(item => {
        if (item.media_type === 'movie') {
          return formatMovie(item);
        } else {
          return formatTVSeries(item);
        }
      });

    return {
      results,
      page: response.data.page,
      totalPages: response.data.total_pages,
      totalResults: response.data.total_results
    };
  } catch (error) {
    if (error.response) {
      throw new TMDBError(`TMDB API error: ${error.response.data.status_message || error.message}`);
    }
    throw new TMDBError(`TMDB API request failed: ${error.message}`);
  }
}

/**
 * Get detailed movie information by TMDB ID.
 *
 * @param {number} tmdbId - TMDB movie ID
 * @returns {Promise<Object>} Detailed movie information
 * @throws {TMDBError} If API call fails
 */
export async function getMovieDetails(tmdbId) {
  if (!TMDB_API_KEY) {
    throw new TMDBError('TMDB API key not configured');
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY
      },
      timeout: 10000
    });

    return formatMovie(response.data);
  } catch (error) {
    if (error.response) {
      throw new TMDBError(`TMDB API error: ${error.response.data.status_message || error.message}`);
    }
    throw new TMDBError(`TMDB API request failed: ${error.message}`);
  }
}

/**
 * Get detailed TV series information by TMDB ID.
 *
 * @param {number} tmdbId - TMDB TV series ID
 * @returns {Promise<Object>} Detailed TV series information
 * @throws {TMDBError} If API call fails
 */
export async function getTVSeriesDetails(tmdbId) {
  if (!TMDB_API_KEY) {
    throw new TMDBError('TMDB API key not configured');
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY
      },
      timeout: 10000
    });

    return formatTVSeries(response.data);
  } catch (error) {
    if (error.response) {
      throw new TMDBError(`TMDB API error: ${error.response.data.status_message || error.message}`);
    }
    throw new TMDBError(`TMDB API request failed: ${error.message}`);
  }
}

/**
 * Format movie data from TMDB API response.
 *
 * @param {Object} data - TMDB movie data
 * @returns {Object} Formatted movie data
 */
function formatMovie(data) {
  return {
    tmdbId: data.id.toString(),
    type: 'MOVIE',
    name: data.title,
    releaseYear: data.release_date ? data.release_date.substring(0, 4) : null,
    posterUrl: data.poster_path ? `${TMDB_IMAGE_BASE_URL}${data.poster_path}` : null,
    overview: data.overview || null,
    voteAverage: data.vote_average || null,
    voteCount: data.vote_count || null
  };
}

/**
 * Format TV series data from TMDB API response.
 *
 * @param {Object} data - TMDB TV series data
 * @returns {Object} Formatted TV series data
 */
function formatTVSeries(data) {
  return {
    tmdbId: data.id.toString(),
    type: 'TV_SERIES',
    name: data.name,
    releaseYear: data.first_air_date ? data.first_air_date.substring(0, 4) : null,
    posterUrl: data.poster_path ? `${TMDB_IMAGE_BASE_URL}${data.poster_path}` : null,
    overview: data.overview || null,
    voteAverage: data.vote_average || null,
    voteCount: data.vote_count || null
  };
}
