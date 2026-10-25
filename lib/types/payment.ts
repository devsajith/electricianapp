export type PaymentMethod =
  | "Cash"
  | "GPay"
  | "Account Transfer"
  | "UPI"
  | "Bank Transfer"
  | "Cheque"
  | "Card"
  | "Other";

export interface PaymentProjectSummary {
  id?: string;
  project_number?: string;
  name?: string;
  phone?: string;
  place?: string;
}

export interface Payment {
  id: string;
  project_id: string;
  amount: number;
  payment_info?: string | null;
  method: string;
  payment_date: string;
  created_at?: string;
  projects?: PaymentProjectSummary | null;
}

export interface CreatePaymentDTO {
  project_id: string;
  amount: number;
  payment_date: string;
  method: string;
  payment_info?: string;
}

export const STANDARD_PAYMENT_METHODS = [
  "Cash",
  "GPay",
  "Account Transfer",
] as const;

export type StandardPaymentMethod = (typeof STANDARD_PAYMENT_METHODS)[number];

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; description: string }[] = [
  { id: "Cash", label: "Cash", icon: "Banknote", description: "Direct cash payment" },
  { id: "GPay", label: "GPay", icon: "Smartphone", description: "Google Pay / UPI digital payment" },
  { id: "Account Transfer", label: "Account Transfer", icon: "Building2", description: "Direct bank account wire / NEFT / IMPS" },
];

export const initialSamplePayments: Payment[] = [];
