import { useCallback, useEffect, useState } from "react";
import { api } from "@/services/api";
import { User, Permission } from "@/types/auth";
import axios from "axios";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export function useAuthUser() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const fetchAuthenticatedUser = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }

    try {
      const { data } = await api.get<{ user: User; permissions: Permission[] }>("/me");
      setAuthState({
        user: { ...data.user, permissions: data.permissions },
        isAuthenticated: true,
        isLoading: false,
      });
      return data.user;
    } catch (error) {
      localStorage.removeItem("authToken");
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  }, []);

  useEffect(() => {
    if (!authState.isAuthenticated) {
      fetchAuthenticatedUser();
    }
  }, [fetchAuthenticatedUser, authState.isAuthenticated]);

  const login = useCallback(
    async (login: string, password: string): Promise<LoginResult> => {
      try {
        const { data } = await api.post<{
          message: string;
          token: string;
          user: User;
        }>("/login", {
          login,
          password,
        });

        localStorage.setItem("authToken", data.token);
        api.defaults.headers.Authorization = `Bearer ${data.token}`;
        setAuthState({
          user: { ...data.user, permissions: data.user.permissions }, // Atribui permissões
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true, user: data.user };
      } catch (error) {
        let message = "Não foi possível realizar o login.";
        if (axios.isAxiosError(error)) {
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
      await api.post("/logout");
    } finally {
      localStorage.removeItem("authToken");
      delete api.defaults.headers.Authorization;
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
