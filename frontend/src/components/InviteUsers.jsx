import { useState, useEffect, useCallback } from 'react';
import { createInvitation, deleteInvitation, listInvitations } from '../api/invitations.js';

/**
 * Determine invitation status based on used flag and expiration.
 *
 * @param {Object} invitation - Invitation object
 * @returns {string} Status label: 'used', 'expired', or 'pending'
 */
const getInvitationStatus = (invitation) => {
  if (invitation.used || invitation.usedAt) {
    return 'used';
  }
  if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
    return 'expired';
  }
  return 'pending';
};

/**
 * Get Tailwind CSS classes for invitation status badge.
 *
 * @param {string} status - Status string
 * @returns {string} CSS classes
 */
const getStatusClasses = (status) => {
  switch (status) {
  case 'used':
    return 'bg-green-100 text-green-800';
  case 'expired':
    return 'bg-red-100 text-red-800';
  case 'pending':
    return 'bg-yellow-100 text-yellow-800';
  default:
    return 'bg-gray-100 text-gray-800';
  }
};

/**
 * InviteUsers Component (Admin Only)
 *
 * Allows admin users to send invitations and view invitation history.
 *
 * @returns {JSX.Element}
 */
function InviteUsers() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invitationsLoading, setInvitationsLoading] = useState(false);

  /**
   * Load invitations list from the API.
   */
  const loadInvitations = useCallback(async () => {
    setInvitationsLoading(true);
    try {
      const response = await listInvitations();
      // Reason: API may nest data under .data or return directly
      const list = response.data?.invitations || response.invitations || [];
      setInvitations(list);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    } finally {
      setInvitationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  /**
   * Handle sending an invitation.
   *
   * @param {Event} e - Form submit event
   */
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteMessage('');
    setInviteLoading(true);

    try {
      await createInvitation(inviteEmail);
      setInviteMessage(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      await loadInvitations();
    } catch (err) {
      console.error('Invitation error:', err);
      const errorMessage =
        err.response?.data?.error?.message || 'Failed to send invitation';
      setInviteError(errorMessage);
    } finally {
      setInviteLoading(false);
    }
  };

  /**
   * Handle deleting an invitation.
   *
   * @param {string} id - Invitation ID to delete
   */
  const handleDelete = async (id) => {
    try {
      await deleteInvitation(id);
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    } catch (err) {
      console.error('Delete invitation error:', err);
      setInviteError(
        err.response?.data?.error?.message || 'Failed to delete invitation'
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Send Invitation Form */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Send Invitation
        </h2>

        {inviteMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {inviteMessage}
          </div>
        )}

        {inviteError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {inviteError}
          </div>
        )}

        <form
          onSubmit={handleInviteSubmit}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => {
              setInviteEmail(e.target.value);
              setInviteError('');
              setInviteMessage('');
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="email@example.com"
            disabled={inviteLoading}
          />
          <button
            type="submit"
            disabled={inviteLoading}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {inviteLoading ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>

      {/* Invitations List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Invitation History
        </h2>

        {invitationsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No invitations sent yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop table view */}
            <table className="w-full hidden sm:table">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                    Email
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                    Date Sent
                  </th>
                  <th className="py-3 px-2 text-sm font-medium text-gray-600 w-10" />
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation, index) => {
                  const status = getInvitationStatus(invitation);
                  return (
                    <tr
                      key={invitation.id || invitation.token || index}
                      className="border-b border-gray-100"
                    >
                      <td className="py-3 px-2 text-sm text-gray-900">
                        {invitation.email}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusClasses(status)}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600">
                        {invitation.createdAt
                          ? new Date(invitation.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => handleDelete(invitation.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete invitation"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile card view */}
            <div className="sm:hidden space-y-3">
              {invitations.map((invitation, index) => {
                const status = getInvitationStatus(invitation);
                return (
                  <div
                    key={invitation.id || invitation.token || index}
                    className="border border-gray-200 rounded-md p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-900 break-all">
                        {invitation.email}
                      </span>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusClasses(status)}`}
                        >
                          {status}
                        </span>
                        <button
                          onClick={() => handleDelete(invitation.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete invitation"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Sent:{' '}
                      {invitation.createdAt
                        ? new Date(invitation.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InviteUsers;
