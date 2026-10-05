import { createClient } from "@/lib/supabase/server";
import { Expense, CreateExpenseDTO } from "@/lib/types/expense";
import { withTimeout } from "@/lib/timeout";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidUUID = (id?: string | null): boolean =>
  typeof id === "string" && UUID_REGEX.test(id.trim());

interface ExpenseDbRow {
  id: string | number;
  type: Expense["type"];
  project_id?: string | null;
  projects?: {
    project_number?: string;
    name?: string;
  } | null;
  amount: number | string;
  description: string;
  date: string;
  labour_log_id?: string | null;
  created_at?: string;
}

// Columns guaranteed to exist in the database
const EXPENSE_WITH_PROJECT_COLUMNS =
  "id, type, project_id, amount, description, date, created_at, projects(project_number, name)";

const EXPENSE_SIMPLE_COLUMNS =
  "id, type, project_id, amount, description, date, created_at";

export async function getExpensesService(): Promise<{ data: Expense[]; error?: string }> {
  return withTimeout(
    (async () => {
      try {
        const supabase = await createClient();

        const { data, error } = await supabase
          .from("expenses")
          .select(EXPENSE_WITH_PROJECT_COLUMNS)
          .order("date", { ascending: false });

        if (error) {
          console.error("Error fetching expenses:", error.message || error);
          return { data: [], error: error.message };
        }

        const formattedData: Expense[] = ((data as unknown as ExpenseDbRow[]) || []).map((row) => ({
          id: String(row.id),
          type: row.type,
          project_id: row.project_id,
          project_number: row.projects?.project_number,
          name: row.projects?.name,
          amount: Number(row.amount) || 0,
          description: row.description,
          date: row.date,
          labour_log_id: row.labour_log_id || null,
          created_at: row.created_at,
        }));

        return { data: formattedData };
      } catch (error) {
        console.error("Service error (getExpenses):", error);
        return { data: [], error: error instanceof Error ? error.message : "Internal server error" };
      }
    })(),
    { data: [], error: "timeout" },
    2500
  );
}

export async function getExpensesByProjectIdService(
  projectId: string
): Promise<{ data: Expense[]; error?: string }> {
  try {
    if (!isValidUUID(projectId)) {
      return { data: [], error: "Invalid project ID format." };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("expenses")
      .select(EXPENSE_SIMPLE_COLUMNS)
      .eq("project_id", projectId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching project expenses:", error);
      return { data: [], error: error.message };
    }

    const formattedData: Expense[] = ((data as unknown as ExpenseDbRow[]) || []).map((row) => ({
      id: String(row.id),
      type: row.type,
      project_id: row.project_id,
      amount: Number(row.amount) || 0,
      description: row.description,
      date: row.date,
      labour_log_id: row.labour_log_id || null,
      created_at: row.created_at,
    }));

    return { data: formattedData };
  } catch (error) {
    console.error("Service error (getExpensesByProjectId):", error);
    return { data: [], error: error instanceof Error ? error.message : "Internal server error" };
  }
}

export async function createExpenseService(
  input: CreateExpenseDTO
): Promise<{ data?: Expense; error?: string }> {
  try {
    const supabase = await createClient();

    const isSelf = input.type === "self" || !input.project_id;
    const today = new Date().toISOString().split("T")[0];

    const payload: Record<string, unknown> = {
      type: isSelf ? "self" : "project",
      project_id: isSelf ? null : input.project_id,
      amount: Number(input.amount) || 0,
      description: input.description,
      date: input.date || today,
    };

    if (input.labour_log_id) {
      payload.labour_log_id = input.labour_log_id;
    }

    let { data, error } = await supabase
      .from("expenses")
      .insert(payload)
      .select(EXPENSE_WITH_PROJECT_COLUMNS)
      .single();

    // Fallback if labour_log_id column doesn't exist in DB
    if (error && (error.message?.includes("labour_log_id") || error.code === "42703")) {
      delete payload.labour_log_id;
      const retry = await supabase
        .from("expenses")
        .insert(payload)
        .select(EXPENSE_WITH_PROJECT_COLUMNS)
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("Error creating expense:", error);
      return { error: error.message };
    }

    if (data) {
      const row = data as unknown as ExpenseDbRow;
      return {
        data: {
          id: String(row.id),
          type: row.type,
          project_id: row.project_id,
          project_number: row.projects?.project_number,
          name: row.projects?.name,
          amount: Number(row.amount) || 0,
          description: row.description,
          date: row.date,
          labour_log_id: row.labour_log_id || input.labour_log_id || null,
          created_at: row.created_at,
        },
      };
    }

    return { error: "Failed to return created expense" };
  } catch (error) {
    console.error("Service error (createExpense):", error);
    return { error: error instanceof Error ? error.message : "Internal server error" };
  }
}

export async function deleteExpenseService(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isValidUUID(id)) {
      return { success: false, error: "Invalid expense ID format." };
    }

    const supabase = await createClient();

    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) {
      console.error("Error deleting expense:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Service error (deleteExpense):", error);
    return { success: false, error: error instanceof Error ? error.message : "Internal server error" };
  }
}
