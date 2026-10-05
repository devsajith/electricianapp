import { createClient } from "@/lib/supabase/server";
import { Payment, CreatePaymentDTO } from "@/lib/types/payment";
import { withTimeout } from "@/lib/timeout";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id?: string | null): boolean {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

const PAYMENT_COLUMNS =
  "id, project_id, amount, payment_info, method, payment_date, created_at, projects(id, project_number, name, phone)";

const PAYMENT_SIMPLE_COLUMNS =
  "id, project_id, amount, payment_info, method, payment_date, created_at";

/**
 * Service: Fetch all payments joined with project details
 */
export async function getPaymentsService(): Promise<{ data: Payment[]; error?: string }> {
  return withTimeout(
    (async () => {
      try {
        const supabase = await createClient();

        const { data, error } = await supabase
          .from("payments")
          .select(PAYMENT_COLUMNS)
          .order("payment_date", { ascending: false });

        if (error) {
          console.error("[PaymentService] Error fetching payments:", error);
          return { data: [], error: error.message };
        }

        const rows = (data || []) as Record<string, unknown>[];
        const items: Payment[] = rows.map((row) => {
          const proj = row.projects as {
            id?: string;
            project_number?: string;
            name?: string;
            phone?: string;
          } | null;

          return {
            id: String(row.id),
            project_id: String(row.project_id || ""),
            amount: Number(row.amount) || 0,
            payment_info: row.payment_info ? String(row.payment_info) : null,
            method: String(row.method || "Cash"),
            payment_date: String(row.payment_date || new Date().toISOString().split("T")[0]),
            created_at: String(row.created_at || new Date().toISOString()),
            projects: proj
              ? {
                  id: proj.id,
                  project_number: proj.project_number,
                  name: proj.name,
                  phone: proj.phone,
                }
              : null,
          };
        });

        return { data: items };
      } catch (err: unknown) {
        console.error("[PaymentService] Exception:", err);
        return { data: [], error: err instanceof Error ? err.message : "Error fetching payments" };
      }
    })(),
    { data: [], error: "timeout" },
    2500
  );
}

/**
 * Service: Fetch payments for a specific project
 */
export async function getPaymentsByProjectIdService(
  projectId: string
): Promise<{ data: Payment[]; error?: string }> {
  try {
    if (!isValidUUID(projectId)) {
      return { data: [] };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("payments")
      .select(PAYMENT_COLUMNS)
      .eq("project_id", projectId)
      .order("payment_date", { ascending: false });

    if (error) {
      console.error(`[PaymentService] Error fetching payments for project ${projectId}:`, error);
      return { data: [] };
    }

    const rows = (data || []) as Record<string, unknown>[];
    const items: Payment[] = rows.map((row) => {
      const proj = row.projects as {
        id?: string;
        project_number?: string;
        name?: string;
        phone?: string;
      } | null;

      return {
        id: String(row.id),
        project_id: String(row.project_id),
        amount: Number(row.amount) || 0,
        payment_info: row.payment_info ? String(row.payment_info) : null,
        method: String(row.method || "Cash"),
        payment_date: String(row.payment_date || new Date().toISOString().split("T")[0]),
        created_at: String(row.created_at || new Date().toISOString()),
        projects: proj
          ? {
              id: proj.id,
              project_number: proj.project_number,
              name: proj.name,
              phone: proj.phone,
            }
          : null,
      };
    });

    return { data: items };
  } catch (err: unknown) {
    console.error(`[PaymentService] Exception:`, err);
    return { data: [] };
  }
}

/**
 * Service: Create a new payment
 */
export async function createPaymentService(
  input: CreatePaymentDTO
): Promise<{ data?: Payment; error?: string }> {
  try {
    if (!isValidUUID(input.project_id)) {
      return { error: "Valid project ID is required." };
    }

    const supabase = await createClient();

    const payload = {
      project_id: input.project_id,
      amount: Number(input.amount) || 0,
      payment_info: input.payment_info || null,
      method: input.method || "Cash",
      payment_date: input.payment_date || new Date().toISOString().split("T")[0],
    };

    const { data, error } = await supabase
      .from("payments")
      .insert([payload])
      .select(PAYMENT_SIMPLE_COLUMNS)
      .single();

    if (error) {
      console.error("[PaymentService] Error creating payment:", error);
      return { error: error.message };
    }

    const row = data as Record<string, unknown>;
    return {
      data: {
        id: String(row.id),
        project_id: String(row.project_id),
        amount: Number(row.amount) || 0,
        payment_info: row.payment_info ? String(row.payment_info) : null,
        method: String(row.method || "Cash"),
        payment_date: String(row.payment_date),
        created_at: String(row.created_at || new Date().toISOString()),
      },
    };
  } catch (err: unknown) {
    console.error("[PaymentService] Exception creating payment:", err);
    return { error: err instanceof Error ? err.message : "Failed to create payment." };
  }
}

/**
 * Service: Delete a payment
 */
export async function deletePaymentService(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isValidUUID(id)) {
      return { success: false, error: "Invalid payment ID format." };
    }

    const supabase = await createClient();

    const { error } = await supabase.from("payments").delete().eq("id", id);

    if (error) {
      console.error(`[PaymentService] Error deleting payment ${id}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error(`[PaymentService] Exception deleting payment ${id}:`, err);
    return { success: false, error: err instanceof Error ? err.message : "Error deleting payment" };
  }
}
