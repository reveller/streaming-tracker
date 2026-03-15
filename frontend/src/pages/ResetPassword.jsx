import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as authAPI from '../api/auth.js';

/**
 * Reset Password Page
 *
 * Allows users to set a new password using a token from their email.
 *
 * @returns {JSX.Element}
 */
function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
   * Handle form submission.
   *
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      setError(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(token, formData.newPassword);
      setSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);
      const errorMessage =
        err.response?.data?.error?.message ||
        'Failed to reset password. The link may have expired.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Invalid Reset Link
          </h1>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="text-blue-600 hover:text-blue-800"
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Streaming Tracker
          </h1>
          <p className="text-gray-600 mt-2">Set a new password</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              Your password has been reset successfully.
            </div>
            <Link
              to="/login"
              className="inline-block bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                At least 8 characters with uppercase, lowercase, and a number
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm New Password
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
