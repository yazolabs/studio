import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getUserPermissions } from '@/lib/permissions';
import { Permission } from '@/types/auth';

type PermissionsContextType = {
  permissions: Permission[] | null;
  loading: boolean;
};

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

interface PermissionsProviderProps {
  children: ReactNode;
}

export const PermissionsProvider = ({ children }: PermissionsProviderProps) => {
  const [permissions, setPermissions] = useState<Permission[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = () => {
      const userRole = 'admin';
      const userPermissions = getUserPermissions(userRole);
      setPermissions(userPermissions);
      setLoading(false);
    };

    loadPermissions();
  }, []);

  return (
    <PermissionsContext.Provider value={{ permissions, loading }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = React.useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};
