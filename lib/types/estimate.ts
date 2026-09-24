export type EstimateStatus = "Draft" | "Sent" | "Approved" | "Rejected";

export interface EstimateItem {
  id: string;
  estimate_id?: string;
  description: string;
  qty: number;
  quantity?: number; // matches Supabase estimate_items.quantity column
  unit: string; // e.g. 'meter', 'nos', 'sqft', 'set', 'hrs', 'kg', 'lot'
  rate: number; // ₹ per unit
  amount: number; // qty * rate
}

export interface ProjectItemList {
  project_id: string;
  project_number: string;
  customer_name: string;
  project_type?: string;
  address?: string;
  estimate_id?: string;
  estimate_number?: string;
  items: EstimateItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  notes?: string;
  updated_at?: string;
}

export interface Estimate {
  id: string;
  estimate_number: string;
  project_id?: string;
  project_name?: string;
  description?: string;
  terms_conditions?: string;
  items: EstimateItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: EstimateStatus;
  created_at: string;
  updated_at?: string;
}

export const initialSampleEstimates: Estimate[] = [
  {
    id: "est-201",
    estimate_number: "EST-2026-001",
    project_id: "prj-100",
    project_name: "Apex Retail Plaza - Rewiring",
    description: "Full electrical conduit, main distribution board, and LED installation.",
    terms_conditions: "1. 50% advance upon approval.\n2. Balance within 7 days of completion.\n3. Material price valid for 15 days.",
    items: [
      { id: "item-1", description: "Electrical wiring 2.5 sq mm", qty: 100, unit: "meter", rate: 50, amount: 5000 },
      { id: "item-2", description: "Switch & socket installation", qty: 20, unit: "nos", rate: 100, amount: 2000 },
      { id: "item-3", description: "200A Main Breaker Panel", qty: 1, unit: "nos", rate: 8500, amount: 8500 },
    ],
    subtotal: 15500,
    discount: 500,
    tax: 1350,
    total: 16350,
    status: "Sent",
    created_at: "2026-09-10T10:00:00Z",
  },
  {
    id: "est-202",
    estimate_number: "EST-2026-002",
    project_id: "prj-101",
    project_name: "Sarah Jenkins Villa",
    description: "Whole home surge protection & backup generator wiring.",
    terms_conditions: "Standard 30-day quotation validity.",
    items: [
      { id: "item-4", description: "Heavy duty copper cabling", qty: 45, unit: "meter", rate: 120, amount: 5400 },
      { id: "item-5", description: "Automatic Transfer Switch (ATS)", qty: 1, unit: "nos", rate: 6500, amount: 6500 },
    ],
    subtotal: 11900,
    discount: 0,
    tax: 1071,
    total: 12971,
    status: "Approved",
    created_at: "2026-09-12T14:30:00Z",
  },
];
