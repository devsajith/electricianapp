export type ExpenseCategory =
  | "Emergency Material"
  | "Travel & Fuel"
  | "Equipment & Tools"
  | "Food & Refreshment"
  | "Permits & Fees"
  | "Labour / Helper"
  | "Miscellaneous";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Emergency Material",
  "Travel & Fuel",
  "Equipment & Tools",
  "Food & Refreshment",
  "Permits & Fees",
  "Labour / Helper",
  "Miscellaneous",
];

export interface Expense {
  id: string;
  project_id: string;
  project_number?: string;
  customer_name?: string;
  project_type?: string;
  category: ExpenseCategory | string;
  description: string;
  amount: number; // in ₹
  expense_date: string; // YYYY-MM-DD
  receipt_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateExpenseDTO {
  project_id: string;
  category: string;
  description: string;
  amount: number;
  expense_date?: string;
  receipt_url?: string | null;
}

export const initialSampleExpenses: Expense[] = [
  {
    id: "exp-101",
    project_id: "sample-1",
    project_number: "PRJ-918234",
    customer_name: "Apex Retail Plaza",
    category: "Emergency Material",
    description: "Bought extra 25m heavy PVC conduit & elbow bends from nearby hardware store",
    amount: 850,
    expense_date: "2026-09-12",
    created_at: "2026-09-12T11:00:00Z",
  },
  {
    id: "exp-102",
    project_id: "sample-1",
    project_number: "PRJ-918234",
    customer_name: "Apex Retail Plaza",
    category: "Travel & Fuel",
    description: "Emergency auto delivery for heavy distribution board",
    amount: 350,
    expense_date: "2026-09-13",
    created_at: "2026-09-13T14:30:00Z",
  },
  {
    id: "exp-103",
    project_id: "sample-2",
    project_number: "PRJ-482019",
    customer_name: "Sarah Jenkins",
    category: "Equipment & Tools",
    description: "Rotary hammer drill bit replacement and wall chasing blade",
    amount: 1200,
    expense_date: "2026-09-05",
    created_at: "2026-09-05T09:15:00Z",
  },
];
