import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, api } from '../services/api';
import type { User } from '../types';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Проверка аутентификации при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      api.setAuthToken(token);
      
      try {
        const response = await authService.getCurrentUser();
        if (response.success && response.data) {
          setUser(transformUser(response.data));
        } else {
          localStorage.removeItem('auth_token');
          api.clearAuthToken();
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('auth_token');
        api.clearAuthToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const transformUser = (userData: any): User => {
    return {
      id: userData.id,
      email: userData.email,
      name: userData.username || userData.name || '',
      created_at: userData.created_at,
    };
  };

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(email, password);
      
      if (response.success && response.data?.access_token) {
        const { access_token, user: userData } = response.data;
        
        localStorage.setItem('auth_token', access_token);
        api.setAuthToken(access_token);
        setUser(transformUser(userData));
        
        return true;
      } else {
        setError(response.error || 'Login failed');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.register(email, password, name);
      
      if (response.success && response.data?.access_token) {
        const { access_token, user: userData } = response.data;
        
        localStorage.setItem('auth_token', access_token);
        api.setAuthToken(access_token);
        setUser(transformUser(userData));
        
        return true;
      } else {
        setError(response.error || 'Registration failed');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('auth_token');
      api.clearAuthToken();
      setUser(null);
      navigate('/login');
    }
  }, [navigate]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  }, []);

  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUser,
  };
};

// Хук для защиты маршрутов
export const useRequireAuth = (redirectTo: string = '/login') => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate(redirectTo);
    }
  }, [user, isLoading, navigate, redirectTo]);

  return { user, isLoading };
};