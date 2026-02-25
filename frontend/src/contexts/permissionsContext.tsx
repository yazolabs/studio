import React, { createContext, ReactNode, useContext, useMemo } from "react";
import { Permission } from "@/types/auth";
import { useAuth } from "@/contexts/authContext";

type PermissionsContextType = {
  permissions: Permission[];
  loading: boolean;
};

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();

  const permissions = useMemo<Permission[]>(() => {
    return (user?.permissions ?? []) as Permission[];
  }, [user?.permissions]);

  return (
    <PermissionsContext.Provider value={{ permissions, loading: isLoading }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) throw new Error("usePermissions must be used within a PermissionsProvider");
  return context;
};
