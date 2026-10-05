export type ExpenseType = "project" | "self";

export interface Expense {
  id: string;
  type: ExpenseType;
  project_id?: string | null;
  project_number?: string;
  name?: string; // joined project name
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  labour_log_id?: string | null;
  created_at?: string;
}

export interface CreateExpenseDTO {
  type?: ExpenseType;
  project_id?: string | null;
  amount: number;
  description: string;
  date?: string;
  labour_log_id?: string | null;
}

export const initialSampleExpenses: Expense[] = [];
