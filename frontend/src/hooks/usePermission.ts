import { useMemo } from "react";
import { usePermissions } from "@/contexts/permissionsContext";
import { Screen, PermissionAction } from "@/types/auth";

const CRUD: PermissionAction[] = ["create", "read", "update", "delete"];

export function usePermission() {
  const { permissions, loading } = usePermissions();

  const permMap = useMemo(() => {
    const map = new Map<Screen, Set<PermissionAction>>();
    (permissions ?? []).forEach((p) => {
      map.set(p.screen, new Set(p.actions ?? []));
    });
    return map;
  }, [permissions]);

  const can = (screen: Screen, action: PermissionAction): boolean => {
    if (loading) return false;
    return permMap.get(screen)?.has(action) ?? false;
  };

  const canAccess = (screen: Screen): boolean => {
    if (loading) return false;
    const set = permMap.get(screen);
    if (!set || set.size === 0) return false;
    return CRUD.some((a) => set.has(a));
  };

  const canRead = (screen: Screen): boolean => can(screen, "read");

  return { can, canAccess, canRead };
}
