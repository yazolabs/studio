export type ProfessionalOpenWindowStatus = "open" | "closed";

export type ProfessionalOpenWindow = {
  id: number;
  professional_id: number;
  start_date: string;
  end_date: string;
  status: ProfessionalOpenWindowStatus;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateProfessionalOpenWindowDto = {
  professional_id: number;
  start_date: string;
  end_date: string;
};

export type UpdateProfessionalOpenWindowDto = {
  start_date?: string;
  end_date?: string;
  status?: ProfessionalOpenWindowStatus;
};
