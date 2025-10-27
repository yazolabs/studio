import { Role, Permission, PermissionAction, Screen } from '@/types/auth';

// RBAC Configuration - Define permissions by role (fallback/default)
export const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    { screen: 'dashboard', actions: ['read'] },
    { screen: 'customers', actions: ['read', 'create', 'update', 'delete'] },
    { screen: 'users', actions: ['read', 'create', 'update', 'delete'] },
    { screen: 'services', actions: ['read', 'create', 'update', 'delete'] },
    { screen: 'professionals', actions: ['read', 'create', 'update', 'delete'] },
    { screen: 'items', actions: ['read', 'create', 'update', 'delete'] },
    { screen: 'appointments', actions: ['read', 'create', 'update', 'delete'] },
    { screen: 'cashier', actions: ['read'] },
    { screen: 'suppliers', actions: ['read', 'create', 'update', 'delete'] },
    { screen: 'accounts-payable', actions: ['read', 'create', 'update', 'delete'] },
    { screen: 'commissions', actions: ['read'] },
    { screen: 'item-prices', actions: ['read', 'create', 'update', 'delete'] },
    { screen: 'item-price-histories', actions: ['read'] },
    { screen: 'promotions', actions: ['read', 'create', 'update', 'delete'] },
  ],
  manager: [
    { screen: 'dashboard', actions: ['read'] },
    { screen: 'customers', actions: ['read', 'create', 'update'] },
    { screen: 'services', actions: ['read', 'create', 'update'] },
    { screen: 'professionals', actions: ['read', 'create', 'update'] },
    { screen: 'items', actions: ['read', 'create', 'update'] },
    { screen: 'appointments', actions: ['read', 'create', 'update', 'delete'] },
    { screen: 'cashier', actions: ['read'] },
    { screen: 'suppliers', actions: ['read', 'create', 'update'] },
    { screen: 'accounts-payable', actions: ['read', 'create', 'update'] },
    { screen: 'commissions', actions: ['read'] },
    { screen: 'item-prices', actions: ['read', 'update'] },
    { screen: 'item-price-histories', actions: ['read'] },
    { screen: 'promotions', actions: ['read', 'create', 'update'] },
  ],
  professional: [
    { screen: 'dashboard', actions: ['read'] },
    { screen: 'customers', actions: ['read'] },
    { screen: 'services', actions: ['read'] },
    { screen: 'professionals', actions: ['read'] },
    { screen: 'appointments', actions: ['read', 'update'] },
  ],
  receptionist: [
    { screen: 'dashboard', actions: ['read'] },
    { screen: 'customers', actions: ['read', 'create', 'update'] },
    { screen: 'appointments', actions: ['read', 'create', 'update'] },
    { screen: 'services', actions: ['read'] },
    { screen: 'professionals', actions: ['read'] },
  ],
};

export function getUserPermissions(role: Role): Permission[] {
  return rolePermissions[role] || [];
}

export function hasPermission(
  permissions: Permission[],
  screen: Screen,
  action: PermissionAction
): boolean {
  const screenPermission = permissions.find((p) => p.screen === screen);
  return screenPermission?.actions.includes(action) ?? false;
}

export function canAccessScreen(
  permissions: Permission[],
  screen: Screen
): boolean {
  return permissions.some((p) => p.screen === screen && p.actions.length > 0);
}
