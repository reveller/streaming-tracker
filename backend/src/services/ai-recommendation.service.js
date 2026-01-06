/**
 * AI Recommendation Service
 *
 * Integration with Anthropic Claude API for personalized recommendations.
 */

import Anthropic from '@anthropic-ai/sdk';
import * as ratingQueries from '../database/queries/rating.queries.js';

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

  const { count = 5, genre = null } = options;

  // Get user's ratings
  const ratings = await ratingQueries.getRatingsByUser(userId);

  if (ratings.length === 0) {
    throw new AIError('No ratings found. Please rate some titles first to get recommendations.');
  }

  // Get rating statistics
  const stats = await ratingQueries.getUserRatingStats(userId);

  // Prepare prompt
  const prompt = buildRecommendationPrompt(ratings, stats, count, genre);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0].text;
    const recommendations = parseRecommendations(content);

    return {
      recommendations,
      reasoning: content,
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
 * @returns {string} Formatted prompt
 */
function buildRecommendationPrompt(ratings, stats, count, genre) {
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

## Your Task
Provide ${count} personalized recommendations in the following JSON format:
[
  {
    "title": "Title Name",
    "type": "MOVIE or TV_SERIES",
    "year": "Release year (if known)",
    "reason": "Brief explanation of why this recommendation fits (1-2 sentences)"
  }
]

Important guidelines:
- DO NOT recommend titles they have already rated
- Focus on titles similar to their highly-rated favorites
- Consider the user's rating patterns and preferences
- Provide diverse recommendations across different sub-genres if appropriate
- Each reason should be personalized based on their specific taste

Return ONLY the JSON array, no additional text.`;

  return prompt;
}

/**
 * Parse recommendations from Claude's response.
 *
 * @param {string} content - Claude's response
 * @returns {Array} Parsed recommendations
 */
function parseRecommendations(content) {
  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const recommendations = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!Array.isArray(recommendations)) {
      throw new Error('Response is not an array');
    }

    return recommendations.map(rec => ({
      title: rec.title || 'Unknown',
      type: rec.type || 'MOVIE',
      year: rec.year || null,
      reason: rec.reason || 'Recommended based on your preferences'
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
      model: 'claude-3-5-sonnet-20241022',
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
