import { createClient } from "@/lib/supabase/server";
import { Expense, CreateExpenseDTO, initialSampleExpenses } from "@/lib/types/expense";

/**
 * Helper to validate UUID syntax for PostgreSQL uuid columns
 */
const isValidUUID = (id?: string | null): boolean =>
  typeof id === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());

/**
 * Service: Fetch all expenses from Supabase
 */
export async function getExpensesService(): Promise<{ data: Expense[]; error?: string }> {
  try {
    const supabase = await createClient();

    // Query expenses and join with projects
    let { data, error } = await supabase
      .from("expenses")
      .select("*, projects(project_number, customer_name, project_type)")
      .order("expense_date", { ascending: false });

    // Fallback if projects relationship isn't registered in PostgREST schema cache
    if (error && (error.code === "PGRST200" || error.code === "PGRST100")) {
      const fallback = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error("[ExpenseService] Error fetching expenses:", error);
      return { data: initialSampleExpenses, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [] };
    }

    const rows = data as Record<string, unknown>[];
    const items: Expense[] = rows.map((row) => {
      const proj = row.projects as { project_number?: string; customer_name?: string; project_type?: string } | null;
      return {
        id: String(row.id || `exp-${Date.now()}`),
        project_id: String(row.project_id || ""),
        project_number: proj?.project_number || undefined,
        customer_name: proj?.customer_name || undefined,
        project_type: proj?.project_type || undefined,
        category: String(row.category || "Miscellaneous"),
        description: String(row.description || ""),
        amount: Number(row.amount) || 0,
        expense_date: String(row.expense_date || new Date().toISOString().split("T")[0]),
        receipt_url: row.receipt_url ? String(row.receipt_url) : null,
        created_at: String(row.created_at || new Date().toISOString()),
        updated_at: row.updated_at ? String(row.updated_at) : undefined,
      };
    });

    return { data: items };
  } catch (err: unknown) {
    console.error("[ExpenseService] Exception in getExpensesService:", err);
    return { data: initialSampleExpenses, error: err instanceof Error ? err.message : "Error fetching expenses" };
  }
}

/**
 * Service: Fetch expenses for a specific project
 */
export async function getExpensesByProjectIdService(
  projectId: string
): Promise<{ data: Expense[]; error?: string }> {
  try {
    const supabase = await createClient();

    if (!isValidUUID(projectId)) {
      // Return sample matches for non-UUID sample projects
      const sampleMatches = initialSampleExpenses.filter((e) => e.project_id === projectId);
      return { data: sampleMatches };
    }

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("project_id", projectId)
      .order("expense_date", { ascending: false });

    if (error) {
      console.error(`[ExpenseService] Error fetching expenses for project ${projectId}:`, error);
      return { data: [] };
    }

    const rows = (data || []) as Record<string, unknown>[];
    const items: Expense[] = rows.map((row) => ({
      id: String(row.id),
      project_id: String(row.project_id),
      category: String(row.category || "Miscellaneous"),
      description: String(row.description || ""),
      amount: Number(row.amount) || 0,
      expense_date: String(row.expense_date || new Date().toISOString().split("T")[0]),
      receipt_url: row.receipt_url ? String(row.receipt_url) : null,
      created_at: String(row.created_at || new Date().toISOString()),
      updated_at: row.updated_at ? String(row.updated_at) : undefined,
    }));

    return { data: items };
  } catch (err: unknown) {
    console.error(`[ExpenseService] Exception fetching project expenses (${projectId}):`, err);
    return { data: [] };
  }
}

/**
 * Service: Create a new project expense
 */
export async function createExpenseService(
  input: CreateExpenseDTO
): Promise<{ data?: Expense; error?: string }> {
  try {
    const supabase = await createClient();

    const today = new Date().toISOString().split("T")[0];
    const expenseDate = input.expense_date || today;

    // Check if projectId is a valid UUID
    if (!isValidUUID(input.project_id)) {
      // Find project from sample or first valid project
      const { data: firstProj } = await supabase.from("projects").select("id").limit(1).maybeSingle();
      if (!firstProj?.id) {
        // Return dummy created for sample projects
        return {
          data: {
            id: `exp-${Date.now()}`,
            project_id: input.project_id,
            category: input.category,
            description: input.description,
            amount: Number(input.amount) || 0,
            expense_date: expenseDate,
            receipt_url: input.receipt_url || null,
            created_at: new Date().toISOString(),
          },
        };
      }
      input.project_id = firstProj.id;
    }

    const payload = {
      project_id: input.project_id,
      category: input.category || "Miscellaneous",
      description: input.description.trim(),
      amount: Number(input.amount) || 0,
      expense_date: expenseDate,
      receipt_url: input.receipt_url || null,
    };

    const { data, error } = await supabase
      .from("expenses")
      .insert([payload])
      .select()
      .single();

    if (error || !data) {
      console.error("[ExpenseService] Error creating expense in Supabase:", error);
      return { error: error?.message || "Failed to create expense." };
    }

    const row = data as Record<string, unknown>;
    return {
      data: {
        id: String(row.id),
        project_id: String(row.project_id),
        category: String(row.category),
        description: String(row.description),
        amount: Number(row.amount),
        expense_date: String(row.expense_date),
        receipt_url: row.receipt_url ? String(row.receipt_url) : null,
        created_at: String(row.created_at || new Date().toISOString()),
      },
    };
  } catch (err: unknown) {
    console.error("[ExpenseService] Exception in createExpenseService:", err);
    return { error: err instanceof Error ? err.message : "Error creating expense." };
  }
}

/**
 * Service: Delete an expense record
 */
export async function deleteExpenseService(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    if (!isValidUUID(id)) {
      return { success: true };
    }

    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      console.error(`[ExpenseService] Error deleting expense ${id}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error(`[ExpenseService] Exception deleting expense ${id}:`, err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete expense." };
  }
}
