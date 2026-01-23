import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../services/api";
import { createAppointment, getAppointment, listAppointments, removeAppointment, updateAppointment, checkoutAppointment, prepayAppointment, type CheckoutAppointmentDto, type PrepayAppointmentDto } from "../../services/appointmentsService";
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from "../../types/appointment";
import { toast } from "sonner";

export function useAppointmentsQuery(params?: Parameters<typeof listAppointments>[0]) {
  return useQuery({
    queryKey: [queryKeys.appointments[0], params],
    queryFn: () => listAppointments(params),
  });
}

export function useAppointmentQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: [queryKeys.appointments[0], id],
    queryFn: () => getAppointment(id),
    enabled,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation<Appointment, unknown, CreateAppointmentDto>({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
    },
  });
}

export function useUpdateAppointment(id: number) {
  const queryClient = useQueryClient();
  return useMutation<Appointment, unknown, UpdateAppointmentDto>({
    mutationFn: (payload) => updateAppointment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
      queryClient.invalidateQueries({ queryKey: [queryKeys.appointments[0], id] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => removeAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
    },
  });
}

export function useAppointmentCheckout() {
  const queryClient = useQueryClient();

  return useMutation<
    Appointment,
    unknown,
    { appointmentId: number; payload: CheckoutAppointmentDto }
  >({
    mutationFn: async ({ appointmentId, payload }) => {
      if (!appointmentId) throw new Error("Agendamento inválido.");
      return checkoutAppointment(appointmentId, payload);
    },

    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.appointments[0], vars.appointmentId],
      });
      toast.success("Atendimento finalizado com sucesso!");
    },

    onError: (err: any) => {
      console.error(err);
      toast.error("Erro ao finalizar atendimento.");
    },
  });
}

export function useAppointmentPrepay() {
  const queryClient = useQueryClient();

  return useMutation<
    Appointment,
    unknown,
    { appointmentId: number; payload: PrepayAppointmentDto }
  >({
    mutationFn: async ({ appointmentId, payload }) => {
      if (!appointmentId) throw new Error("Agendamento inválido.");
      return prepayAppointment(appointmentId, payload);
    },

    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.appointments[0], vars.appointmentId],
      });
      toast.success("Pagamento antecipado registrado com sucesso!");
    },

    onError: (err: any) => {
      console.error(err);
      toast.error("Erro ao registrar pagamento antecipado.");
    },
  });
}
