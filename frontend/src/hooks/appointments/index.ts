import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../services/api";
import { createAppointment, getAppointment, listAppointments, removeAppointment, updateAppointment } from "../../services/appointmentsService";
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from "../../types/appointment";
import { useCreateCommission } from "../commissions";
import { useCreateAccountPayable } from "../accounts-payable";
import { toast } from "sonner";

export function useAppointmentsQuery(
  params?: Parameters<typeof listAppointments>[0]
) {
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
      queryClient.invalidateQueries({
        queryKey: [queryKeys.appointments[0], id],
      });
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
  const { mutateAsync: createCommission } = useCreateCommission();
  const { mutateAsync: createAccountPayable } = useCreateAccountPayable();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointment,
      services,
      products,
      formValues,
    }: {
      appointment: {
        id: number;
        customer?: { id: number; name: string } | null;
      };
      services: Array<{
        id: number;
        name: string;
        price: number;
        professional_id: number | null;
        commission_type: string;
        commission_value: number;
      }>;
      products: Array<{ id: number; price: number; quantity: number }>;
      formValues: {
        discount: number;
        paymentMethod: string;
        cardBrand?: string;
        installments?: number;
        installmentFee?: number;
        promotionId?: number | null;
      };
    }) => {
      if (!appointment?.id) throw new Error("Agendamento inválido.");

      const now = new Date();
      const totalServices = services.reduce((sum, s) => sum + s.price, 0);
      const totalProducts = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
      const totalPrice = totalServices + totalProducts;
      const discountPercent = formValues.discount ?? 0;
      const installmentFeePercent = formValues.installmentFee ?? 0;
      const isCredit = formValues.paymentMethod === "credit";
      const installments = formValues.installments ?? 1;

      let discounted = totalPrice - (totalPrice * discountPercent) / 100;

      if (isCredit && installments > 1) {
        discounted += (discounted * installmentFeePercent) / 100;
      }

      const finalPrice = discounted.toFixed(2);

      const payload: Partial<CreateAppointmentDto> = {
        status: "completed" as const,
        end_time: now.toTimeString().slice(0, 8),
        total_price: totalPrice.toFixed(2),
        discount_amount: discountPercent.toFixed(2),
        final_price: finalPrice,
        payment_method: formValues.paymentMethod,
        card_brand: formValues.cardBrand ?? null,
        installments,
        installment_fee: installmentFeePercent.toFixed(2),
        promotion_id: formValues.promotionId ?? null,

        services: services.map((s) => ({
          id: s.id,
          service_price: s.price.toFixed(2),
          commission_type: s.commission_type,
          commission_value: s.commission_value.toString(),
          professional_id: s.professional_id,
        })),

        items: products.map((p) => ({
          id: p.id,
          price: p.price.toFixed(2),
          quantity: p.quantity,
        })),
      };

      await updateAppointment(appointment.id, payload);

      const commissionsPayload: any[] = [];
      const accountsPayload: any[] = [];

      for (const service of services) {
        if (!service.professional_id) continue;

        const commissionAmount =
          service.commission_type === "percentage"
            ? (service.price * service.commission_value) / 100
            : service.commission_value;

        const commissionDto = {
          professional_id: service.professional_id,
          appointment_id: appointment.id,
          service_id: service.id,
          customer_id: appointment.customer?.id ?? null,
          date: new Date().toISOString().split("T")[0],
          service_price: service.price,
          commission_type: service.commission_type,
          commission_value: service.commission_value,
          commission_amount: commissionAmount,
          status: "pending",
        };

        const accountDto = {
          description: `Comissão - ${service.name}`,
          amount: commissionAmount,
          due_date: new Date().toISOString().split("T")[0],
          status: "pending",
          category: "Comissão",
          professional_id: service.professional_id,
          appointment_id: appointment.id,
          notes: `Cliente: ${appointment.customer?.name ?? "N/A"}\nServiço: ${
            service.name
          }\nValor do Serviço: R$ ${service.price.toFixed(2)}`,
        };

        commissionsPayload.push(commissionDto);
        accountsPayload.push(accountDto);
      }

      await Promise.all([
        ...commissionsPayload.map((c) => createCommission(c)),
        ...accountsPayload.map((a) => createAccountPayable(a)),
      ]);

      queryClient.invalidateQueries({ queryKey: ["appointments"] });

      const totalCommissions = commissionsPayload.reduce(
        (sum, c) => sum + Number(c.commission_amount),
        0
      );

      return {
        totalCommissions,
        commissionCount: commissionsPayload.length,
      };
    },

    onSuccess: ({ totalCommissions, commissionCount }) => {
      toast.success(
        `Atendimento finalizado com sucesso!\n` +
          `Comissões geradas: R$ ${totalCommissions.toFixed(
            2
          )} (${commissionCount} conta${
            commissionCount > 1 ? "s" : ""
          } a pagar)`
      );
    },

    onError: (err: any) => {
      console.error(err);
      toast.error(
        "Erro ao finalizar atendimento. Verifique os dados e tente novamente."
      );
    },
  });
}
