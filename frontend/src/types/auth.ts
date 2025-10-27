export type Role = 'admin' | 'manager' | 'professional' | 'receptionist';

export type Screen =
  | 'dashboard'
  | 'users'
  | 'services'
  | 'professionals'
  | 'items'
  | 'appointments'
  | 'cashier'
  | 'item-prices'
  | 'item-price-histories'
  | 'promotions'
  | 'customers'
  | 'suppliers'
  | 'accounts-payable'
  | 'commissions';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete';

export interface Permission {
  screen: Screen;
  actions: PermissionAction[];
}

export interface UserRole {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  username: string;
  role: Role | null;
  roles: UserRole[];
  permissions: Permission[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
