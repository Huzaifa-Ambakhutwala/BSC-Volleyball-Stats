import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/queryClient';

// This is a simple auth hook for hardcoded admin credentials
// In a real app, you would use Firebase Auth or similar

// Hardcoded admin credentials - in a real app these would be in a secure backend
const ADMIN_USERNAME = 'Mehdi';
const ADMIN_PASSWORD = '0000';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  id?: number;
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
          username: parsed.username || null,
          id: parsed.id || undefined
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

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Import dynamically to avoid circular dependencies
      const { loginAdmin } = await import('../lib/firebase');
      const success = await loginAdmin(username, password);
      
      if (success) {
        // Set the state
        setAuthState({ isAuthenticated: true, username, id: 1 });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error logging in:', error);
      // Fall back to hardcoded credentials if firebase fails
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        setAuthState({ isAuthenticated: true, username, id: 1 });
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    setAuthState({ isAuthenticated: false, username: null });
  };

  return {
    isAuthenticated: authState.isAuthenticated,
    username: authState.username,
    id: authState.id,
    login,
    logout
  };
};