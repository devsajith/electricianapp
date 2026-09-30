import { createClient } from "@/lib/supabase/server";
import { Expense, CreateExpenseDTO, initialSampleExpenses } from "@/lib/types/expense";
import { withTimeout } from "@/lib/timeout";

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
  return withTimeout(
    (async () => {
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
          const rawDesc = String(row.description || "");
          const rawReceipt = row.receipt_url ? String(row.receipt_url) : "";

          // Determine scope: self vs project
          let expType: "project" | "self" = "project";
          if (row.expense_type === "self" || row.expense_type === "project") {
            expType = row.expense_type;
          } else if (!row.project_id || String(row.project_id) === "null" || String(row.project_id).trim() === "") {
            expType = "self";
          } else if (rawDesc.includes("[Scope: Self]") || rawReceipt.includes("[Scope: Self]")) {
            expType = "self";
          }

          const cleanDesc = rawDesc.replace(/\[Scope:\s*Self\]\s*/g, "").trim();
          const cleanReceipt = rawReceipt ? rawReceipt.replace(/\[Scope:\s*Self\]\s*/g, "").trim() || null : null;

          return {
            id: String(row.id || `exp-${Date.now()}`),
            expense_type: expType,
            project_id: expType === "self" ? null : (row.project_id ? String(row.project_id) : null),
            project_number: expType === "project" ? (proj?.project_number || undefined) : undefined,
            customer_name: expType === "project" ? (proj?.customer_name || undefined) : undefined,
            project_type: expType === "project" ? (proj?.project_type || undefined) : undefined,
            category: String(row.category || "Miscellaneous"),
            description: cleanDesc,
            amount: Number(row.amount) || 0,
            expense_date: String(row.expense_date || new Date().toISOString().split("T")[0]),
            receipt_url: cleanReceipt,
            created_at: String(row.created_at || new Date().toISOString()),
            updated_at: row.updated_at ? String(row.updated_at) : undefined,
          };
        });

        return { data: items };
      } catch (err: unknown) {
        console.error("[ExpenseService] Exception in getExpensesService:", err);
        return { data: initialSampleExpenses, error: err instanceof Error ? err.message : "Error fetching expenses" };
      }
    })(),
    { data: initialSampleExpenses, error: "timeout" },
    2500
  );
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
      // Return sample matches for non-UUID sample projects (filtering out self expenses)
      const sampleMatches = initialSampleExpenses.filter(
        (e) => e.project_id === projectId && e.expense_type !== "self"
      );
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
    const items: Expense[] = rows
      .filter((row) => {
        // Exclude self expenses that were assigned a dummy project_id for legacy constraints
        if (row.expense_type === "self") return false;
        if (String(row.description || "").includes("[Scope: Self]")) return false;
        return true;
      })
      .map((row) => ({
        id: String(row.id),
        expense_type: "project",
        project_id: String(row.project_id),
        category: String(row.category || "Miscellaneous"),
        description: String(row.description || "").replace(/\[Scope:\s*Self\]\s*/g, ""),
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
 * Service: Create a new expense (Self or Project-based)
 */
export async function createExpenseService(
  input: CreateExpenseDTO
): Promise<{ data?: Expense; error?: string }> {
  try {
    const supabase = await createClient();

    const today = new Date().toISOString().split("T")[0];
    const expenseDate = input.expense_date || today;
    const isSelf = input.expense_type === "self" || !input.project_id;
    let targetProjectId = isSelf ? null : (input.project_id || null);

    // If it's a project expense, ensure valid UUID
    if (!isSelf && !isValidUUID(targetProjectId)) {
      const { data: firstProj } = await supabase.from("projects").select("id").limit(1).maybeSingle();
      if (!firstProj?.id) {
        // Return dummy created for sample projects
        return {
          data: {
            id: `exp-${Date.now()}`,
            expense_type: "project",
            project_id: input.project_id || null,
            category: input.category,
            description: input.description,
            amount: Number(input.amount) || 0,
            expense_date: expenseDate,
            receipt_url: input.receipt_url || null,
            created_at: new Date().toISOString(),
          },
        };
      }
      targetProjectId = firstProj.id;
    }

    // Try payload with expense_type column
    const payloadWithScope: Record<string, unknown> = {
      project_id: targetProjectId,
      expense_type: isSelf ? "self" : "project",
      category: input.category || "Miscellaneous",
      description: input.description.trim(),
      amount: Number(input.amount) || 0,
      expense_date: expenseDate,
      receipt_url: input.receipt_url || null,
    };

    let { data, error } = await supabase
      .from("expenses")
      .insert([payloadWithScope])
      .select()
      .single();

    // Fallback if expense_type column is not present in PostgREST schema cache
    if (error && (error.code === "PGRST204" || error.message.includes("expense_type"))) {
      const fallbackPayload: Record<string, unknown> = {
        project_id: targetProjectId,
        category: input.category || "Miscellaneous",
        description: isSelf ? `[Scope: Self] ${input.description.trim()}` : input.description.trim(),
        amount: Number(input.amount) || 0,
        expense_date: expenseDate,
        receipt_url: input.receipt_url || null,
      };

      if (isSelf && !targetProjectId) {
        const res = await supabase.from("expenses").insert([fallbackPayload]).select().single();
        if (res.error && res.error.code === "23502") {
          // If project_id has a NOT NULL constraint, assign first project with [Scope: Self] tag
          const { data: anyProj } = await supabase.from("projects").select("id").limit(1).maybeSingle();
          if (anyProj?.id) {
            fallbackPayload.project_id = anyProj.id;
            const retryRes = await supabase.from("expenses").insert([fallbackPayload]).select().single();
            data = retryRes.data;
            error = retryRes.error;
          } else {
            data = res.data;
            error = res.error;
          }
        } else {
          data = res.data;
          error = res.error;
        }
      } else {
        const res = await supabase.from("expenses").insert([fallbackPayload]).select().single();
        data = res.data;
        error = res.error;
      }
    }

    if (error || !data) {
      console.error("[ExpenseService] Error creating expense in Supabase:", error);
      return { error: error?.message || "Failed to create expense." };
    }

    const row = data as Record<string, unknown>;
    return {
      data: {
        id: String(row.id),
        expense_type: isSelf ? "self" : "project",
        project_id: isSelf ? null : (row.project_id ? String(row.project_id) : null),
        category: String(row.category),
        description: input.description.trim(),
        amount: Number(row.amount),
        expense_date: String(row.expense_date),
        receipt_url: row.receipt_url ? String(row.receipt_url).replace(/\[Scope:\s*Self\]\s*/g, "") : null,
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
