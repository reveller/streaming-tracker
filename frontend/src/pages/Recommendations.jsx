import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getRecommendations } from '../api/recommendations.js';

/**
 * Recommendations Page
 *
 * Displays AI-powered personalized recommendations based on user ratings.
 *
 * @returns {JSX.Element}
 */
function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [reasoning, setReasoning] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [count, setCount] = useState(5);
  const [genre, setGenre] = useState('');

  /**
   * Fetch recommendations from API.
   */
  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');

    try {
      const options = { count };
      if (genre) {
        options.genre = genre;
      }

      const response = await getRecommendations(options);
      const data = response.data;

      setRecommendations(data.recommendations);
      setReasoning(data.reasoning);
      setStats({
        basedOnRatings: data.basedOnRatings,
        averageRating: data.averageRating
      });
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      const errorMessage =
        err.response?.data?.error?.message ||
        'Failed to fetch recommendations. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Streaming Tracker
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
              <Link to="/settings" className="text-gray-700 hover:text-blue-600">
                Settings
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            AI Recommendations
          </h2>
          <p className="text-gray-600 mt-1">
            Get personalized recommendations based on your ratings
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Get Recommendations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="count"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Number of recommendations
              </label>
              <input
                id="count"
                type="number"
                min="1"
                max="10"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="genre"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Genre (optional)
              </label>
              <input
                id="genre"
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g., Action, Drama"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Getting recommendations...' : 'Get Recommendations'}
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {stats && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
            <p className="text-sm">
              Based on {stats.basedOnRatings} ratings with an average of{' '}
              {stats.averageRating.toFixed(1)} stars
            </p>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Recommended for You
              </h3>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">
                          {rec.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {rec.type} • {rec.year}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 mt-3">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {reasoning && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Why These Recommendations?
                </h3>
                <p className="text-gray-700 whitespace-pre-line">{reasoning}</p>
              </div>
            )}
          </div>
        )}

        {!loading && recommendations.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">
              Click &quot;Get Recommendations&quot; to discover new titles based on your
              ratings!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Recommendations;
