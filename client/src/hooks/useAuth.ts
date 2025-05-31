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

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setAuthState({ 
            isAuthenticated: true, 
            username: userData.username, 
            id: userData.id 
          });
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };

    // Only check if not already authenticated
    if (!authState.isAuthenticated) {
      checkAuthStatus();
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Use server-side authentication API
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        setAuthState({ isAuthenticated: true, username: userData.username, id: userData.id });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error logging in:', error);
      // Fall back to hardcoded credentials if server fails
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        setAuthState({ isAuthenticated: true, username, id: 1 });
        return true;
      }
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setAuthState({ isAuthenticated: false, username: null });
    }
  };

  return {
    isAuthenticated: authState.isAuthenticated,
    username: authState.username,
    id: authState.id,
    login,
    logout
  };
};