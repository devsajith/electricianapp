import { createClient } from "@/lib/supabase/server";
import { PostgrestError } from "@supabase/supabase-js";
import { Estimate, EstimateItem, ProjectItemList } from "@/lib/types/estimate";

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
    const items: EstimateItem[] = dbItems.map((itemRow, idx) => {
      const q = Number(itemRow.quantity ?? itemRow.qty) || 1;
      const r = Number(itemRow.rate) || 0;
      return {
        id: (itemRow.id as string) || `item-${idx}`,
        estimate_id: (itemRow.estimate_id as string) || undefined,
        description: (itemRow.description as string) || "Work item",
        qty: q,
        quantity: q,
        unit: (itemRow.unit as string) || "nos",
        rate: r,
        amount: Number(itemRow.amount) || q * r,
      };
    });

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
      const itemsPayload = input.items.map((item) => {
        const q = Number(item.quantity ?? item.qty) || 1;
        const r = Number(item.rate) || 0;
        return {
          estimate_id: createdEst.id,
          description: item.description || "Work item",
          quantity: q,
          unit: item.unit || "nos",
          rate: r,
          amount: Number(item.amount) || q * r,
        };
      });

      let { error: itemsError } = await supabase
        .from("estimate_items")
        .insert(itemsPayload);

      // Fallback if DB schema expects qty instead of quantity
      if (itemsError && (itemsError.code === "42703" || itemsError.message.includes("quantity"))) {
        const fallbackPayload = input.items.map((item) => {
          const q = Number(item.quantity ?? item.qty) || 1;
          const r = Number(item.rate) || 0;
          return {
            estimate_id: createdEst.id,
            description: item.description || "Work item",
            qty: q,
            unit: item.unit || "nos",
            rate: r,
            amount: Number(item.amount) || q * r,
          };
        });
        const retryRes = await supabase.from("estimate_items").insert(fallbackPayload);
        itemsError = retryRes.error;
      }

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

/**
 * Service: Fetch the item list for a specific project
 */
export async function getProjectItemListService(
  projectId: string
): Promise<{ data?: ProjectItemList; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Fetch project details
    const { data: projectData, error: projError } = await supabase
      .from("projects")
      .select("id, project_number, customer_name, project_type, address")
      .eq("id", projectId)
      .maybeSingle();

    if (projError || !projectData) {
      return { error: projError?.message || "Project not found" };
    }

    // 2. Fetch associated estimate
    const { data: estData } = await supabase
      .from("estimates")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let items: EstimateItem[] = [];
    if (estData?.id) {
      const { data: rawItems } = await supabase
        .from("estimate_items")
        .select("*")
        .eq("estimate_id", estData.id)
        .order("created_at", { ascending: true });

      if (rawItems && rawItems.length > 0) {
        items = (rawItems as Record<string, unknown>[]).map((r, idx) => {
          const q = Number(r.quantity ?? r.qty) || 1;
          const rate = Number(r.rate) || 0;
          return {
            id: (r.id as string) || `item-${idx}`,
            estimate_id: (r.estimate_id as string) || estData.id,
            description: (r.description as string) || "Work item",
            qty: q,
            quantity: q,
            unit: (r.unit as string) || "nos",
            rate,
            amount: Number(r.amount) || q * rate,
          };
        });
      }
    }

    const sub = estData ? Number(estData.subtotal) || 0 : items.reduce((s, it) => s + it.amount, 0);
    const disc = estData ? Number(estData.discount) || 0 : 0;
    const tx = estData ? Number(estData.tax) || 0 : 0;
    const tot = estData ? Number(estData.total_amount ?? estData.total) || Math.max(0, sub - disc + tx) : sub;

    const result: ProjectItemList = {
      project_id: projectData.id,
      project_number: projectData.project_number || "PRJ-000",
      customer_name: projectData.customer_name || "Client",
      project_type: projectData.project_type || undefined,
      address: projectData.address || undefined,
      estimate_id: estData?.id || undefined,
      estimate_number: estData?.estimate_number || undefined,
      items,
      subtotal: sub,
      discount: disc,
      tax: tx,
      total_amount: tot,
      notes: estData?.description || estData?.terms_and_conditions || undefined,
      updated_at: estData?.updated_at || undefined,
    };

    return { data: result };
  } catch (err: unknown) {
    console.error(`[EstimateService] Exception in getProjectItemListService (${projectId}):`, err);
    return { error: err instanceof Error ? err.message : "Error fetching project item list." };
  }
}

/**
 * Service: Save or update the item list for a project
 */
export async function saveProjectItemListService(input: {
  projectId: string;
  items: EstimateItem[];
  notes?: string;
  discount?: number;
  tax?: number;
}): Promise<{ data?: ProjectItemList; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Fetch project details
    const { data: projectData, error: projError } = await supabase
      .from("projects")
      .select("id, project_number, customer_name, project_type, address")
      .eq("id", input.projectId)
      .maybeSingle();

    if (projError || !projectData) {
      return { error: projError?.message || "Project not found in database." };
    }

    // 2. Calculate financial totals
    const subtotal = input.items.reduce((sum, item) => {
      const q = Number(item.quantity ?? item.qty) || 1;
      const r = Number(item.rate) || 0;
      return sum + (Number(item.amount) || q * r);
    }, 0);
    const discount = Number(input.discount) || 0;
    const tax = Number(input.tax) || 0;
    const total_amount = Math.max(0, subtotal - discount + tax);

    // 3. Find or create the estimate container
    let { data: existingEst } = await supabase
      .from("estimates")
      .select("*")
      .eq("project_id", input.projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let estimateId: string;
    let estimateNumber: string;

    if (existingEst) {
      estimateId = existingEst.id;
      estimateNumber = existingEst.estimate_number;

      // Update existing estimate totals
      await supabase
        .from("estimates")
        .update({
          subtotal,
          discount,
          tax,
          total_amount,
          description: input.notes || existingEst.description || `Item list for ${projectData.customer_name}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", estimateId);

      // Clean out existing estimate_items to replace with updated list
      await supabase.from("estimate_items").delete().eq("estimate_id", estimateId);
    } else {
      estimateNumber = `EST-${projectData.project_number ? projectData.project_number.replace(/^PRJ-?/i, "") : Math.floor(100 + Math.random() * 900)}`;

      const { data: createdEst, error: createError } = await supabase
        .from("estimates")
        .insert({
          project_id: input.projectId,
          estimate_number: estimateNumber,
          description: input.notes || `Item list for ${projectData.customer_name} (${projectData.project_type || "Electrical"})`,
          subtotal,
          discount,
          tax,
          total_amount,
          status: "Draft",
        })
        .select()
        .single();

      if (createError || !createdEst) {
        console.error("[EstimateService] Error creating parent estimate for item list:", createError);
        return { error: createError?.message || "Failed to create project estimate record." };
      }

      estimateId = createdEst.id;
    }

    // 4. Insert new items into estimate_items
    if (input.items && input.items.length > 0) {
      const itemsPayload = input.items.map((item) => {
        const q = Number(item.quantity ?? item.qty) || 1;
        const r = Number(item.rate) || 0;
        return {
          estimate_id: estimateId,
          description: item.description || "Work item",
          quantity: q,
          unit: item.unit || "nos",
          rate: r,
          amount: Number(item.amount) || q * r,
        };
      });

      let { error: insertError } = await supabase
        .from("estimate_items")
        .insert(itemsPayload);

      // Fallback for qty column if quantity fails
      if (insertError && (insertError.code === "42703" || insertError.message.includes("quantity"))) {
        const fallbackPayload = input.items.map((item) => {
          const q = Number(item.quantity ?? item.qty) || 1;
          const r = Number(item.rate) || 0;
          return {
            estimate_id: estimateId,
            description: item.description || "Work item",
            qty: q,
            unit: item.unit || "nos",
            rate: r,
            amount: Number(item.amount) || q * r,
          };
        });
        const retry = await supabase.from("estimate_items").insert(fallbackPayload);
        insertError = retry.error;
      }

      if (insertError) {
        console.error("[EstimateService] Error saving estimate_items:", insertError);
        return { error: `Failed to insert item rows: ${insertError.message}` };
      }
    }

    // Return the updated ProjectItemList
    return {
      data: {
        project_id: projectData.id,
        project_number: projectData.project_number,
        customer_name: projectData.customer_name,
        project_type: projectData.project_type,
        address: projectData.address,
        estimate_id: estimateId,
        estimate_number: estimateNumber,
        items: input.items.map((it, idx) => ({
          ...it,
          id: it.id || `item-${idx}`,
          estimate_id: estimateId,
          quantity: Number(it.quantity ?? it.qty) || 1,
          qty: Number(it.quantity ?? it.qty) || 1,
        })),
        subtotal,
        discount,
        tax,
        total_amount,
        notes: input.notes,
        updated_at: new Date().toISOString(),
      },
    };
  } catch (err: unknown) {
    console.error("[EstimateService] Exception in saveProjectItemListService:", err);
    return { error: err instanceof Error ? err.message : "Error saving project item list." };
  }
}

/**
 * Service: Fetch all project item lists
 */
export async function getAllProjectItemListsService(): Promise<{ data: ProjectItemList[]; error?: string }> {
  try {
    const supabase = await createClient();

    // Query projects with their estimates and estimate_items
    const { data: projects, error } = await supabase
      .from("projects")
      .select("id, project_number, customer_name, project_type, address, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[EstimateService] Error fetching projects for item lists:", error);
      return { data: [], error: error.message };
    }

    if (!projects || projects.length === 0) {
      return { data: [] };
    }

    const projectIds = projects.map((p) => p.id);

    // Fetch estimates for these projects
    const { data: estimates } = await supabase
      .from("estimates")
      .select("id, project_id, estimate_number, description, subtotal, discount, tax, total_amount, updated_at")
      .in("project_id", projectIds);

    const estMap = new Map<string, Record<string, unknown>>();
    (estimates || []).forEach((e) => {
      if (e.project_id && !estMap.has(e.project_id)) {
        estMap.set(e.project_id, e as Record<string, unknown>);
      }
    });

    // Fetch all estimate_items
    const estIds = Array.from(estMap.values()).map((e) => e.id as string);
    let itemsByEstId = new Map<string, EstimateItem[]>();
    if (estIds.length > 0) {
      const { data: allItems } = await supabase
        .from("estimate_items")
        .select("*")
        .in("estimate_id", estIds)
        .order("created_at", { ascending: true });

      (allItems || []).forEach((itemRow: Record<string, unknown>) => {
        const estId = itemRow.estimate_id as string;
        const q = Number(itemRow.quantity ?? itemRow.qty) || 1;
        const rate = Number(itemRow.rate) || 0;
        const item: EstimateItem = {
          id: (itemRow.id as string) || `item-${Math.random()}`,
          estimate_id: estId,
          description: (itemRow.description as string) || "Work item",
          qty: q,
          quantity: q,
          unit: (itemRow.unit as string) || "nos",
          rate,
          amount: Number(itemRow.amount) || q * rate,
        };

        const list = itemsByEstId.get(estId) || [];
        list.push(item);
        itemsByEstId.set(estId, list);
      });
    }

    const result: ProjectItemList[] = projects.map((p) => {
      const est = estMap.get(p.id);
      const estId = est?.id as string | undefined;
      const items = estId ? itemsByEstId.get(estId) || [] : [];
      const sub = est ? Number(est.subtotal) || 0 : items.reduce((sum, it) => sum + it.amount, 0);
      const disc = est ? Number(est.discount) || 0 : 0;
      const tx = est ? Number(est.tax) || 0 : 0;
      const tot = est ? Number(est.total_amount) || (sub - disc + tx) : sub;

      return {
        project_id: p.id,
        project_number: p.project_number || "PRJ-000",
        customer_name: p.customer_name || "Customer",
        project_type: p.project_type || undefined,
        address: p.address || undefined,
        estimate_id: estId,
        estimate_number: est?.estimate_number as string | undefined,
        items,
        subtotal: sub,
        discount: disc,
        tax: tx,
        total_amount: tot,
        notes: est?.description as string | undefined,
        updated_at: (est?.updated_at as string) || undefined,
      };
    });

    return { data: result };
  } catch (err: unknown) {
    console.error("[EstimateService] Exception in getAllProjectItemListsService:", err);
    return { data: [], error: err instanceof Error ? err.message : "Error fetching project item lists" };
  }
}

/**
 * Service: Delete the item list for a project
 */
export async function deleteProjectItemListService(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: est } = await supabase
      .from("estimates")
      .select("id")
      .eq("project_id", projectId)
      .maybeSingle();

    if (est?.id) {
      await supabase.from("estimate_items").delete().eq("estimate_id", est.id);
      await supabase.from("estimates").update({
        subtotal: 0,
        discount: 0,
        tax: 0,
        total_amount: 0,
        updated_at: new Date().toISOString(),
      }).eq("id", est.id);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("[EstimateService] Exception in deleteProjectItemListService:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete item list" };
  }
}
