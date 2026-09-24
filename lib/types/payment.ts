export type PaymentMethod =
  | "UPI"
  | "Cash"
  | "Bank Transfer"
  | "Cheque"
  | "Card"
  | "Other";

export type PaymentType =
  | "Advance"
  | "Milestone"
  | "Final Settlement"
  | "Retention"
  | "Full Payment";

export interface PaymentProjectSummary {
  id?: string;
  project_number?: string;
  customer_name?: string;
  customer_phone?: string;
}

export interface Payment {
  id: string;
  project_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod | string;
  payment_type: PaymentType | string;
  reference_number?: string | null;
  notes?: string | null;
  receipt_url?: string | null;
  created_at?: string;
  updated_at?: string;
  projects?: PaymentProjectSummary | null;
}

export interface CreatePaymentDTO {
  project_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod | string;
  payment_type: PaymentType | string;
  reference_number?: string;
  notes?: string;
  receipt_url?: string;
}

export const PAYMENT_TYPES: { id: PaymentType; label: string; description: string }[] = [
  { id: "Advance", label: "Advance Deposit", description: "Initial booking / material advance" },
  { id: "Milestone", label: "Milestone Stage", description: "Progress payment for completed stage" },
  { id: "Final Settlement", label: "Final Settlement", description: "Handover & final bill clearance" },
  { id: "Retention", label: "Retention / Warranty", description: "Defect liability / retention release" },
  { id: "Full Payment", label: "Full Payment", description: "Single full payment for project" },
];

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; description: string }[] = [
  { id: "UPI", label: "UPI / GPay / PhonePe", icon: "Smartphone", description: "Instant digital payment" },
  { id: "Cash", label: "Cash", icon: "Banknote", description: "Direct cash payment" },
  { id: "Bank Transfer", label: "Bank Transfer (NEFT/IMPS)", icon: "Building2", description: "Direct account wire" },
  { id: "Cheque", label: "Cheque", icon: "FileText", description: "Bank cheque clearance" },
  { id: "Card", label: "Credit / Debit Card", icon: "CreditCard", description: "Card swipe / POS" },
  { id: "Other", label: "Other", icon: "MoreHorizontal", description: "Other custom arrangement" },
];

export const PAYMENT_MILESTONES = [
  "Advance Booking (20%)",
  "Rough-in / Conduiting Stage (30%)",
  "Wiring & Distribution Board (30%)",
  "Switchgear & Fixtures (15%)",
  "Final Testing & Handover (5%)",
  "Full Settlement",
];

export const initialSamplePayments: Payment[] = [
  {
    id: "sample-pay-1",
    project_id: "sample-1",
    amount: 15000,
    payment_date: "2026-09-18",
    payment_method: "UPI",
    payment_type: "Advance",
    reference_number: "UPI/328491028471",
    notes: "Advance booking deposit (20%)",
    projects: {
      id: "sample-1",
      project_number: "PRJ-2026-001",
      customer_name: "Apex Retail Plaza",
      customer_phone: "+91 98450 11223",
    },
  },
  {
    id: "sample-pay-2",
    project_id: "sample-1",
    amount: 25000,
    payment_date: "2026-09-20",
    payment_method: "Bank Transfer",
    payment_type: "Milestone",
    reference_number: "NEFT-HDFC-992819",
    notes: "Conduit & rough-in completion stage",
    projects: {
      id: "sample-1",
      project_number: "PRJ-2026-001",
      customer_name: "Apex Retail Plaza",
      customer_phone: "+91 98450 11223",
    },
  },
  {
    id: "sample-pay-3",
    project_id: "sample-2",
    amount: 8000,
    payment_date: "2026-09-15",
    payment_method: "Cash",
    payment_type: "Advance",
    reference_number: "CASH-REC-004",
    notes: "Initial advance for residential flat rewire",
    projects: {
      id: "sample-2",
      project_number: "PRJ-2026-002",
      customer_name: "Sarah Jenkins",
      customer_phone: "+91 97412 88392",
    },
  },
  {
    id: "sample-pay-4",
    project_id: "sample-3",
    amount: 12500,
    payment_date: "2026-09-19",
    payment_method: "Cheque",
    payment_type: "Milestone",
    reference_number: "CHQ-SBIN-440192",
    notes: "Main DB & panel replacement 50% milestone",
    projects: {
      id: "sample-3",
      project_number: "PRJ-2026-003",
      customer_name: "Marcus Vance",
      customer_phone: "+91 94480 33441",
    },
  },
];
