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

export type Action = 'view' | 'create' | 'edit' | 'delete';

export interface Permission {
  screen: Screen;
  actions: Action[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: Role;
  permissions: Permission[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
