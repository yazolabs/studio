import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { api, ensureCsrfCookie, ApiError } from '@/services/api';
import { AuthState, User } from '@/types/auth';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export function useAuthUser() {
  const [authState, setAuthState] = useState<AuthState>(initialState);

  const fetchAuthenticatedUser = useCallback(async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      const { data } = await api.get<{ user: User }>('/auth/me');
      setAuthState({ user: data.user, isAuthenticated: true, isLoading: false });
      return data.user;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
        return null;
      }

      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const bootstrap = async () => {
      try {
        await fetchAuthenticatedUser();
      } catch {
        if (!isActive) {
          return;
        }
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };

    bootstrap();

    return () => {
      isActive = false;
    };
  }, [fetchAuthenticatedUser]);

  const login = useCallback(
    async (login: string, password: string): Promise<LoginResult> => {
      try {
        await ensureCsrfCookie();
        const { data } = await api.post<{ message: string; user: User }>('/auth/login', {
          login,
          password,
        });

        setAuthState({ user: data.user, isAuthenticated: true, isLoading: false });
        return { success: true, user: data.user };
      } catch (error) {
        let message = 'Não foi possível realizar o login.';

        if (axios.isAxiosError<ApiError>(error)) {
          message = error.response?.data?.message ?? message;
        }

        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
        return { success: false, error: message };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors, session might already be invalidated
    } finally {
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    logout,
    refresh: fetchAuthenticatedUser,
  };
}
