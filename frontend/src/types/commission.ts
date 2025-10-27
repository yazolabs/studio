export type Commission = {
  id: number;
  professional: { id: number; name: string } | null;
  customer: { id: number; name: string } | null;
  service: { id: number; name: string } | null;
  appointmentId: number;
  date: string | null;
  servicePrice: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: string;
  commissionAmount: string;
  status: 'pending' | 'paid';
  paymentDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateCommissionDto = {
  professionalId: number;
  appointmentId: number;
  serviceId: number;
  customerId: number;
  date: string;
  servicePrice: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: string;
  commissionAmount: string;
  status: 'pending' | 'paid';
  paymentDate?: string | null;
};

export type UpdateCommissionDto = Partial<CreateCommissionDto>;
