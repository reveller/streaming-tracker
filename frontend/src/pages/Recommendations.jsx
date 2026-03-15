import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getRecommendations } from '../api/recommendations.js';
import { getListGroups } from '../api/lists.js';
import { searchMulti } from '../api/tmdb.js';
import { createTitle, addTitleToList } from '../api/titles.js';

/**
 * Recommendations Page
 *
 * Displays AI-powered personalized recommendations based on user ratings.
 * Allows adding recommendations directly to watch lists.
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
  const [listGroups, setListGroups] = useState([]);
  const [selectedListGroup, setSelectedListGroup] = useState('');
  const [adding, setAdding] = useState(null);
  const [notification, setNotification] = useState(null);
  // Reason: Track which recommendations have been added so we can show visual feedback
  const [addedRecs, setAddedRecs] = useState({});

  /**
   * Load user's list groups for the dropdown.
   */
  const loadListGroups = useCallback(async () => {
    try {
      const response = await getListGroups();
      // Reason: axios returns response.data = { success, data: { listGroups } }
      const groups = response.data?.listGroups || response.listGroups || [];
      setListGroups(groups);
      if (groups.length > 0) {
        setSelectedListGroup(groups[0].id);
      }
    } catch (err) {
      console.error('Failed to load list groups:', err);
    }
  }, []);

  useEffect(() => {
    loadListGroups();
  }, [loadListGroups]);

  /**
   * Fetch recommendations from API.
   */
  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    setAddedRecs({});

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

  /**
   * Add a recommendation to a list by searching TMDB first.
   *
   * @param {Object} rec - Recommendation object from AI
   * @param {string} listType - List type (WATCH_QUEUE, CURRENTLY_WATCHING, ALREADY_WATCHED)
   * @param {number} index - Index of the recommendation
   */
  const handleAddToList = async (rec, listType, index) => {
    if (!selectedListGroup) {
      setError('Please select a list group first');
      return;
    }

    setAdding(`${index}-${listType}`);
    setError('');

    try {
      // Search TMDB for this title
      const searchResponse = await searchMulti(rec.title);
      const results = searchResponse.data?.results || [];

      if (results.length === 0) {
        setError(`Could not find "${rec.title}" on TMDB`);
        setAdding(null);
        return;
      }

      // Reason: Pick the best match — prefer exact title + year match, fall back to first result
      const match = results.find(r =>
        r.name.toLowerCase() === rec.title.toLowerCase() &&
        r.releaseYear === String(rec.year)
      ) || results.find(r =>
        r.name.toLowerCase() === rec.title.toLowerCase()
      ) || results[0];

      // Create the title in our database
      const titleData = {
        type: match.type,
        name: match.name,
        tmdbId: match.tmdbId,
        releaseYear: match.releaseYear,
        posterUrl: match.posterUrl,
        overview: match.overview
      };

      const createResponse = await createTitle(titleData);
      const titleId = createResponse.data.title.id;

      // Add to the selected list
      await addTitleToList(titleId, selectedListGroup, listType);

      const listNames = {
        'WATCH_QUEUE': 'Watch Queue',
        'CURRENTLY_WATCHING': 'Currently Watching',
        'ALREADY_WATCHED': 'Already Watched'
      };

      setAddedRecs(prev => ({ ...prev, [index]: listNames[listType] }));
      setNotification(`"${rec.title}" added to ${listNames[listType]}`);
      setTimeout(() => setNotification(null), 2000);
    } catch (err) {
      console.error('Failed to add recommendation:', err);
      setError(err.response?.data?.error?.message || `Failed to add "${rec.title}"`);
    } finally {
      setAdding(null);
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

      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-pulse">
          {notification}
        </div>
      )}

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

          {listGroups.length > 0 && (
            <div className="mb-4">
              <label
                htmlFor="listGroup"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Add to list
              </label>
              <select
                id="listGroup"
                value={selectedListGroup}
                onChange={(e) => setSelectedListGroup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {listGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.genre?.name || group.name || 'Unnamed List'}
                  </option>
                ))}
              </select>
            </div>
          )}

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
                    className={`border rounded-lg p-4 ${
                      addedRecs[index]
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200'
                    }`}
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

                    {addedRecs[index] ? (
                      <div className="mt-3 text-sm text-green-700 font-medium">
                        Added to {addedRecs[index]}
                      </div>
                    ) : (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleAddToList(rec, 'WATCH_QUEUE', index)}
                          disabled={adding !== null}
                          className="px-2 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
                        >
                          {adding === `${index}-WATCH_QUEUE` ? '...' : 'Queue'}
                        </button>
                        <button
                          onClick={() => handleAddToList(rec, 'CURRENTLY_WATCHING', index)}
                          disabled={adding !== null}
                          className="px-2 py-2 text-xs sm:text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium"
                        >
                          {adding === `${index}-CURRENTLY_WATCHING` ? '...' : 'Watch'}
                        </button>
                        <button
                          onClick={() => handleAddToList(rec, 'ALREADY_WATCHED', index)}
                          disabled={adding !== null}
                          className="px-2 py-2 text-xs sm:text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 font-medium"
                        >
                          {adding === `${index}-ALREADY_WATCHED` ? '...' : 'Done'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {reasoning && !reasoning.startsWith('[') && !reasoning.startsWith('```') && (
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
