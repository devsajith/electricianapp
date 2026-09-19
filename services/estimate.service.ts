import { createClient } from "@/lib/supabase/server";
import { PostgrestError } from "@supabase/supabase-js";
import { Estimate, EstimateItem } from "@/lib/types/estimate";

export interface CreateEstimateDTO {
  estimate_number?: string;
  project_id?: string | null;
  project_name?: string | null;
  description?: string | null;
  terms_and_conditions?: string | null;
  terms_conditions?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  total?: number;
  status: string;
  items?: EstimateItem[];
}

/**
 * Service: Fetch all estimate records from Supabase estimates table
 */
export async function getEstimatesService(): Promise<{ data?: Estimate[]; error?: string }> {
  try {
    const supabase = await createClient();

    let { data, error } = await supabase
      .from("estimates")
      .select("*, projects(project_number, customer_name, project_type)")
      .order("created_at", { ascending: false });

    // Fallback if projects relation is not defined in Supabase schema cache
    if (error && (error.code === "PGRST200" || error.code === "PGRST100")) {
      const fallback = await supabase
        .from("estimates")
        .select("*")
        .order("created_at", { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error("[EstimateService] Error fetching estimates:", error);
      return { error: error.message };
    }

    const rows = (data || []) as Record<string, unknown>[];
    const normalized: Estimate[] = rows.map((row) => {
      const sub = Number(row.subtotal) || 0;
      const disc = Number(row.discount) || 0;
      const tx = Number(row.tax) || 0;
      const tot = Number(row.total_amount ?? row.total) || Math.max(0, sub - disc + tx);
      const termsStr = (row.terms_and_conditions as string) || (row.terms_conditions as string) || "";
      
      const projObj = row.projects as { project_number?: string; customer_name?: string; project_type?: string } | null;
      let projName = "General Electrical Work";
      if (projObj?.customer_name) {
        projName = `${projObj.customer_name}${projObj.project_type ? ` (${projObj.project_type})` : ''}`;
      } else if (row.project_name) {
        projName = String(row.project_name);
      }

      return {
        id: (row.id as string) || `est-${Date.now()}`,
        estimate_number: (row.estimate_number as string) || `EST-2026-000`,
        project_id: (row.project_id as string) || undefined,
        project_name: projName,
        description: (row.description as string) || undefined,
        terms_conditions: termsStr || undefined,
        items: (row.items as EstimateItem[]) || [],
        subtotal: sub,
        discount: disc,
        tax: tx,
        total: tot,
        status: (row.status as Estimate["status"]) || "Draft",
        created_at: (row.created_at as string) || new Date().toISOString(),
      };
    });

    return { data: normalized };
  } catch (err: unknown) {
    console.error("[EstimateService] Exception in getEstimatesService:", err);
    const msg = err instanceof Error ? err.message : "Error fetching estimates.";
    return { error: msg };
  }
}

/**
 * Service: Fetch a single estimate record by ID or estimate_number from Supabase
 */
export async function getEstimateByIdService(id: string): Promise<{ data?: Estimate; error?: string }> {
  try {
    const supabase = await createClient();

    let res = await supabase
      .from("estimates")
      .select("*, projects(project_number, customer_name, project_type), estimate_items(*)")
      .or(`id.eq.${id},estimate_number.eq.${id}`)
      .single();

    if (res.error && (res.error.code === "PGRST200" || res.error.code === "PGRST100")) {
      res = await supabase
        .from("estimates")
        .select("*")
        .or(`id.eq.${id},estimate_number.eq.${id}`)
        .single();
    }

    if (res.error || !res.data) {
      console.warn(`[EstimateService] Could not fetch estimate ${id}:`, res.error?.message);
      return { error: res.error?.message || "Estimate not found" };
    }

    const row = res.data as Record<string, unknown>;
    const sub = Number(row.subtotal) || 0;
    const disc = Number(row.discount) || 0;
    const tx = Number(row.tax) || 0;
    const tot = Number(row.total_amount ?? row.total) || Math.max(0, sub - disc + tx);
    const termsStr = (row.terms_and_conditions as string) || (row.terms_conditions as string) || "";
    
    const projObj = row.projects as { project_number?: string; customer_name?: string; project_type?: string } | null;
    let projName = "General Electrical Work";
    if (projObj?.customer_name) {
      projName = `${projObj.customer_name}${projObj.project_type ? ` (${projObj.project_type})` : ''}`;
    } else if (row.project_name) {
      projName = String(row.project_name);
    }

    const dbItems = (row.estimate_items as Record<string, unknown>[]) || [];
    const items: EstimateItem[] = dbItems.map((itemRow, idx) => ({
      id: (itemRow.id as string) || `item-${idx}`,
      estimate_id: (itemRow.estimate_id as string) || undefined,
      description: (itemRow.description as string) || "Work item",
      qty: Number(itemRow.qty) || 1,
      unit: (itemRow.unit as string) || "nos",
      rate: Number(itemRow.rate) || 0,
      amount: Number(itemRow.amount) || 0,
    }));

    return {
      data: {
        id: (row.id as string) || id,
        estimate_number: (row.estimate_number as string) || id,
        project_id: (row.project_id as string) || undefined,
        project_name: projName,
        description: (row.description as string) || undefined,
        terms_conditions: termsStr || undefined,
        items: items,
        subtotal: sub,
        discount: disc,
        tax: tx,
        total: tot,
        status: (row.status as Estimate["status"]) || "Draft",
        created_at: (row.created_at as string) || new Date().toISOString(),
      },
    };
  } catch (err: unknown) {
    console.error(`[EstimateService] Exception in getEstimateByIdService (${id}):`, err);
    const msg = err instanceof Error ? err.message : "Error fetching estimate by ID.";
    return { error: msg };
  }
}

/**
 * Service: Update estimate status in Supabase
 */
export async function updateEstimateStatusService(
  id: string,
  status: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("estimates")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error(`[EstimateService] Error updating estimate ${id}:`, error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error(`[EstimateService] Exception in updateEstimateStatusService:`, err);
    const msg = err instanceof Error ? err.message : "Error updating estimate status.";
    return { error: msg };
  }
}

/**
 * Service: Create a new estimate in Supabase estimates table
 */
export async function createEstimateService(
  input: CreateEstimateDTO
): Promise<{ data?: Estimate; error?: string }> {
  try {
    const supabase = await createClient();

    const estimate_number =
      input.estimate_number || `EST-2026-${Math.floor(100 + Math.random() * 900)}`;

    const totalVal =
      Number(input.total_amount ?? input.total) ||
      Math.max(0, (Number(input.subtotal) || 0) - (Number(input.discount) || 0) + (Number(input.tax) || 0));
    const termsVal = input.terms_and_conditions || input.terms_conditions || null;

    // Helper to validate UUID syntax for PostgreSQL uuid columns
    const isValidUUID = (id?: string | null): boolean =>
      typeof id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());

    const validProjectId = isValidUUID(input.project_id) ? input.project_id!.trim() : null;

    // Clean payload matching exact Supabase estimates table schema from screenshot
    const payload: Record<string, unknown> = {
      estimate_number,
      project_id: validProjectId,
      description: input.description || null,
      discount: Number(input.discount) || 0,
      tax: Number(input.tax) || 0,
      subtotal: Number(input.subtotal) || 0,
      total_amount: totalVal,
      terms_and_conditions: termsVal,
      status: input.status || "Draft",
    };

    let data: Record<string, unknown> | null = null;
    let error: PostgrestError | null = null;

    // Retry loop with progressive fallbacks
    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await supabase
        .from("estimates")
        .insert([payload])
        .select()
        .single();

      data = res.data as Record<string, unknown> | null;
      error = res.error;

      if (!error) break;

      console.warn(`[EstimateService] Insert attempt ${attempt + 1} notice:`, error.message, error.code);

      // Fallback 1: Column 'project_id' invalid UUID syntax or missing
      if (error.code === "22P02" || (error.code === "PGRST204" && error.message.includes("'project_id'"))) {
        delete payload.project_id;
        continue;
      }

      // Fallback 2: Column 'total_amount' vs 'total'
      if (error.code === "PGRST204" && error.message.includes("'total_amount'")) {
        delete payload.total_amount;
        payload.total = totalVal;
        continue;
      }

      // Fallback 3: Column 'terms_and_conditions' vs 'terms_conditions'
      if (error.code === "PGRST204" && error.message.includes("'terms_and_conditions'")) {
        delete payload.terms_and_conditions;
        payload.terms_conditions = termsVal;
        continue;
      }

      // Fallback 4: Status constraint violation
      if (error.code === "23514" && error.message.includes("status")) {
        delete payload.status;
        continue;
      }

      break;
    }

    if (error) {
      console.error("[EstimateService] Error inserting estimate after retries:", error);
      return { error: `Supabase Error (${error.code}): ${error.message}` };
    }

    const createdEst = (data || {}) as Record<string, unknown>;

    // Insert work items into estimate_items table if available
    if (createdEst?.id && input.items && input.items.length > 0) {
      const itemsPayload = input.items.map((item) => ({
        estimate_id: createdEst.id,
        description: item.description,
        qty: item.qty,
        unit: item.unit,
        rate: item.rate,
        amount: item.amount,
      }));

      const { error: itemsError } = await supabase
        .from("estimate_items")
        .insert(itemsPayload);

      if (itemsError) {
        console.warn("[EstimateService] Work items insert notice:", itemsError.message);
      }
    }

    return {
      data: {
        id: (createdEst.id as string) || `est-${Date.now()}`,
        estimate_number: (createdEst.estimate_number as string) || estimate_number,
        project_id: (createdEst.project_id as string) || undefined,
        project_name: input.project_name || "General Electrical Work",
        description: (createdEst.description as string) || undefined,
        terms_conditions: (createdEst.terms_and_conditions as string) || (createdEst.terms_conditions as string) || undefined,
        subtotal: Number(createdEst.subtotal) || input.subtotal,
        discount: Number(createdEst.discount) || input.discount,
        tax: Number(createdEst.tax) || input.tax,
        total: Number(createdEst.total_amount ?? createdEst.total) || totalVal,
        status: (createdEst.status as Estimate["status"]) || (input.status as Estimate["status"]),
        items: input.items || [],
        created_at: (createdEst.created_at as string) || new Date().toISOString(),
      },
    };
  } catch (err: unknown) {
    console.error("[EstimateService] Exception in createEstimateService:", err);
    const msg = err instanceof Error ? err.message : "Internal error creating estimate.";
    return { error: msg };
  }
}
