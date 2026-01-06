import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getListGroupById, deleteListGroup } from '../api/lists.js';
import { searchMulti } from '../api/tmdb.js';
import { createTitle, addTitleToList, moveTitleToList, removeTitleFromList } from '../api/titles.js';
import { upsertRating } from '../api/ratings.js';
import StarRating from '../components/StarRating.jsx';

/**
 * List Group Detail Page
 *
 * Shows titles organized by list type (Watch Queue, Currently Watching, Already Watched)
 *
 * @returns {JSX.Element}
 */
function ListGroup() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listGroup, setListGroup] = useState(null);
  const [titles, setTitles] = useState({
    watchQueue: [],
    currentlyWatching: [],
    alreadyWatched: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(null);

  /**
   * Load list group data
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await getListGroupById(id);
        const listGroupData = response.data.listGroup;
        setListGroup(listGroupData);
        setTitles(listGroupData.titles || {
          watchQueue: [],
          currentlyWatching: [],
          alreadyWatched: []
        });
      } catch (err) {
        console.error('Failed to load list group:', err);
        setError('Failed to load list group');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  /**
   * Handle deleting the list group
   */
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteListGroup(id);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to delete list group:', err);
      setError('Failed to delete list group');
      setDeleting(false);
    }
  };

  /**
   * Handle searching for titles
   */
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError('');
    try {
      const response = await searchMulti(searchQuery);
      setSearchResults(response.data.results || []);
    } catch (err) {
      console.error('Failed to search:', err);
      setError('Failed to search for titles');
    } finally {
      setSearching(false);
    }
  };

  /**
   * Handle adding a title to the list
   */
  const handleAddTitle = async (tmdbResult, listType) => {
    setAdding(tmdbResult.tmdbId);
    setError('');

    try {
      // First, create the title in our database if it doesn't exist
      const titleData = {
        type: tmdbResult.type,
        name: tmdbResult.name,
        tmdbId: tmdbResult.tmdbId,
        releaseYear: tmdbResult.releaseYear,
        posterUrl: tmdbResult.posterUrl,
        overview: tmdbResult.overview
      };

      const createResponse = await createTitle(titleData);
      const titleId = createResponse.data.title.id;

      // Then add it to the list
      await addTitleToList(titleId, id, listType);

      // Reload list data
      const response = await getListGroupById(id);
      const listGroupData = response.data.listGroup;
      setTitles(listGroupData.titles || {
        watchQueue: [],
        currentlyWatching: [],
        alreadyWatched: []
      });

      // Close modal and reset search
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error('Failed to add title:', err);
      setError(err.response?.data?.error?.message || 'Failed to add title');
    } finally {
      setAdding(null);
    }
  };

  /**
   * Handle moving a title to a different list
   */
  const handleMoveTitle = async (title, newListType) => {
    setError('');
    try {
      await moveTitleToList(title.id, id, newListType);

      // Reload list data
      const response = await getListGroupById(id);
      const listGroupData = response.data.listGroup;
      setTitles(listGroupData.titles || {
        watchQueue: [],
        currentlyWatching: [],
        alreadyWatched: []
      });
    } catch (err) {
      console.error('Failed to move title:', err);
      setError('Failed to move title');
    }
  };

  /**
   * Handle removing a title from the list
   */
  const handleRemoveTitle = async (titleId) => {
    setError('');
    try {
      await removeTitleFromList(titleId, id);

      // Reload list data
      const response = await getListGroupById(id);
      const listGroupData = response.data.listGroup;
      setTitles(listGroupData.titles || {
        watchQueue: [],
        currentlyWatching: [],
        alreadyWatched: []
      });
    } catch (err) {
      console.error('Failed to remove title:', err);
      setError('Failed to remove title');
    }
  };

  /**
   * Handle rating a title
   */
  const handleRating = async (titleId, stars) => {
    setError('');
    try {
      await upsertRating(titleId, { stars });

      // Reload list data to get updated rating
      const response = await getListGroupById(id);
      const listGroupData = response.data.listGroup;
      setTitles(listGroupData.titles || {
        watchQueue: [],
        currentlyWatching: [],
        alreadyWatched: []
      });
    } catch (err) {
      console.error('Failed to rate title:', err);
      setError('Failed to save rating');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !listGroup) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">{error || 'List group not found'}</div>
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalTitles = titles.watchQueue.length + titles.currentlyWatching.length + titles.alreadyWatched.length;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-blue-600 hover:underline mr-4">
                ← Back
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {listGroup.genre.name} List
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSearchModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Add Title
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Delete List Group
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total Titles</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{totalTitles}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Watch Queue</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{titles.watchQueue.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Currently Watching</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{titles.currentlyWatching.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Already Watched</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">{titles.alreadyWatched.length}</div>
          </div>
        </div>

        {/* Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Watch Queue */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 bg-blue-50">
              <h3 className="font-bold text-gray-900">Watch Queue</h3>
              <p className="text-sm text-gray-600">Titles you want to watch</p>
            </div>
            <div className="p-4">
              {titles.watchQueue.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No titles yet</p>
              ) : (
                <div className="space-y-3">
                  {titles.watchQueue.map((title) => (
                    <div key={title.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {title.posterUrl && (
                        <img
                          src={title.posterUrl}
                          alt={title.name}
                          className="w-16 h-24 object-cover rounded flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <a
                          href={`https://www.themoviedb.org/${title.type === 'MOVIE' ? 'movie' : 'tv'}/${title.tmdbId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-gray-900 hover:text-blue-600 hover:underline mb-2 block"
                        >
                          {title.name}
                        </a>
                        {title.releaseYear && (
                          <div className="text-sm text-gray-600 mb-2">{title.releaseYear}</div>
                        )}
                        <div className="mb-3">
                          <StarRating
                            value={title.rating?.stars || 0}
                            onChange={(stars) => handleRating(title.id, stars)}
                            size="sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMoveTitle(title, 'CURRENTLY_WATCHING')}
                            className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Start Watching
                          </button>
                          <button
                            onClick={() => handleRemoveTitle(title.id)}
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Currently Watching */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 bg-green-50">
              <h3 className="font-bold text-gray-900">Currently Watching</h3>
              <p className="text-sm text-gray-600">Titles in progress</p>
            </div>
            <div className="p-4">
              {titles.currentlyWatching.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No titles yet</p>
              ) : (
                <div className="space-y-3">
                  {titles.currentlyWatching.map((title) => (
                    <div key={title.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {title.posterUrl && (
                        <img
                          src={title.posterUrl}
                          alt={title.name}
                          className="w-16 h-24 object-cover rounded flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <a
                          href={`https://www.themoviedb.org/${title.type === 'MOVIE' ? 'movie' : 'tv'}/${title.tmdbId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-gray-900 hover:text-blue-600 hover:underline mb-2 block"
                        >
                          {title.name}
                        </a>
                        {title.releaseYear && (
                          <div className="text-sm text-gray-600 mb-2">{title.releaseYear}</div>
                        )}
                        <div className="mb-3">
                          <StarRating
                            value={title.rating?.stars || 0}
                            onChange={(stars) => handleRating(title.id, stars)}
                            size="sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMoveTitle(title, 'WATCH_QUEUE')}
                            className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Back to Queue
                          </button>
                          <button
                            onClick={() => handleMoveTitle(title, 'ALREADY_WATCHED')}
                            className="flex-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            Mark Watched
                          </button>
                          <button
                            onClick={() => handleRemoveTitle(title.id)}
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Already Watched */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 bg-purple-50">
              <h3 className="font-bold text-gray-900">Already Watched</h3>
              <p className="text-sm text-gray-600">Completed titles</p>
            </div>
            <div className="p-4">
              {titles.alreadyWatched.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No titles yet</p>
              ) : (
                <div className="space-y-3">
                  {titles.alreadyWatched.map((title) => (
                    <div key={title.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {title.posterUrl && (
                        <img
                          src={title.posterUrl}
                          alt={title.name}
                          className="w-16 h-24 object-cover rounded flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <a
                          href={`https://www.themoviedb.org/${title.type === 'MOVIE' ? 'movie' : 'tv'}/${title.tmdbId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-gray-900 hover:text-blue-600 hover:underline mb-2 block"
                        >
                          {title.name}
                        </a>
                        {title.releaseYear && (
                          <div className="text-sm text-gray-600 mb-2">{title.releaseYear}</div>
                        )}
                        <div className="mb-3">
                          <StarRating
                            value={title.rating?.stars || 0}
                            onChange={(stars) => handleRating(title.id, stars)}
                            size="sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMoveTitle(title, 'CURRENTLY_WATCHING')}
                            className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Watch Again
                          </button>
                          <button
                            onClick={() => handleRemoveTitle(title.id)}
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Add Title</h3>
              <p className="text-gray-600 mt-1 text-sm">
                Search for movies or TV series to add to your list
              </p>
            </div>

            <div className="p-6 border-b border-gray-200">
              <form onSubmit={handleSearch} className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a title..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {searchResults.length === 0 && !searching && searchQuery && (
                <p className="text-center text-gray-500 py-8">
                  No results found. Try a different search.
                </p>
              )}

              {searchResults.length === 0 && !searching && !searchQuery && (
                <p className="text-center text-gray-500 py-8">
                  Enter a title name to search
                </p>
              )}

              <div className="space-y-3">
                {searchResults.map((result, index) => (
                  <div
                    key={result.tmdbId || index}
                    className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {result.posterUrl && (
                      <img
                        src={result.posterUrl}
                        alt={result.name}
                        className="w-16 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">
                        {result.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-1">
                        {result.releaseYear || 'N/A'} • {result.type === 'MOVIE' ? 'Movie' : 'TV Series'}
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {result.overview || 'No description available'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <a
                        href={`https://www.themoviedb.org/${result.type === 'MOVIE' ? 'movie' : 'tv'}/${result.tmdbId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 text-center whitespace-nowrap"
                      >
                        More Info
                      </a>
                      <button
                        onClick={() => handleAddTitle(result, 'WATCH_QUEUE')}
                        disabled={adding === result.tmdbId}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        {adding === result.tmdbId ? 'Adding...' : 'To Queue'}
                      </button>
                      <button
                        onClick={() => handleAddTitle(result, 'CURRENTLY_WATCHING')}
                        disabled={adding === result.tmdbId}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        {adding === result.tmdbId ? 'Adding...' : 'Watching'}
                      </button>
                      <button
                        onClick={() => handleAddTitle(result, 'ALREADY_WATCHED')}
                        disabled={adding === result.tmdbId}
                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        {adding === result.tmdbId ? 'Adding...' : 'Watched'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                  setError('');
                }}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Delete List Group?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the {listGroup.genre.name} list group?
                This will remove all {totalTitles} title{totalTitles !== 1 ? 's' : ''} from this list.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListGroup;
