import type { Role } from './role';

export interface User {
  id: number;
  name: string;
  username: string;
  email: string | null;
  email_verified_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  roles?: Role[];
}

export interface CreateUserDto {
  name: string;
  username: string;
  email?: string | null;
  password: string;
  roles?: number[];
}

export interface UpdateUserDto {
  name?: string;
  username?: string;
  email?: string | null;
  password?: string;
  roles?: number[];
}
