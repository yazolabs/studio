import { api } from './api';
import type { Paginated } from '../types/pagination';
import type {
  CreateProfessionalDto,
  Professional,
  UpdateProfessionalDto,
} from '../types/professional';

type ProfessionalQueryParams = {
  page?: number;
  perPage?: number;
  search?: string;
};

const basePath = '/professionals';

function mapPayload(payload: CreateProfessionalDto | UpdateProfessionalDto) {
  return {
    user_id: payload.user_id,
    phone: payload.phone ?? "",
    specialties: payload.specialties ?? [],
    active: payload.active ?? true,
    work_schedule: payload.work_schedule ?? [],
  };
}

export async function listProfessionals(params?: ProfessionalQueryParams) {
  const { data } = await api.get<Paginated<Professional>>(basePath, { params });
  return data;
}

export async function getProfessional(id: number) {
  const { data } = await api.get<Professional>(`${basePath}/${id}`);
  return data;
}

export async function createProfessional(payload: CreateProfessionalDto) {
  const { data } = await api.post<Professional>(basePath, mapPayload(payload));
  return data;
}

export async function updateProfessional(id: number, payload: UpdateProfessionalDto) {
  const { data } = await api.put<Professional>(`${basePath}/${id}`, mapPayload(payload));
  return data;
}

export async function removeProfessional(id: number) {
  await api.delete(`${basePath}/${id}`);
}
