import { Role, Permission, Action, Screen } from '@/types/auth';

// RBAC Configuration - Define permissions by role
export const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    { screen: 'dashboard', actions: ['view'] },
    { screen: 'customers', actions: ['view', 'create', 'edit', 'delete'] },
    { screen: 'users', actions: ['view', 'create', 'edit', 'delete'] },
    { screen: 'services', actions: ['view', 'create', 'edit', 'delete'] },
    { screen: 'professionals', actions: ['view', 'create', 'edit', 'delete'] },
    { screen: 'items', actions: ['view', 'create', 'edit', 'delete'] },
    { screen: 'appointments', actions: ['view', 'create', 'edit', 'delete'] },
    { screen: 'cashier', actions: ['view'] },
    { screen: 'suppliers', actions: ['view', 'create', 'edit', 'delete'] },
    { screen: 'accounts-payable', actions: ['view', 'create', 'edit', 'delete'] },
    { screen: 'commissions', actions: ['view'] },
    { screen: 'item-prices', actions: ['view', 'create', 'edit', 'delete'] },
    { screen: 'item-price-histories', actions: ['view'] },
    { screen: 'promotions', actions: ['view', 'create', 'edit', 'delete'] },
  ],
  manager: [
    { screen: 'dashboard', actions: ['view'] },
    { screen: 'customers', actions: ['view', 'create', 'edit'] },
    { screen: 'services', actions: ['view', 'create', 'edit'] },
    { screen: 'professionals', actions: ['view', 'create', 'edit'] },
    { screen: 'items', actions: ['view', 'create', 'edit'] },
    { screen: 'appointments', actions: ['view', 'create', 'edit', 'delete'] },
    { screen: 'cashier', actions: ['view'] },
    { screen: 'suppliers', actions: ['view', 'create', 'edit'] },
    { screen: 'accounts-payable', actions: ['view', 'create', 'edit'] },
    { screen: 'commissions', actions: ['view'] },
    { screen: 'item-prices', actions: ['view', 'edit'] },
    { screen: 'item-price-histories', actions: ['view'] },
    { screen: 'promotions', actions: ['view', 'create', 'edit'] },
  ],
  professional: [
    { screen: 'dashboard', actions: ['view'] },
    { screen: 'customers', actions: ['view'] },
    { screen: 'services', actions: ['view'] },
    { screen: 'professionals', actions: ['view'] },
    { screen: 'appointments', actions: ['view', 'edit'] },
  ],
  receptionist: [
    { screen: 'dashboard', actions: ['view'] },
    { screen: 'customers', actions: ['view', 'create', 'edit'] },
    { screen: 'appointments', actions: ['view', 'create', 'edit'] },
    { screen: 'services', actions: ['view'] },
    { screen: 'professionals', actions: ['view'] },
  ],
};

export function getUserPermissions(role: Role): Permission[] {
  return rolePermissions[role] || [];
}

export function hasPermission(
  permissions: Permission[],
  screen: Screen,
  action: Action
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
