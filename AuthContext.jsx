import React, { createContext, useState, useContext, useEffect } from 'react';
import * as api from './api';

// Create context with default values to avoid "undefined" errors
const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  loading: true
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    // Check for stored auth info on component mount
    const checkAuth = async () => {
      setLoading(true);
      try {
        // Use sessionStorage instead of localStorage to keep authentication tab-specific
        const token = sessionStorage.getItem('auth_token');
        const storedRole = sessionStorage.getItem('user_role');
        const userId = sessionStorage.getItem('user_id');
        
        if (token && storedRole) {
          // Try to validate the token with the backend
          const isValid = await api.validateToken(token);
          
          if (isValid) {
            // Token is valid, set up the user
            setUser({ token, role: storedRole, userId });
          } else {
            // Token is invalid, clear storage
            sessionStorage.removeItem('auth_token');
            sessionStorage.removeItem('user_role');
            sessionStorage.removeItem('user_id');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth validation error:', error);
        
        // Special handling for development mode - allow frontend testing without backend
        if (process.env.NODE_ENV === 'development' && error.message.includes('ECONNREFUSED')) {
          console.warn('Development mode: Creating mock user session for UI testing');
          const mockToken = 'mock-token-for-development';
          const mockRole = sessionStorage.getItem('user_role') || 'Admin'; // Default to Admin for testing
          const mockUserId = '1';
          
          sessionStorage.setItem('auth_token', mockToken);
          sessionStorage.setItem('user_role', mockRole);
          sessionStorage.setItem('user_id', mockUserId);
          
          setUser({ token: mockToken, role: mockRole, userId: mockUserId });
        } else {
          // Regular error handling - clear invalid auth data
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('user_role');
          sessionStorage.removeItem('user_id');
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Add event listener for storage changes (helps with multiple tabs)
  useEffect(() => {
    // Function to handle storage events from other tabs
    const handleStorageChange = (e) => {
      // Only react to storage changes for auth-related items
      if (e.key === 'auth_token' || e.key === 'user_role') {
        if (e.newValue) {
          // New login in another tab
          const token = sessionStorage.getItem('auth_token');
          const role = sessionStorage.getItem('user_role');
          const userId = sessionStorage.getItem('user_id');
          if (token && role) {
            setUser({ token, role, userId });
          }
        } else {
          // Logout in another tab
          setUser(null);
        }
      }
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (token, role, userId) => {
    if (!token || !role) {
      console.error('Invalid login credentials');
      return;
    }
    // Use sessionStorage instead of localStorage
    sessionStorage.setItem('auth_token', token);
    sessionStorage.setItem('user_role', role);
    if (userId) sessionStorage.setItem('user_id', userId);
    setUser({ token, role, userId });
  };

  const logout = () => {
    // Use sessionStorage instead of localStorage
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_role');
    sessionStorage.removeItem('user_id');
    setUser(null);
  };

  const contextValue = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
