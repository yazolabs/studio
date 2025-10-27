export type AppointmentServiceItem = {
  id: number;
  name: string;
  servicePrice: string;
  commissionType: 'percentage' | 'fixed' | null;
  commissionValue: string;
  professionalId: number | null;
};

export type Appointment = {
  id: number;
  customer: { id: number; name: string } | null;
  professional: { id: number; name: string } | null;
  services?: AppointmentServiceItem[] | null;
  date: string | null;
  time: string | null;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice: string;
  discountAmount: string;
  finalPrice: string;
  paymentMethod: string | null;
  promotion: { id: number; name: string } | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateAppointmentDto = {
  customerId: number;
  professionalId: number;
  date: string;
  startTime: string;
  status: Appointment['status'];
  totalPrice: string;
  discountAmount: string;
  finalPrice: string;
  paymentMethod?: string | null;
  promotionId?: number | null;
  notes?: string | null;
  services?: Array<{
    id: number;
    servicePrice: string;
    commissionType?: 'percentage' | 'fixed' | null;
    commissionValue?: string;
    professionalId?: number | null;
  }>;
};

export type UpdateAppointmentDto = Partial<CreateAppointmentDto>;
