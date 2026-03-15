import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authAPI from '../api/auth.js';

/**
 * Forgot Password Page
 *
 * Allows users to request a password reset email.
 *
 * @returns {JSX.Element}
 */
function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handle form submission.
   *
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Streaming Tracker
          </h1>
          <p className="text-gray-600 mt-2">Reset your password</p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              If an account with that email exists, a password reset link has
              been sent. Check your inbox.
            </div>
            <Link
              to="/login"
              className="inline-block text-blue-600 hover:text-blue-800 text-sm"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <p className="text-sm text-gray-600">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>

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
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
