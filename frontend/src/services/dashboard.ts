// src/services/dashboard.ts
import api from "@/services/api";

export interface DashboardSummary {
  total_customers: number;
  customers_change_percent: number | null;
  appointments_today: number;
  pending_appointments: number;
  active_services: number;
  service_categories: number;
  month_revenue: number;
  revenue_change_percent: number | null;
}

export interface ApiProfessionalScheduleDay {
  day: string;          // "Segunda-feira"
  startTime: string;    // "08:00"
  endTime: string;      // "18:00"
  lunchStart: string;   // "12:00"
  lunchEnd: string;     // "13:00"
  isWorkingDay: boolean;
  isDayOff: boolean;
}

export interface ApiProfessional {
  id: number;
  name: string | null;
  specialties: string[] | null;
  work_schedule: ApiProfessionalScheduleDay[] | null;
  todays_appointments: {
    id: number;
    time: string;
    customer_name: string | null;
    service_name: string | null;
    status: "scheduled" | "in-progress" | "completed";
  }[];
}

export interface ApiPromotion {
  id: number;
  name: string;
  type: "discount" | "package" | "loyalty";
  discount: number;
  usage: number;
  target: number;
  revenue: number;
  status: "active" | "scheduled" | "expired";
  endDate: string | null;
}

export interface ProfessionalsScheduleResponse {
  date: string;
  data: ApiProfessional[];
}

export interface RecentAppointment {
  id: number;
  customer_name: string | null;
  service_name: string | null;
  time: string;
  date: string;
}

export interface PopularService {
  id: number;
  name: string;
  count: number;
  percentage: number;
}

export async function getDashboardSummary() {
  const { data } = await api.get<DashboardSummary>("/dashboard/summary");
  return data;
}

export async function getProfessionalsSchedule(date: string) {
  const { data } = await api.get<ProfessionalsScheduleResponse>(
    "/dashboard/professionals-schedule",
    { params: { date } }
  );
  return data;
}

export async function getRecentAppointments() {
  const { data } = await api.get<RecentAppointment[]>("/dashboard/recent-appointments");
  return data;
}

export async function getPopularServices() {
  const { data } = await api.get<PopularService[]>("/dashboard/popular-services");
  return data;
}

export async function getDashboardPromotions() {
  const { data } = await api.get<ApiPromotion[]>("/dashboard/promotions");
  return data;
}