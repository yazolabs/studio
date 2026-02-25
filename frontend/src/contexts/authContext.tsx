import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import axios from "axios";
import { api } from "@/services/api";
import { User, Permission } from "@/types/auth";

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

type LoginResult = {
  success: boolean;
  user?: User;
  error?: string;
};

type AuthContextType = AuthState & {
  login: (login: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setState({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }

    api.defaults.headers.Authorization = `Bearer ${token}`;

    try {
      const { data } = await api.get<{ user: User; permissions: Permission[] }>("/me");

      setState({
        user: { ...data.user, permissions: data.permissions },
        isAuthenticated: true,
        isLoading: false,
      });

      return data.user;
    } catch {
      localStorage.removeItem("authToken");
      delete api.defaults.headers.Authorization;
      setState({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (login: string, password: string): Promise<LoginResult> => {
    try {
      const { data } = await api.post<{
        message: string;
        token: string;
        user: User;
      }>("/login", { login, password });

      localStorage.setItem("authToken", data.token);
      api.defaults.headers.Authorization = `Bearer ${data.token}`;

      const me = await api.get<{ user: User; permissions: Permission[] }>("/me");

      setState({
        user: { ...me.data.user, permissions: me.data.permissions },
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true, user: me.data.user };
    } catch (error) {
      let message = "Não foi possível realizar o login.";
      if (axios.isAxiosError(error)) {
        message = (error.response?.data as any)?.message ?? message;
      }

      localStorage.removeItem("authToken");
      delete api.defaults.headers.Authorization;
      setState({ user: null, isAuthenticated: false, isLoading: false });

      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/logout");
    } finally {
      localStorage.removeItem("authToken");
      delete api.defaults.headers.Authorization;
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({ ...state, login, logout, refresh }),
    [state, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
