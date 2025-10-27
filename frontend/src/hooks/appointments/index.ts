import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/api';
import {
  createAppointment,
  getAppointment,
  listAppointments,
  removeAppointment,
  updateAppointment,
} from '../../services/appointmentsService';
import type {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from '../../types/appointment';

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
