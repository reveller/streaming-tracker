import { createContext, useState, useEffect, useCallback } from 'react';
import * as authAPI from '../api/auth.js';

export const AuthContext = createContext(null);

/**
 * Authentication context provider.
 *
 * Manages user authentication state across the application.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load current user from API if token exists.
   */
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login with email and password.
   *
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<void>}
   * @throws {Error} Login error
   */
  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { user: userData, accessToken, refreshToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
  };

  /**
   * Register a new user.
   *
   * @param {string} email - User email
   * @param {string} username - Username
   * @param {string} password - User password
   * @returns {Promise<void>}
   * @throws {Error} Registration error
   */
  const register = async (email, username, password) => {
    const response = await authAPI.register({ email, username, password });
    const { user: userData, accessToken, refreshToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
  };

  /**
   * Logout current user.
   *
   * @returns {Promise<void>}
   */
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  /**
   * Update user profile.
   *
   * @param {Object} updates - Profile updates
   * @returns {Promise<void>}
   * @throws {Error} Update error
   */
  const updateProfile = async (updates) => {
    const response = await authAPI.updateProfile(updates);
    setUser(response.data.user);
  };

  /**
   * Change user password.
   *
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   * @throws {Error} Password change error
   */
  const changePassword = async (currentPassword, newPassword) => {
    await authAPI.changePassword({ currentPassword, newPassword });
  };

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser: loadUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
