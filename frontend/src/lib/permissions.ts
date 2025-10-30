import { Role, Permission, PermissionAction, Screen } from '@/types/auth';

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
  const screenPermissions = permissions.filter((p) => p.screen === screen);

  if (screenPermissions.length === 0) {
    console.warn(`No permissions found for screen: ${screen}`);
    return false;
  }

  const hasActionPermission = screenPermissions.some((p) =>
    p.actions.includes(action)
  );

  if (!hasActionPermission) {
    console.warn(`No action ${action} found for screen: ${screen}`);
  }

  return hasActionPermission;
}

export function canAccessScreen(permissions: Permission[], screen: Screen): boolean {
  console.log("Checking permissions for screen:", screen);

  const screenPermissions = permissions.filter((p) => p.screen === screen);
  console.log("Permissions available for screen:", screen, screenPermissions);

  return screenPermissions.length > 0;
}
