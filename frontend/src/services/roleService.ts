import api from './api';
import type { Role } from '@/types/role';

export async function listRoles() {
  const { data } = await api.get<Role[]>('/roles');
  return data;
}
