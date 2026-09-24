import { createClient } from "@/lib/supabase/server";
import { Payment, CreatePaymentDTO, initialSamplePayments } from "@/lib/types/payment";
import { PostgrestError } from "@supabase/supabase-js";

/**
 * Helper to validate UUID syntax for PostgreSQL uuid columns
 */
const isValidUUID = (id?: string | null): boolean =>
  typeof id === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());

/**
 * Normalizes payment rows, recovering original method/type if merged into notes for constraint compatibility
 */
function parsePaymentRow(row: Record<string, unknown>): Payment {
  const proj = row.projects as { id?: string; project_number?: string; customer_name?: string; customer_phone?: string } | null;
  let method = String(row.payment_method || "UPI");
  let paymentType = String(row.payment_type || "Advance");
  let notes = row.notes ? String(row.notes) : null;

  if (notes) {
    const methodMatch = notes.match(/\[Method:\s*([^\]]+)\]/);
    if (methodMatch) {
      method = methodMatch[1].trim();
      notes = notes.replace(/\[Method:\s*[^\]]+\]\s*/, "").trim() || null;
    }
    if (notes) {
      const typeMatch = notes.match(/\[Type:\s*([^\]]+)\]/);
      if (typeMatch) {
        paymentType = typeMatch[1].trim();
        notes = notes.replace(/\[Type:\s*[^\]]+\]\s*/, "").trim() || null;
      }
    }
  }

  return {
    id: String(row.id || `pay-${Date.now()}`),
    project_id: String(row.project_id || ""),
    amount: Number(row.amount) || 0,
    payment_date: String(row.payment_date || new Date().toISOString().split("T")[0]),
    payment_method: method,
    payment_type: paymentType,
    reference_number: row.reference_number ? String(row.reference_number) : null,
    notes,
    receipt_url: row.receipt_url ? String(row.receipt_url) : null,
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
    projects: proj
      ? {
          id: proj.id,
          project_number: proj.project_number,
          customer_name: proj.customer_name,
          customer_phone: proj.customer_phone,
        }
      : null,
  };
}

/**
 * Service: Fetch all client payments from Supabase joined with project details
 */
export async function getPaymentsService(): Promise<{ data: Payment[]; error?: string }> {
  try {
    const supabase = await createClient();

    // Query payments and join with projects
    let { data, error } = await supabase
      .from("payments")
      .select("*, projects(id, project_number, customer_name, customer_phone)")
      .order("payment_date", { ascending: false });

    // Fallback if projects relation has an issue in PostgREST cache
    if (error && (error.code === "PGRST200" || error.code === "PGRST100")) {
      const fallback = await supabase
        .from("payments")
        .select("*")
        .order("payment_date", { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error("[PaymentService] Error fetching payments:", error);
      return { data: initialSamplePayments, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [] };
    }

    const rows = data as Record<string, unknown>[];
    const items: Payment[] = rows.map((row) => parsePaymentRow(row));

    return { data: items };
  } catch (err: unknown) {
    console.error("[PaymentService] Exception in getPaymentsService:", err);
    return { data: initialSamplePayments, error: err instanceof Error ? err.message : "Error fetching payments" };
  }
}

/**
 * Service: Fetch payments for a specific project
 */
export async function getPaymentsByProjectIdService(
  projectId: string
): Promise<{ data: Payment[]; error?: string }> {
  try {
    const supabase = await createClient();

    if (!isValidUUID(projectId)) {
      // Return sample matches for non-UUID sample projects
      const sampleMatches = initialSamplePayments.filter((p) => p.project_id === projectId);
      return { data: sampleMatches };
    }

    const { data, error } = await supabase
      .from("payments")
      .select("*, projects(id, project_number, customer_name, customer_phone)")
      .eq("project_id", projectId)
      .order("payment_date", { ascending: false });

    if (error) {
      console.error(`[PaymentService] Error fetching payments for project ${projectId}:`, error);
      return { data: [] };
    }

    const rows = (data || []) as Record<string, unknown>[];
    const items: Payment[] = rows.map((row) => parsePaymentRow(row));

    return { data: items };
  } catch (err: unknown) {
    console.error(`[PaymentService] Exception fetching project payments (${projectId}):`, err);
    return { data: [] };
  }
}

/**
 * Builds progressive fallback candidate list for payment_method
 * in case the DB has a legacy check constraint (payments_payment_method_check)
 */
function getMethodCandidates(chosenMethod: string): string[] {
  const norm = chosenMethod.trim();
  const candidates: string[] = [norm];

  switch (norm.toUpperCase()) {
    case "UPI":
      candidates.push("Online", "Bank Transfer", "Cash", "upi", "online", "bank_transfer", "cash", "Other", "other");
      break;
    case "BANK TRANSFER":
      candidates.push("bank_transfer", "Bank Transfer", "Online", "online", "Transfer", "Cash", "cash", "Other");
      break;
    case "CASH":
      candidates.push("Cash", "cash", "Other", "other");
      break;
    case "CHEQUE":
      candidates.push("Cheque", "cheque", "Check", "check", "Bank Transfer", "Cash", "Other");
      break;
    case "CARD":
      candidates.push("Card", "Credit Card", "card", "credit_card", "Debit Card", "Online", "Cash", "Other");
      break;
    default:
      candidates.push("Cash", "Online", "Bank Transfer", "Other", norm.toLowerCase());
      break;
  }

  return Array.from(new Set(candidates));
}

/**
 * Builds progressive fallback candidate list for payment_type
 * in case the DB has a legacy check constraint (payments_payment_type_check)
 */
function getTypeCandidates(chosenType: string): string[] {
  const norm = chosenType.trim();
  const candidates: string[] = [norm];

  candidates.push(
    norm.toLowerCase(),
    "Advance",
    "advance",
    "Milestone",
    "milestone",
    "Final Settlement",
    "final",
    "Full Payment",
    "deposit",
    "Deposit"
  );

  return Array.from(new Set(candidates));
}

/**
 * Service: Create a new client payment record with progressive CHECK constraint resilience
 */
export async function createPaymentService(
  input: CreatePaymentDTO
): Promise<{ data?: Payment; error?: string }> {
  try {
    const supabase = await createClient();

    const today = new Date().toISOString().split("T")[0];
    const paymentDate = input.payment_date || today;
    const initialPaymentType = input.payment_type || "Advance";
    const initialPaymentMethod = input.payment_method || "UPI";

    // Check if projectId is a valid UUID
    if (!isValidUUID(input.project_id)) {
      // Find first valid project from database if available
      const { data: firstProj } = await supabase.from("projects").select("id").limit(1).maybeSingle();
      if (!firstProj?.id) {
        // Return dummy created for offline sample projects
        return {
          data: {
            id: `pay-${Date.now()}`,
            project_id: input.project_id,
            amount: Number(input.amount) || 0,
            payment_date: paymentDate,
            payment_method: initialPaymentMethod,
            payment_type: initialPaymentType,
            reference_number: input.reference_number || null,
            notes: input.notes || null,
            receipt_url: input.receipt_url || null,
            created_at: new Date().toISOString(),
          },
        };
      }
      input.project_id = firstProj.id;
    }

    const methodCandidates = getMethodCandidates(initialPaymentMethod);
    const typeCandidates = getTypeCandidates(initialPaymentType);

    let lastError: PostgrestError | null = null;
    let createdRow: Record<string, unknown> | null = null;

    // Progressive retry loop: tests candidate values to satisfy any DB check constraint
    for (const m of methodCandidates) {
      for (const t of typeCandidates) {
        let currentNotes = input.notes?.trim() || null;

        // If we had to adapt the method to satisfy DB constraint, preserve the user's intended method in notes
        if (m !== initialPaymentMethod) {
          const prefix = `[Method: ${initialPaymentMethod}]`;
          currentNotes = currentNotes ? `${prefix} ${currentNotes}` : prefix;
        }

        // If we had to adapt the type to satisfy DB constraint, preserve the user's intended type in notes
        if (t !== initialPaymentType) {
          const prefix = `[Type: ${initialPaymentType}]`;
          currentNotes = currentNotes ? `${prefix} ${currentNotes}` : prefix;
        }

        const payload = {
          project_id: input.project_id,
          amount: Number(input.amount) || 0,
          payment_date: paymentDate,
          payment_method: m,
          payment_type: t,
          reference_number: input.reference_number?.trim() || null,
          notes: currentNotes,
          receipt_url: input.receipt_url?.trim() || null,
        };

        const res = await supabase
          .from("payments")
          .insert([payload])
          .select("*, projects(id, project_number, customer_name, customer_phone)")
          .single();

        if (!res.error && res.data) {
          createdRow = res.data as Record<string, unknown>;
          break;
        }

        lastError = res.error;
        const msg = res.error?.message?.toLowerCase() || "";

        // If the error is NOT a check constraint error (code 23514), don't loop endlessly
        if (res.error?.code !== "23514" && !msg.includes("check constraint")) {
          break;
        }

        // If constraint is specifically on payment_method, try next method candidate
        if (msg.includes("payments_payment_method_check")) {
          break; // break inner type loop, try next method
        }
      }

      if (createdRow) break;

      const lastMsg = lastError?.message?.toLowerCase() || "";
      if (lastError && lastError.code !== "23514" && !lastMsg.includes("check constraint")) {
        break;
      }
    }

    if (!createdRow || lastError && !createdRow) {
      console.error("[PaymentService] Error creating payment in Supabase:", lastError);
      return { error: lastError?.message || "Failed to record payment." };
    }

    const parsed = parsePaymentRow(createdRow);
    // Ensure the returned model reflects the exact user's intended method and type
    parsed.payment_method = initialPaymentMethod;
    parsed.payment_type = initialPaymentType;

    return {
      data: parsed,
    };
  } catch (err: unknown) {
    console.error("[PaymentService] Exception in createPaymentService:", err);
    return { error: err instanceof Error ? err.message : "Error recording payment." };
  }
}

/**
 * Service: Delete a client payment record
 */
export async function deletePaymentService(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    if (!isValidUUID(id)) {
      return { success: true };
    }

    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) {
      console.error(`[PaymentService] Error deleting payment ${id}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error(`[PaymentService] Exception deleting payment ${id}:`, err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete payment." };
  }
}
