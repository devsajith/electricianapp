export type ExpenseType = "project" | "self";

export type ExpenseCategory =
  | "Emergency Material"
  | "Travel & Fuel"
  | "Equipment & Tools"
  | "Food & Refreshment"
  | "Office & Shop"
  | "Vehicle & Maintenance"
  | "Personal / Self Draw"
  | "Permits & Fees"
  | "Labour / Helper"
  | "Miscellaneous";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Emergency Material",
  "Travel & Fuel",
  "Equipment & Tools",
  "Food & Refreshment",
  "Office & Shop",
  "Vehicle & Maintenance",
  "Personal / Self Draw",
  "Permits & Fees",
  "Labour / Helper",
  "Miscellaneous",
];

export interface Expense {
  id: string;
  expense_type?: ExpenseType; // "project" or "self" (default: "project" if project_id exists)
  project_id?: string | null;
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
  expense_type?: ExpenseType;
  project_id?: string | null;
  category: string;
  description: string;
  amount: number;
  expense_date?: string;
  receipt_url?: string | null;
}

export const initialSampleExpenses: Expense[] = [
  {
    id: "exp-101",
    expense_type: "project",
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
    expense_type: "project",
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
    expense_type: "project",
    project_id: "sample-2",
    project_number: "PRJ-482019",
    customer_name: "Sarah Jenkins",
    category: "Equipment & Tools",
    description: "Rotary hammer drill bit replacement and wall chasing blade",
    amount: 1200,
    expense_date: "2026-09-05",
    created_at: "2026-09-05T09:15:00Z",
  },
  {
    id: "exp-104",
    expense_type: "self",
    project_id: null,
    category: "Office & Shop",
    description: "Shop electricity bill and workshop lighting repair",
    amount: 1450,
    expense_date: "2026-09-10",
    created_at: "2026-09-10T10:00:00Z",
  },
  {
    id: "exp-105",
    expense_type: "self",
    project_id: null,
    category: "Vehicle & Maintenance",
    description: "Monthly diesel refill for service van & bike maintenance",
    amount: 2200,
    expense_date: "2026-09-14",
    created_at: "2026-09-14T16:00:00Z",
  },
  {
    id: "exp-106",
    expense_type: "self",
    project_id: null,
    category: "Food & Refreshment",
    description: "Weekly tea, snacks, and drinking water for crew at workshop",
    amount: 480,
    expense_date: "2026-09-16",
    created_at: "2026-09-16T17:30:00Z",
  },
];
