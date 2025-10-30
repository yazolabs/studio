import { usePermissions } from '@/contexts/permissionsContext';
import { Screen, PermissionAction } from '@/types/auth';

export function usePermission() {
  const { permissions, loading } = usePermissions();

  const can = (screen: Screen, action: PermissionAction): boolean => {
    if (loading) {
      return false;
    }
    return permissions?.some((permission) => permission.screen === screen && permission.actions.includes(action)) || false;
  };

  const canAccess = (screen: Screen): boolean => {
    if (loading) {
      return false;
    }
    return permissions?.some((permission) => permission.screen === screen) || false;
  };

  return { can, canAccess };
}
