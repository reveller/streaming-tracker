import { useState, useEffect, useCallback } from 'react';
import { createInvitation, listInvitations } from '../api/invitations.js';

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
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ml-2 flex-shrink-0 ${getStatusClasses(status)}`}
                      >
                        {status}
                      </span>
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
