import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getRecommendations, dismissRecommendations } from '../api/recommendations.js';
import { searchMulti } from '../api/tmdb.js';
import { createTitle, addTitleToList, linkTitleToService } from '../api/titles.js';
import { upsertRating } from '../api/ratings.js';
import { getAllServices } from '../api/services.js';
import { getListGroupById, updateAiGuidance } from '../api/lists.js';
import StarRating from '../components/StarRating.jsx';

/**
 * Recommendations Page
 *
 * Displays AI-powered personalized recommendations based on user ratings.
 * When accessed from a list page, auto-targets that list group and genre.
 *
 * @returns {JSX.Element}
 */
function Recommendations() {
  const [searchParams] = useSearchParams();
  const listGroupId = searchParams.get('listGroupId');
  const genreFromUrl = searchParams.get('genre') || '';

  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [count, setCount] = useState(5);
  const [genre, setGenre] = useState(genreFromUrl);
  const [adding, setAdding] = useState(null);
  const [notification, setNotification] = useState(null);
  // Reason: Track which recommendations have been added so we can show visual feedback
  const [addedRecs, setAddedRecs] = useState({});
  // Reason: Track per-recommendation star ratings for the Done button
  const [recRatings, setRecRatings] = useState({});
  // Reason: Track which items are sliding out for animation
  const [slidingOut, setSlidingOut] = useState({});
  const [streamingServices, setStreamingServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState({});
  const [guidance, setGuidance] = useState('');
  const [guidanceSaved, setGuidanceSaved] = useState(true);

  /**
   * Load streaming services and saved AI guidance on mount.
   */
  useEffect(() => {
    getAllServices()
      .then(res => setStreamingServices(res.data.services || []))
      .catch(() => {});

    // Reason: Load saved AI guidance from the list group
    if (listGroupId) {
      getListGroupById(listGroupId)
        .then(res => {
          const lg = res.data.listGroup;
          if (lg.aiGuidance) {
            setGuidance(lg.aiGuidance);
          }
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Save AI guidance to the list group on blur.
   */
  const handleSaveGuidance = async () => {
    if (!listGroupId || guidanceSaved) return;
    try {
      await updateAiGuidance(listGroupId, guidance);
      setGuidanceSaved(true);
    } catch (err) {
      console.error('Failed to save guidance:', err);
    }
  };

  /**
   * Fetch recommendations from API.
   */
  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    setAddedRecs({});

    // Reason: Dismiss unadded titles from current batch so they won't reappear
    if (recommendations.length > 0) {
      const unaddedTitles = recommendations.map(rec => rec.title);
      if (unaddedTitles.length > 0) {
        try {
          await dismissRecommendations(unaddedTitles);
        } catch (err) {
          console.error('Failed to dismiss recommendations:', err);
        }
      }
    }

    // Reason: Auto-save guidance before fetching so it persists
    if (listGroupId && !guidanceSaved) {
      try {
        await updateAiGuidance(listGroupId, guidance);
        setGuidanceSaved(true);
      } catch (err) {
        console.error('Failed to save guidance:', err);
      }
    }

    try {
      const options = { count };
      if (genre) {
        options.genre = genre;
      }
      if (guidance.trim()) {
        options.guidance = guidance.trim();
      }
      if (listGroupId) {
        options.listGroupId = listGroupId;
      }

      const response = await getRecommendations(options);
      const data = response.data;

      setRecommendations(data.recommendations);

      // Reason: Auto-select streaming service dropdown if Claude suggested one
      const autoServices = {};
      data.recommendations.forEach((rec, idx) => {
        if (rec.streamingService) {
          const match = streamingServices.find(
            s => s.name.toLowerCase() === rec.streamingService.toLowerCase()
          );
          if (match) autoServices[idx] = match.id;
        }
      });
      if (Object.keys(autoServices).length > 0) {
        setSelectedServices(autoServices);
      }

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
   * Add a recommendation to the list by searching TMDB first.
   *
   * @param {Object} rec - Recommendation object from AI
   * @param {string} listType - List type (WATCH_QUEUE, CURRENTLY_WATCHING, ALREADY_WATCHED)
   * @param {number} index - Index of the recommendation
   */
  const handleAddToList = async (rec, listType, index) => {
    if (!listGroupId) {
      setError('No list group selected. Please access recommendations from a list page.');
      return;
    }

    setAdding(`${index}-${listType}`);
    setError('');

    try {
      // Reason: Use pre-enriched TMDB data from backend if available, fall back to search
      let titleData;
      if (rec.tmdbId) {
        titleData = {
          type: rec.tmdbType || rec.type,
          name: rec.title,
          tmdbId: rec.tmdbId,
          releaseYear: rec.releaseYear || rec.year,
          posterUrl: rec.posterUrl,
          overview: rec.overview
        };
      } else {
        const searchResponse = await searchMulti(rec.title);
        const results = searchResponse.data?.results || [];

        if (results.length === 0) {
          setError(`Could not find "${rec.title}" on TMDB`);
          setAdding(null);
          return;
        }

        const match = results.find(r =>
          r.name.toLowerCase() === rec.title.toLowerCase() &&
          r.releaseYear === String(rec.year)
        ) || results.find(r =>
          r.name.toLowerCase() === rec.title.toLowerCase()
        ) || results[0];

        titleData = {
          type: match.type,
          name: match.name,
          tmdbId: match.tmdbId,
          releaseYear: match.releaseYear,
          posterUrl: match.posterUrl,
          overview: match.overview
        };
      }

      const createResponse = await createTitle(titleData);
      const titleId = createResponse.data.title.id;

      // Reason: Link to streaming service if one was selected before adding to list
      const selectedServiceId = selectedServices[index];
      if (selectedServiceId) {
        await linkTitleToService(titleId, selectedServiceId);
      }

      await addTitleToList(titleId, listGroupId, listType);

      const listNames = {
        'WATCH_QUEUE': 'Watch Queue',
        'CURRENTLY_WATCHING': 'Currently Watching',
        'ALREADY_WATCHED': 'Already Watched'
      };

      // Reason: If adding to Already Watched with a rating, save the rating
      if (listType === 'ALREADY_WATCHED' && recRatings[index]) {
        try {
          await upsertRating(titleId, { stars: recRatings[index] });
        } catch (ratingErr) {
          console.error('Failed to save rating:', ratingErr);
        }
      }

      setNotification(`"${rec.title}" added to ${listNames[listType]}`);
      setTimeout(() => setNotification(null), 2000);

      // Reason: Trigger slide-out animation, then remove from list after it completes
      setSlidingOut(prev => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setRecommendations(prev => prev.filter((_, i) => i !== index));
        setSlidingOut(prev => {
          const next = { ...prev };
          delete next[index];
          return next;
        });
      }, 400);
    } catch (err) {
      console.error('Failed to add recommendation:', err);
      setError(err.response?.data?.error?.message || `Failed to add "${rec.title}"`);
    } finally {
      setAdding(null);
    }
  };

  const backLink = listGroupId ? `/list/${listGroupId}` : '/dashboard';

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <Link to={backLink} className="text-gray-700 hover:text-blue-600">
                ← Back
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                {genreFromUrl ? `${genreFromUrl} Recommendations` : 'AI Recommendations'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">
                Dashboard
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
        <div className="bg-white rounded-lg shadow p-6 mb-6">
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
                Genre
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

          <div className="mb-4">
            <label
              htmlFor="guidance"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              AI Guidance (optional)
            </label>
            <textarea
              id="guidance"
              value={guidance}
              onChange={(e) => {
                setGuidance(e.target.value);
                setGuidanceSaved(false);
              }}
              onBlur={handleSaveGuidance}
              placeholder="e.g., No cooking competitions. Prefer recent shows from the last 5 years."
              rows={3}
              maxLength={2000}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              {guidance.length}/2000 — Tell the AI what you're in the mood for
              {!guidanceSaved && <span className="text-amber-600"> (unsaved)</span>}
            </p>
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
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Recommended for You
            </h3>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div
                  key={`${rec.title}-${rec.year}`}
                  className={`border rounded-lg p-4 transition-all duration-400 ${
                    slidingOut[index]
                      ? 'opacity-0 -translate-x-full max-h-0 overflow-hidden py-0 my-0 border-0'
                      : 'opacity-100 translate-x-0 max-h-96'
                  } ${
                    addedRecs[index]
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200'
                  }`}
                  style={{ transition: 'all 0.4s ease-in-out' }}
                >
                  <div className="flex gap-3">
                    {rec.posterUrl && (
                      <img
                        src={rec.posterUrl}
                        alt={rec.title}
                        className="w-14 sm:w-16 h-20 sm:h-24 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-gray-900">
                        {rec.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {rec.type} • {rec.year}
                        {rec.streamingService && ` • ${rec.streamingService}`}
                      </p>
                      <p className="text-gray-700 mt-2 text-sm">{rec.reason}</p>
                    </div>
                  </div>

                  {addedRecs[index] ? (
                    <div className="mt-3 text-sm text-green-700 font-medium">
                      Added to {addedRecs[index]}
                    </div>
                  ) : listGroupId ? (
                    <div className="mt-3 space-y-2">
                      <select
                        value={selectedServices[index] || ''}
                        onChange={(e) => setSelectedServices(prev => ({
                          ...prev,
                          [index]: e.target.value
                        }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select service (optional)</option>
                        {streamingServices.map(service => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Already seen it? Rate it:</span>
                        <StarRating
                          value={recRatings[index] || 0}
                          onChange={(stars) => setRecRatings(prev => ({ ...prev, [index]: stars }))}
                          size="sm"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
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
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
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
