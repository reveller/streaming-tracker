import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { validateToken, redeemInvitation } from '../api/invitations.js';

/**
 * Register Page (Invitation-Only)
 *
 * Handles invite-only registration flow:
 * - No token: shows "invitation only" message
 * - Token present: validates, then shows registration form with pre-filled email
 *
 * @returns {JSX.Element}
 */
function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const token = searchParams.get('token');

  const [tokenStatus, setTokenStatus] = useState('loading'); // 'loading' | 'valid' | 'invalid'
  const [invitationEmail, setInvitationEmail] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Validate the invitation token on mount.
   */
  useEffect(() => {
    if (!token) {
      setTokenStatus('invalid');
      return;
    }

    let cancelled = false;

    const validate = async () => {
      try {
        const response = await validateToken(token);
        if (!cancelled) {
          // Reason: API may return data nested under .data or directly
          const email = response.data?.email || response.email;
          setInvitationEmail(email);
          setTokenStatus('valid');
        }
      } catch (err) {
        if (!cancelled) {
          setTokenStatus('invalid');
        }
      }
    };

    validate();

    return () => {
      cancelled = true;
    };
  }, [token]);

  /**
   * Handle form input changes.
   *
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  /**
   * Validate form data.
   *
   * @returns {boolean} Whether form is valid
   */
  const validateForm = () => {
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  /**
   * Handle form submission.
   * Redeems the invitation token and logs the user in.
   *
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await redeemInvitation({
        token,
        username: formData.username,
        password: formData.password
      });

      // Reason: Store tokens and set user state via login-like flow
      const { accessToken, refreshToken } = response.data || response;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Reload user state by navigating; the AuthContext will pick up the token
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage =
        err.response?.data?.error?.message ||
        'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // No token provided - show invitation-only message
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Invitation Required
            </h1>
            <p className="text-gray-600 mb-6">
              Registration is by invitation only. Please contact an
              administrator to request an invitation.
            </p>
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Token is being validated - show loading state
  if (tokenStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Validating invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  // Token is invalid or expired
  if (tokenStatus === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Invalid Invitation
            </h1>
            <p className="text-gray-600 mb-6">
              This invitation link has expired or has already been used. Please
              request a new invitation from an administrator.
            </p>
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Token is valid - show registration form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">
            Complete your registration to join Streaming Tracker
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={invitationEmail}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              disabled
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              Set by your invitation
            </p>
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nickname
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Johnny"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              At least 8 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
