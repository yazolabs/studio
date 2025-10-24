import { useState, useEffect, useCallback } from 'react';
import { User, AuthState } from '@/types/auth';
import { getUserPermissions } from '@/lib/permissions';

const AUTH_STORAGE_KEY = 'salon_auth';

export function useAuthUser() {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          user: parsed.user,
          token: parsed.token,
          isAuthenticated: true,
        };
      } catch {
        return { user: null, token: null, isAuthenticated: false };
      }
    }
    return { user: null, token: null, isAuthenticated: false };
  });

  const login = useCallback((username: string, password: string) => {
    // Simulated login - in production, this would call the API
    // For demo: admin/admin123, manager/manager123, etc.
    const mockUsers: Record<string, User> = {
      admin: {
        id: '1',
        name: 'Administrator',
        email: 'admin@salon.com',
        username: 'admin',
        role: 'admin',
        permissions: getUserPermissions('admin'),
      },
      manager: {
        id: '2',
        name: 'Manager User',
        email: 'manager@salon.com',
        username: 'manager',
        role: 'manager',
        permissions: getUserPermissions('manager'),
      },
      professional: {
        id: '3',
        name: 'Professional User',
        email: 'pro@salon.com',
        username: 'professional',
        role: 'professional',
        permissions: getUserPermissions('professional'),
      },
    };

    const user = mockUsers[username];
    if (user && password.endsWith('123')) {
      const token = `mock-token-${username}-${Date.now()}`;
      const newAuthState = { user, token, isAuthenticated: true };
      
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuthState));
      setAuthState(newAuthState);
      
      return { success: true, user };
    }

    return { success: false, error: 'Invalid credentials' };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthState({ user: null, token: null, isAuthenticated: false });
  }, []);

  return {
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    login,
    logout,
  };
}
