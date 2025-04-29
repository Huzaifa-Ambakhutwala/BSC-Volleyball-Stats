import { useState, useEffect } from 'react';

// This is a simple auth hook for hardcoded admin credentials
// In a real app, you would use Firebase Auth or similar

// Hardcoded admin credentials - in a real app these would be in a secure backend
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'volleyball123';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
}

export const useAuth = () => {
  // Initialize auth state from localStorage if available
  const [authState, setAuthState] = useState<AuthState>(() => {
    const savedAuth = localStorage.getItem('bscVolleyballAuth');
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        return {
          isAuthenticated: parsed.isAuthenticated || false,
          username: parsed.username || null
        };
      } catch (e) {
        return { isAuthenticated: false, username: null };
      }
    }
    return { isAuthenticated: false, username: null };
  });

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bscVolleyballAuth', JSON.stringify(authState));
  }, [authState]);

  const login = (username: string, password: string): boolean => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setAuthState({ isAuthenticated: true, username });
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthState({ isAuthenticated: false, username: null });
  };

  return {
    isAuthenticated: authState.isAuthenticated,
    username: authState.username,
    login,
    logout
  };
};
