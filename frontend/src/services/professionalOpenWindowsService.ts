import { api } from "./api";
import type { ProfessionalOpenWindow, CreateProfessionalOpenWindowDto, UpdateProfessionalOpenWindowDto } from "@/types/professional-open-window";

const basePath = "/professional-open-windows";

export type ListProfessionalOpenWindowsParams = {
  professional_id?: number;
  status?: "open" | "closed";
};

export async function listProfessionalOpenWindows(
  params?: ListProfessionalOpenWindowsParams
) {
  const { data } = await api.get<{ data: ProfessionalOpenWindow[] }>(basePath, {
    params,
  });

  return data.data ?? [];
}

export async function createProfessionalOpenWindow(
  payload: CreateProfessionalOpenWindowDto
) {
  const { data } = await api.post<ProfessionalOpenWindow>(basePath, payload);
  return data;
}

export async function updateProfessionalOpenWindow(
  id: number,
  payload: UpdateProfessionalOpenWindowDto
) {
  const { data } = await api.put<ProfessionalOpenWindow>(
    `${basePath}/${id}`,
    payload
  );
  return data;
}

export async function closeProfessionalOpenWindow(id: number) {
  const { data } = await api.patch<ProfessionalOpenWindow>(
    `${basePath}/${id}/close`
  );
  return data;
}

export async function removeProfessionalOpenWindow(id: number) {
  await api.delete(`${basePath}/${id}`);
}
