import { useAuthUser } from './useAuthUser';
import { hasPermission, canAccessScreen, rolePermissions } from '@/lib/permissions';
import { Screen, PermissionAction } from '@/types/auth';

export function usePermission() {
  const { user } = useAuthUser();

  const effectivePermissions = (() => {
    if (user?.permissions?.length) {
      return user.permissions;
    }

    if (user?.role) {
      return rolePermissions[user.role] ?? [];
    }

    return [];
  })();

  const can = (screen: Screen, action: PermissionAction): boolean => {
    return hasPermission(effectivePermissions, screen, action);
  };

  const canAccess = (screen: Screen): boolean => {
    return canAccessScreen(effectivePermissions, screen);
  };

  return { can, canAccess };
}
