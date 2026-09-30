import { createClient } from "@/lib/supabase/server";
import { Material, initialSampleMaterials } from "@/lib/types/material";
import { withTimeout } from "@/lib/timeout";

export interface CreateMaterialDTO {
  item_name: string;
  category: string;
  brand?: string | null;
  unit: string;
  default_price: number;
  supplier?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export interface UpdateMaterialDTO {
  item_name?: string;
  category?: string;
  brand?: string | null;
  unit?: string;
  default_price?: number;
  supplier?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

/**
 * Service: Fetch all material records from Supabase material_catalogue table
 */
export async function getMaterialsService(): Promise<{ data: Material[]; error?: string }> {
  return withTimeout(
    (async () => {
      try {
        const supabase = await createClient();

        // Query the exact Supabase table: material_catalogue
        let { data, error } = await supabase
          .from("material_catalogue")
          .select("*")
          .order("created_at", { ascending: false });

        // Fallback if table name is plural materials
        if (error && (error.code === "PGRST205" || error.message.includes("does not exist"))) {
          console.warn("[MaterialService] material_catalogue table not found, trying materials fallback table");
          const fallback = await supabase
            .from("materials")
            .select("*")
            .order("created_at", { ascending: false });
          data = fallback.data;
          error = fallback.error;
        }

        if (error) {
          console.error("[MaterialService] Supabase materials query error:", error.message);
          return { data: initialSampleMaterials };
        }

        if (!data || data.length === 0) {
          return { data: initialSampleMaterials };
        }

        const rows = data as Record<string, unknown>[];
        const items: Material[] = rows.map((row) => {
          const price = Number(row.default_price ?? row.unit_price ?? row.price ?? 0);
          return {
            id: String(row.id || `mat-${Date.now()}`),
            item_name: String(row.item_name || row.name || "Electrical Material"),
            category: String(row.category || "General"),
            brand: row.brand ? String(row.brand) : null,
            unit: String(row.unit || "nos"),
            default_price: price,
            supplier: row.supplier ? String(row.supplier) : null,
            notes: row.notes ? String(row.notes) : (row.description ? String(row.description) : null),
            is_active: typeof row.is_active === "boolean" ? row.is_active : row.status !== "Inactive",
            created_at: String(row.created_at || new Date().toISOString()),
            updated_at: row.updated_at ? String(row.updated_at) : undefined,
          };
        });

        return { data: items };
      } catch (err) {
        console.error("[MaterialService] Exception fetching materials:", err);
        return { data: initialSampleMaterials };
      }
    })(),
    { data: initialSampleMaterials },
    2500
  );
}

/**
 * Service: Fetch a single material by ID from material_catalogue
 */
export async function getMaterialByIdService(
  id: string
): Promise<{ data?: Material; error?: string }> {
  const fallbackSample = initialSampleMaterials.find((m) => m.id === id);
  return withTimeout(
    (async () => {
      try {
        const supabase = await createClient();

        let { data, error } = await supabase
          .from("material_catalogue")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error && (error.code === "PGRST205" || error.message.includes("does not exist"))) {
          const fallback = await supabase
            .from("materials")
            .select("*")
            .eq("id", id)
            .maybeSingle();
          data = fallback.data;
          error = fallback.error;
        }

        if (!error && data) {
          const row = data as Record<string, unknown>;
          const price = Number(row.default_price ?? row.unit_price ?? 0);
          const material: Material = {
            id: String(row.id),
            item_name: String(row.item_name || row.name),
            category: String(row.category),
            brand: row.brand ? String(row.brand) : null,
            unit: String(row.unit),
            default_price: price,
            supplier: row.supplier ? String(row.supplier) : null,
            notes: row.notes ? String(row.notes) : (row.description ? String(row.description) : null),
            is_active: typeof row.is_active === "boolean" ? row.is_active : row.status !== "Inactive",
            created_at: String(row.created_at || new Date().toISOString()),
            updated_at: row.updated_at ? String(row.updated_at) : undefined,
          };
          return { data: material };
        }

        if (fallbackSample) {
          return { data: fallbackSample };
        }

        return { error: "Material not found" };
      } catch (err) {
        console.error(`[MaterialService] Exception fetching material ${id}:`, err);
        if (fallbackSample) return { data: fallbackSample };
        return { error: "Failed to fetch material details" };
      }
    })(),
    fallbackSample ? { data: fallbackSample } : { error: "Material not found" },
    2500
  );
}

/**
 * Service: Create a new material record directly in Supabase material_catalogue table
 */
export async function createMaterialService(
  input: CreateMaterialDTO
): Promise<{ data?: Material; error?: string }> {
  try {
    const supabase = await createClient();

    // Exact columns for material_catalogue table:
    // item_name, category, brand, unit, default_price, supplier, notes, is_active
    const payload = {
      item_name: (input.item_name ?? "").trim(),
      category: (input.category ?? "").trim(),
      brand: input.brand ? String(input.brand).trim() : null,
      unit: (input.unit ?? "").trim(),
      default_price: Number(input.default_price) || 0,
      supplier: input.supplier ? String(input.supplier).trim() : null,
      notes: input.notes ? String(input.notes).trim() : null,
      is_active: input.is_active ?? true,
    };

    let { data, error } = await supabase
      .from("material_catalogue")
      .insert(payload)
      .select()
      .maybeSingle();

    // Fallback to materials table if material_catalogue table name differs
    if (error && (error.code === "PGRST205" || error.message.includes("does not exist"))) {
      console.warn("[MaterialService] material_catalogue table missing, inserting into materials fallback table");
      const fallbackPayload = {
        name: input.item_name.trim(),
        item_name: input.item_name.trim(),
        category: input.category.trim(),
        brand: input.brand ? input.brand.trim() : null,
        unit: input.unit.trim(),
        unit_price: Number(input.default_price) || 0,
        default_price: Number(input.default_price) || 0,
        supplier: input.supplier ? input.supplier.trim() : null,
        description: input.notes ? input.notes.trim() : null,
        notes: input.notes ? input.notes.trim() : null,
        is_active: input.is_active ?? true,
      };

      const fallbackRes = await supabase
        .from("materials")
        .insert(fallbackPayload)
        .select()
        .maybeSingle();

      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      console.error("[MaterialService] Supabase insert error:", error);
      return { error: `Supabase database error: ${error.message}` };
    }

    const row = (data || {}) as Record<string, unknown>;
    const createdPrice = Number(row.default_price ?? input.default_price);
    const createdMaterial: Material = {
      id: String(row.id || `mat-${Date.now()}`),
      item_name: String(row.item_name || input.item_name),
      category: String(row.category || input.category),
      brand: row.brand ? String(row.brand) : (input.brand || null),
      unit: String(row.unit || input.unit),
      default_price: createdPrice,
      supplier: row.supplier ? String(row.supplier) : (input.supplier || null),
      notes: row.notes ? String(row.notes) : (input.notes || null),
      is_active: typeof row.is_active === "boolean" ? row.is_active : (input.is_active ?? true),
      created_at: String(row.created_at || new Date().toISOString()),
    };

    return { data: createdMaterial };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create material in Supabase";
    console.error("[MaterialService] Exception in createMaterialService:", err);
    return { error: message };
  }
}

/**
 * Service: Toggle or update material is_active status
 */
export async function updateMaterialStatusService(
  id: string,
  is_active: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    let { error } = await supabase
      .from("material_catalogue")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error && (error.code === "PGRST205" || error.message.includes("does not exist"))) {
      const fallback = await supabase
        .from("materials")
        .update({ is_active, status: is_active ? "Active" : "Inactive", updated_at: new Date().toISOString() })
        .eq("id", id);
      error = fallback.error;
    }

    if (error) {
      console.error(`[MaterialService] Update status DB error: ${error.message}`);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update material status";
    return { success: false, error: message };
  }
}

/**
 * Service: Delete material record
 */
export async function deleteMaterialService(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    let { error } = await supabase.from("material_catalogue").delete().eq("id", id);

    if (error && (error.code === "PGRST205" || error.message.includes("does not exist"))) {
      const fallback = await supabase.from("materials").delete().eq("id", id);
      error = fallback.error;
    }

    if (error) {
      console.error(`[MaterialService] Delete DB error: ${error.message}`);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete material";
    return { success: false, error: message };
  }
}
