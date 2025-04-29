import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/queryClient';

// This is an updated auth hook that uses the API endpoints
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
  
  // Check if the user is already authenticated on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await apiRequest('GET', '/api/user');
        if (response.ok) {
          const data = await response.json();
          setAuthState({ 
            isAuthenticated: true, 
            username: data.username,
            id: data.id
          });
        }
      } catch (error) {
        // Silent fail - user is not authenticated
        console.log('Not authenticated');
      }
    };
    
    if (authState.isAuthenticated) {
      checkAuthStatus();
    }
  }, []);

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bscVolleyballAuth', JSON.stringify(authState));
  }, [authState]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest('POST', '/api/login', { username, password });
      
      if (response.ok) {
        const data = await response.json();
        setAuthState({ 
          isAuthenticated: true, 
          username: data.username,
          id: data.id
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest('POST', '/api/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({ isAuthenticated: false, username: null });
    }
  }, []);

  return {
    isAuthenticated: authState.isAuthenticated,
    username: authState.username,
    id: authState.id,
    login,
    logout
  };
};
