import api from './api';
import type { User } from '@/types/user';
import type { Paginated } from '@/types/pagination';
import type { CreateUserDto, UpdateUserDto } from '@/types/user';

const basePath = '/users';

export async function listUsers(params?: { page?: number; perPage?: number; search?: string }) {
  const { data } = await api.get<Paginated<User>>(basePath, { params });
  return data;
}

export async function getUser(id: number) {
  const { data } = await api.get<User>(`${basePath}/${id}`);
  return data;
}

export async function createUser(payload: CreateUserDto) {
  const { data } = await api.post<User>(basePath, payload);
  return data;
}

export async function updateUser(id: number, payload: UpdateUserDto) {
  const { data } = await api.put<User>(`${basePath}/${id}`, payload);
  return data;
}

export async function deleteUser(id: number) {
  await api.delete(`${basePath}/${id}`);
}
