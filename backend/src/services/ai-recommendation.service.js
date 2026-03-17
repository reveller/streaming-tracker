/**
 * AI Recommendation Service
 *
 * Integration with Anthropic Claude API for personalized recommendations.
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
 * Generate personalized recommendations based on user ratings.
 *
 * @param {string} userId - User ID
 * @param {Object} [options={}] - Options
 * @param {number} [options.count=5] - Number of recommendations
 * @param {string} [options.genre] - Filter by genre (optional)
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

  // Prepare prompt
  const prompt = buildRecommendationPrompt(ratings, stats, count, genre, allExclusions, guidance);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0].text;
    const recommendations = parseRecommendations(content);

    // Enrich recommendations with TMDB data (posters, IDs)
    const enriched = await enrichWithTmdb(recommendations);

    return {
      recommendations: enriched,
      basedOnRatings: ratings.length,
      averageRating: stats.averageRating
    };
  } catch (error) {
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
 * Build recommendation prompt for Claude.
 *
 * @param {Array} ratings - User's ratings
 * @param {Object} stats - Rating statistics
 * @param {number} count - Number of recommendations
 * @param {string|null} genre - Optional genre filter
 * @param {Array<string>} existingTitles - Titles already in user's lists
 * @param {string|null} guidance - Optional user guidance for recommendations
 * @returns {string} Formatted prompt
 */
function buildRecommendationPrompt(ratings, stats, count, genre, existingTitles = [], guidance = null) {
  // Sort ratings by stars (highest first)
  const sortedRatings = [...ratings].sort((a, b) => b.stars - a.stars);

  // Get top rated titles
  const topRated = sortedRatings.filter(r => r.stars >= 4).slice(0, 10);
  const lowRated = sortedRatings.filter(r => r.stars <= 2).slice(0, 5);

  const prompt = `You are a movie and TV series recommendation expert. Based on the user's viewing history and ratings, suggest ${count} titles they would enjoy.

## User's Viewing Statistics
- Total titles rated: ${stats.totalRated}
- Average rating: ${stats.averageRating?.toFixed(1) || 'N/A'} stars
- 5-star ratings: ${stats.fiveStars}
- 4-star ratings: ${stats.fourStars}
- 3-star ratings: ${stats.threeStars}
- 2-star ratings: ${stats.twoStars}
- 1-star ratings: ${stats.oneStar}

## Titles They Loved (4-5 stars)
${topRated.map(r => `- "${r.title.name}" (${r.title.type}): ${r.stars} stars${r.review ? ` - "${r.review}"` : ''}`).join('\n')}

${lowRated.length > 0 ? `## Titles They Disliked (1-2 stars)
${lowRated.map(r => `- "${r.title.name}" (${r.title.type}): ${r.stars} stars${r.review ? ` - "${r.review}"` : ''}`).join('\n')}
` : ''}

${genre ? `\n## Genre Focus\nPlease focus recommendations on the "${genre}" genre.\n` : ''}
${guidance ? `\n## User's Guidance\nThe user has provided the following additional guidance for recommendations:\n"${guidance}"\nPlease factor this guidance into your recommendations.\n` : ''}
## EXCLUDED TITLES — DO NOT RECOMMEND ANY OF THESE
The following titles are already in the user's lists or have been previously dismissed. You MUST NOT recommend any of them, even with slightly different spelling or formatting:
${existingTitles.map(t => `- "${t}"`).join('\n')}

## Your Task
Provide exactly ${count} personalized recommendations. Every recommendation must be a title NOT in the excluded list above.

Return ONLY a valid JSON array with no markdown formatting, code fences, or extra text:
[
  {
    "title": "Title Name",
    "type": "MOVIE or TV_SERIES",
    "year": 2020,
    "reason": "Brief explanation of why this recommendation fits (1-2 sentences)",
    "streamingService": "Netflix, Hulu, etc. or null if unknown"
  }
]

Important guidelines:
- Double-check each recommendation against the excluded list before including it
- Focus on titles similar to their highly-rated favorites
- Consider the user's rating patterns and preferences
- Provide diverse recommendations across different sub-genres if appropriate
- Each reason should be personalized based on their specific taste
- The "year" field must be a number, not a string
- Do NOT include self-corrections, second thoughts, or replacement text in the JSON. Think through your choices before writing the JSON. Every entry must be your final pick — never write "replacing with..." or "skipping..." in the reason field
- The "reason" field should only explain why the user would enjoy the title

Return ONLY the JSON array. No markdown, no code fences, no commentary.`;

  return prompt;
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
 * Parse recommendations from Claude's response.
 *
 * @param {string} content - Claude's response
 * @returns {Array} Parsed recommendations
 */
function parseRecommendations(content) {
  try {
    // Reason: Strip markdown code fences if Claude wraps the response in ```json ... ```
    let cleaned = content.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();

    // Reason: Try parsing the whole cleaned string first (ideal case),
    // then fall back to regex extraction if there's extra text around the JSON
    let recommendations;
    try {
      recommendations = JSON.parse(cleaned);
    } catch {
      const jsonMatch = cleaned.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      recommendations = JSON.parse(jsonMatch[0]);
    }

    // Validate structure
    if (!Array.isArray(recommendations)) {
      throw new Error('Response is not an array');
    }

    return recommendations.map(rec => ({
      title: rec.title || 'Unknown',
      type: rec.type || 'MOVIE',
      year: rec.year || null,
      reason: rec.reason || 'Recommended based on your preferences',
      streamingService: rec.streamingService || null
    }));
  } catch (error) {
    console.error('Failed to parse recommendations:', error);
    throw new AIError('Failed to parse AI recommendations');
  }
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
