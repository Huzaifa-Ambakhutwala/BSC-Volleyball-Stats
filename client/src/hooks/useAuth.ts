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
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Set the state first
      setAuthState({ isAuthenticated: true, username, id: 1 });
      
      // Force a small delay to ensure state is updated before returning
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(true);
        }, 50);
      });
    }
    return false;
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