import { useAuthUser } from './useAuthUser';
import { hasPermission, canAccessScreen } from '@/lib/permissions';
import { Screen, Action } from '@/types/auth';

export function usePermission() {
  const { user } = useAuthUser();

  const can = (screen: Screen, action: Action): boolean => {
    if (!user) return false;
    return hasPermission(user.permissions, screen, action);
  };

  const canAccess = (screen: Screen): boolean => {
    if (!user) return false;
    return canAccessScreen(user.permissions, screen);
  };

  return { can, canAccess };
}
