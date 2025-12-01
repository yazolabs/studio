import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProfessionalOpenWindows, createProfessionalOpenWindow, updateProfessionalOpenWindow, closeProfessionalOpenWindow, removeProfessionalOpenWindow, ListProfessionalOpenWindowsParams } from "@/services/professionalOpenWindowsService";
import type { ProfessionalOpenWindow, CreateProfessionalOpenWindowDto, UpdateProfessionalOpenWindowDto } from "@/types/professional-open-window";
import { toast } from "sonner";

export function useProfessionalOpenWindows(
  professionalId?: number,
  options?: {
    status?: "open" | "closed" | "all";
    enabled?: boolean;
  }
) {
  const { status = "open", enabled = true } = options ?? {};

  const params: ListProfessionalOpenWindowsParams = {
    professional_id: professionalId,
    status: status === "all" ? undefined : status,
  };

  return useQuery<ProfessionalOpenWindow[]>({
    queryKey: ["professional-open-windows", professionalId, status],
    queryFn: () => listProfessionalOpenWindows(params),
    enabled: !!professionalId && enabled,
  });
}

export function useCreateProfessionalOpenWindow() {
  const queryClient = useQueryClient();

  return useMutation<
    ProfessionalOpenWindow,
    unknown,
    CreateProfessionalOpenWindowDto
  >({
    mutationFn: createProfessionalOpenWindow,
    onSuccess: (data, variables) => {
      toast.success("Janela de agenda adicionada com sucesso!");
      queryClient.invalidateQueries({
        queryKey: ["professional-open-windows", variables.professional_id],
      });
    },
    onError: () => {
      toast.error("Erro ao adicionar janela de agenda.");
    },
  });
}

export function useUpdateProfessionalOpenWindow() {
  const queryClient = useQueryClient();

  return useMutation<
    ProfessionalOpenWindow,
    unknown,
    {
      id: number;
      payload: UpdateProfessionalOpenWindowDto;
      professional_id: number;
    }
  >({
    mutationFn: ({ id, payload }) => updateProfessionalOpenWindow(id, payload),
    onSuccess: (data, variables) => {
      toast.success("Janela de agenda atualizada com sucesso!");
      queryClient.invalidateQueries({
        queryKey: ["professional-open-windows", variables.professional_id],
      });
    },
    onError: () => {
      toast.error("Erro ao atualizar janela de agenda.");
    },
  });
}

export function useCloseProfessionalOpenWindow() {
  const queryClient = useQueryClient();

  return useMutation<
    ProfessionalOpenWindow,
    unknown,
    { id: number; professional_id: number }
  >({
    mutationFn: ({ id }) => closeProfessionalOpenWindow(id),
    onSuccess: (data, variables) => {
      toast.success("Janela de agenda fechada com sucesso.");
      queryClient.invalidateQueries({
        queryKey: ["professional-open-windows", variables.professional_id],
      });
    },
    onError: () => {
      toast.error("Erro ao fechar janela de agenda.");
    },
  });
}

export function useDeleteProfessionalOpenWindow() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, { id: number; professional_id: number }>({
    mutationFn: ({ id }) => removeProfessionalOpenWindow(id),
    onSuccess: (_data, variables) => {
      toast.success("Janela de agenda removida com sucesso.");
      queryClient.invalidateQueries({
        queryKey: ["professional-open-windows", variables.professional_id],
      });
    },
    onError: () => {
      toast.error("Erro ao remover janela de agenda.");
    },
  });
}
