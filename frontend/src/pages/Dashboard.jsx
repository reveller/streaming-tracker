import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getListGroups, createListGroup } from '../api/lists.js';
import { getAllGenres } from '../api/genres.js';

/**
 * Dashboard Page
 *
 * Main dashboard showing user's list groups and quick stats.
 *
 * @returns {JSX.Element}
 */
function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [listGroups, setListGroups] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [creating, setCreating] = useState(false);

  /**
   * Load list groups and genres on mount.
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [listGroupsRes, genresRes] = await Promise.all([
          getListGroups(),
          getAllGenres()
        ]);
        setListGroups(listGroupsRes.data.listGroups);
        setGenres(genresRes.data.genres);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /**
   * Handle creating a new list group.
   */
  const handleCreateListGroup = async (e) => {
    e.preventDefault();
    if (!selectedGenre) return;

    setCreating(true);
    setError('');

    try {
      await createListGroup(selectedGenre);

      // Reload list groups and user stats
      const listGroupsRes = await getListGroups();
      setListGroups(listGroupsRes.data.listGroups);
      await refreshUser();

      // Close modal and reset
      setShowCreateModal(false);
      setSelectedGenre('');
    } catch (err) {
      console.error('Failed to create list group:', err);
      setError(err.response?.data?.error?.message || 'Failed to create list group');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

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
              <Link
                to="/recommendations"
                className="text-gray-700 hover:text-blue-600"
              >
                Recommendations
              </Link>
              <Link to="/settings" className="text-gray-700 hover:text-blue-600">
                Settings
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.username}!
          </h2>
          <p className="text-gray-600 mt-1">Manage your streaming watchlists</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {user?.stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Total Lists</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {user.stats.totalLists}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Total Titles</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {user.stats.totalTitles}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">
                Total Ratings
              </div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {user.stats.totalRatings}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Your List Groups</h3>
              <p className="text-gray-600 mt-1">
                Organize your titles by genre
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Create List Group
            </button>
          </div>

          <div className="p-6">
            {listGroups.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  You haven&apos;t created any list groups yet.
                </p>
                <p className="text-sm text-gray-500">
                  Click &quot;Create List Group&quot; above to start organizing your titles by genre!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listGroups.map((listGroup) => (
                  <Link
                    key={listGroup.id}
                    to={`/list/${listGroup.id}`}
                    className="block p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-gray-900">
                        {listGroup.genre.name}
                      </h4>
                      <span className="text-2xl font-bold text-blue-600">
                        {listGroup.titleCount || 0}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {listGroup.titleCount === 1 ? '1 title' : `${listGroup.titleCount || 0} titles`}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create List Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  Create New List Group
                </h3>
                <p className="text-gray-600 mt-1 text-sm">
                  Select a genre to organize your titles
                </p>
              </div>

              <form onSubmit={handleCreateListGroup} className="p-6">
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="mb-6">
                  <label
                    htmlFor="genre"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Genre
                  </label>
                  <select
                    id="genre"
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a genre...</option>
                    {genres
                      .filter((genre) =>
                        !listGroups.some((lg) => lg.genre.id === genre.id)
                      )
                      .map((genre) => (
                        <option key={genre.id} value={genre.id}>
                          {genre.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    You can only create one list group per genre
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setSelectedGenre('');
                      setError('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !selectedGenre}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Note: Full list management with drag-and-drop Kanban boards coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
