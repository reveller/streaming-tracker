/**
 * AI Recommendation Service
 *
 * Integration with Anthropic Claude API for personalized recommendations.
 * Uses tool_use for structured output to ensure clean JSON responses.
 */

import Anthropic from '@anthropic-ai/sdk';
import * as ratingQueries from '../database/queries/rating.queries.js';
import * as titleQueries from '../database/queries/title.queries.js';
import * as dismissedRecQueries from '../database/queries/dismissed-rec.queries.js';
import * as tmdbService from './tmdb.service.js';

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
}) : null;

/**
 * Custom error for AI service failures.
 */
export class AIError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AIError';
    this.statusCode = 503;
  }
}

/**
 * Tool schema that forces Claude to return structured recommendation data.
 */
const recommendationTool = {
  name: 'submit_recommendations',
  description: 'Submit the list of personalized movie/TV recommendations.',
  input_schema: {
    type: 'object',
    properties: {
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The exact title of the movie or TV series'
            },
            type: {
              type: 'string',
              enum: ['MOVIE', 'TV_SERIES'],
              description: 'Whether this is a movie or TV series'
            },
            year: {
              type: 'integer',
              description: 'The release year'
            },
            reason: {
              type: 'string',
              minLength: 20,
              description: 'A specific 1-2 sentence explanation referencing the user\'s rated titles to explain why they would enjoy this recommendation. Must be a complete, personalized sentence — never use placeholder text.'
            },
            streamingService: {
              type: 'string',
              description: 'The primary streaming service this title is available on, if known'
            }
          },
          required: ['title', 'type', 'year', 'reason']
        }
      }
    },
    required: ['recommendations']
  }
};

/**
 * Generate personalized recommendations based on user ratings.
 *
 * @param {string} userId - User ID
 * @param {Object} [options={}] - Options
 * @param {number} [options.count=5] - Number of recommendations
 * @param {string} [options.genre] - Filter by genre (optional)
 * @param {string} [options.guidance] - User guidance text (optional)
 * @returns {Promise<Object>} Recommendations object
 * @throws {AIError} If AI call fails
 */
export async function getRecommendations(userId, options = {}) {
  if (!anthropic) {
    throw new AIError('Anthropic API key not configured');
  }

  const { count = 5, genre = null, guidance = null } = options;

  // Get user's ratings, all titles in their lists, and dismissed recommendations
  const [ratings, allUserTitles, dismissedRecs] = await Promise.all([
    ratingQueries.getRatingsByUser(userId),
    titleQueries.getTitlesByUser(userId),
    dismissedRecQueries.getDismissedRecs(userId)
  ]);

  if (ratings.length === 0) {
    throw new AIError('No ratings found. Please rate some titles first to get recommendations.');
  }

  // Get rating statistics
  const stats = await ratingQueries.getUserRatingStats(userId);

  // Reason: Build exclusion list from ALL titles in user's lists plus dismissed recommendations
  const existingTitleNames = allUserTitles.map(t => t.name);
  const allExclusions = [...new Set([...existingTitleNames, ...dismissedRecs])];

  // Reason: Build a set of existing TMDB IDs for hard filtering after enrichment
  const existingTmdbIds = new Set(
    allUserTitles.map(t => t.tmdbId).filter(Boolean)
  );

  // Reason: Request extra titles to account for filtered ones (hallucinated, duplicates)
  const requestCount = Math.min(count + 5, 15);

  const { systemPrompt, userMessage } = buildPromptParts(
    ratings, stats, requestCount, genre, allExclusions, guidance
  );

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      tools: [recommendationTool],
      tool_choice: { type: 'tool', name: 'submit_recommendations' },
      messages: [{ role: 'user', content: userMessage }]
    });

    // Reason: tool_choice forces a tool_use response — extract the structured input directly
    const toolBlock = message.content.find(block => block.type === 'tool_use');
    if (!toolBlock || !toolBlock.input?.recommendations) {
      throw new AIError('No recommendations returned from AI');
    }

    const recommendations = toolBlock.input.recommendations.map(rec => ({
      title: rec.title || 'Unknown',
      type: rec.type || 'MOVIE',
      year: rec.year || null,
      reason: rec.reason || 'Recommended based on your preferences',
      streamingService: rec.streamingService || null
    }));

    // Enrich recommendations with TMDB data (posters, IDs)
    const enriched = await enrichWithTmdb(recommendations);

    // Reason: Filter out hallucinated titles, duplicates, and placeholder/lazy responses
    const verified = enriched
      .filter(rec =>
        rec.tmdbId &&
        !existingTmdbIds.has(rec.tmdbId) &&
        rec.reason.length >= 20
      )
      .slice(0, count);

    return {
      recommendations: verified,
      basedOnRatings: ratings.length,
      averageRating: stats.averageRating
    };
  } catch (error) {
    if (error instanceof AIError) throw error;
    console.error('Claude API error:', error);
    throw new AIError(`AI recommendation failed: ${error.message}`);
  }
}

/**
 * Get recommendations for a specific genre.
 *
 * @param {string} userId - User ID
 * @param {string} genreName - Genre name
 * @param {number} [count=5] - Number of recommendations
 * @returns {Promise<Object>} Recommendations object
 */
export async function getRecommendationsByGenre(userId, genreName, count = 5) {
  return getRecommendations(userId, { count, genre: genreName });
}

/**
 * Build system prompt and user message for the Claude API call.
 *
 * @param {Array} ratings - User's ratings
 * @param {Object} stats - Rating statistics
 * @param {number} count - Number of recommendations
 * @param {string|null} genre - Optional genre filter
 * @param {Array<string>} existingTitles - Titles already in user's lists
 * @param {string|null} guidance - Optional user guidance for recommendations
 * @returns {Object} { systemPrompt, userMessage }
 */
function buildPromptParts(ratings, stats, count, genre, existingTitles = [], guidance = null) {
  const systemPrompt = `You are a movie and TV series recommendation expert. You recommend only real, verified titles that exist and can be found on major databases like TMDB or IMDb. Never invent or fabricate titles.

When you call the submit_recommendations tool, every entry must be:
- A real title that actually exists
- NOT in the user's excluded list
- Your final considered pick — no placeholders or second-guessing

Only recommend titles you are confident are real.`;

  const sortedRatings = [...ratings].sort((a, b) => b.stars - a.stars);
  const topRated = sortedRatings.filter(r => r.stars >= 4).slice(0, 10);
  const lowRated = sortedRatings.filter(r => r.stars <= 2).slice(0, 5);

  let userMessage = `Based on my viewing history, recommend ${count} titles I would enjoy.

## My Viewing Statistics
- Total titles rated: ${stats.totalRated}
- Average rating: ${stats.averageRating?.toFixed(1) || 'N/A'} stars

## Titles I Loved (4-5 stars)
${topRated.map(r => `- "${r.title.name}" (${r.title.type}): ${r.stars} stars${r.review ? ` - "${r.review}"` : ''}`).join('\n')}
`;

  if (lowRated.length > 0) {
    userMessage += `
## Titles I Disliked (1-2 stars)
${lowRated.map(r => `- "${r.title.name}" (${r.title.type}): ${r.stars} stars${r.review ? ` - "${r.review}"` : ''}`).join('\n')}
`;
  }

  if (genre) {
    userMessage += `\n## Genre Focus\nPlease focus on the "${genre}" genre.\n`;
  }

  if (guidance) {
    userMessage += `\n## My Guidance\n${guidance}\n`;
  }

  userMessage += `
## EXCLUDED TITLES — DO NOT RECOMMEND
${existingTitles.map(t => `- "${t}"`).join('\n')}

Use the submit_recommendations tool with exactly ${count} recommendations that are NOT in my excluded list.`;

  return { systemPrompt, userMessage };
}

/**
 * Enrich AI recommendations with TMDB data (poster, tmdbId, etc).
 *
 * @param {Array} recommendations - Parsed AI recommendations
 * @returns {Promise<Array>} Enriched recommendations
 */
async function enrichWithTmdb(recommendations) {
  const enriched = await Promise.all(
    recommendations.map(async (rec) => {
      try {
        const searchResult = await tmdbService.searchMulti(rec.title);
        const results = searchResult.results || [];

        if (results.length === 0) return rec;

        // Reason: Best match by title + year, then title only, then first result
        const match = results.find(r =>
          r.name.toLowerCase() === rec.title.toLowerCase() &&
          r.releaseYear === String(rec.year)
        ) || results.find(r =>
          r.name.toLowerCase() === rec.title.toLowerCase()
        ) || results[0];

        return {
          ...rec,
          tmdbId: match.tmdbId,
          posterUrl: match.posterUrl,
          releaseYear: match.releaseYear,
          overview: match.overview,
          tmdbType: match.type
        };
      } catch (err) {
        console.error(`TMDB lookup failed for "${rec.title}":`, err.message);
        return rec;
      }
    })
  );

  return enriched;
}

/**
 * Get explanation for why a specific title is recommended.
 *
 * @param {string} userId - User ID
 * @param {string} titleName - Title name
 * @returns {Promise<string>} Explanation
 * @throws {AIError} If AI call fails
 */
export async function explainRecommendation(userId, titleName) {
  if (!anthropic) {
    throw new AIError('Anthropic API key not configured');
  }

  // Get user's top rated titles
  const topRated = await ratingQueries.getTopRatedTitles(userId, 10);

  const prompt = `Based on these titles the user rated highly:
${topRated.map(t => `- "${t.name}" (${t.type}): ${t.rating.stars} stars`).join('\n')}

Explain in 2-3 sentences why "${titleName}" would be a good recommendation for them. Be specific and reference their taste based on the titles they enjoyed.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error);
    throw new AIError(`AI explanation failed: ${error.message}`);
  }
}
