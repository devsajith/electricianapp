export type QuotationStatus = "Draft" | "Sent" | "Approved" | "Rejected";

export interface Quotation {
  id: string;
  quotation_number: string;
  client_name: string;
  client_phone?: string | null;
  client_place?: string | null;
  unit: string;
  rate: number;
  description?: string | null;
  terms?: string | null;
  status: QuotationStatus;
  created_at: string;
  updated_at?: string;
}

export interface CreateQuotationDTO {
  quotation_number?: string;
  client_name: string;
  client_phone?: string | null;
  client_place?: string | null;
  unit?: string;
  rate: number;
  description?: string | null;
  terms?: string | null;
  status?: string;
}

export const initialSampleQuotations: Quotation[] = [];
