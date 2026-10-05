import { createClient } from "@/lib/supabase/server";
import {
  Material,
  MaterialList,
  MaterialListItem,
  CreateMaterialDTO,
  CreateMaterialListDTO,
  CreateMaterialListItemDTO,
} from "@/lib/types/material";
import { withTimeout } from "@/lib/timeout";

export type { CreateMaterialDTO };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id?: string | null): boolean {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

const MATERIAL_COLUMNS = "id, name, brand, unit, created_at, updated_at";
const MATERIAL_LIST_COLUMNS =
  "id, project_id, title, created_at, updated_at, projects(project_number, name)";
const MATERIAL_LIST_ITEM_COLUMNS =
  "id, list_id, material_id, qty, rate, amount, created_at, materials(name, brand, unit)";

interface MaterialListDbRow {
  id: string;
  project_id: string;
  projects?: {
    project_number?: string;
    name?: string;
  } | null;
  title: string;
  created_at?: string;
  updated_at?: string;
}

interface MaterialListItemDbRow {
  id: string;
  list_id: string;
  material_id: string;
  materials?: {
    name?: string;
    brand?: string | null;
    unit?: string;
  } | null;
  qty: number | string;
  rate?: number | string;
  amount?: number | string;
  created_at?: string;
}

export async function getMaterialsService(): Promise<{ data: Material[]; error?: string }> {
  return withTimeout(
    (async () => {
      try {
        const supabase = await createClient();

        const { data, error } = await supabase
          .from("materials")
          .select(MATERIAL_COLUMNS)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching materials:", error.message || error);
          return { data: [], error: error.message };
        }

        const formattedData: Material[] = ((data as unknown as Material[]) || []).map((row) => ({
          id: row.id,
          name: row.name,
          brand: row.brand || null,
          unit: row.unit,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }));

        return { data: formattedData };
      } catch (error) {
        console.error("Service error (getMaterials):", error);
        return { data: [], error: error instanceof Error ? error.message : "Internal server error" };
      }
    })(),
    { data: [], error: "timeout" },
    2500
  );
}

export async function getMaterialByIdService(id: string): Promise<{ data?: Material; error?: string }> {
  if (!isValidUUID(id)) {
    return { error: "Invalid material ID format." };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("materials")
      .select(MATERIAL_COLUMNS)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching material:", error);
      return { error: "Failed to fetch material" };
    }

    return { data: data as Material };
  } catch (error) {
    console.error("Service error (getMaterialById):", error);
    return { error: "Internal server error" };
  }
}

export async function createMaterialService(
  input: CreateMaterialDTO
): Promise<{ data?: Material; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("materials")
      .insert({
        name: input.name,
        brand: input.brand || null,
        unit: input.unit || "nos",
      })
      .select(MATERIAL_COLUMNS)
      .single();

    if (error) {
      console.error("Error creating material:", error);
      return { error: "Failed to create material" };
    }

    return { data: data as Material };
  } catch (error) {
    console.error("Service error (createMaterial):", error);
    return { error: "Internal server error" };
  }
}

export async function updateMaterialService(
  id: string,
  input: Partial<{ name: string; brand: string; unit: string }>
): Promise<{ data?: Material; error?: string }> {
  if (!isValidUUID(id)) {
    return { error: "Invalid material ID format." };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("materials")
      .update(input)
      .eq("id", id)
      .select(MATERIAL_COLUMNS)
      .single();

    if (error) {
      console.error("Error updating material:", error);
      return { error: "Failed to update material" };
    }

    return { data: data as Material };
  } catch (error) {
    console.error("Service error (updateMaterial):", error);
    return { error: "Internal server error" };
  }
}

export async function deleteMaterialService(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isValidUUID(id)) {
    return { success: false, error: "Invalid material ID format." };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting material:", error);
      return { success: false, error: "Failed to delete material" };
    }

    return { success: true };
  } catch (error) {
    console.error("Service error (deleteMaterial):", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function getMaterialListsService(): Promise<{ data: MaterialList[]; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("material_lists")
      .select(MATERIAL_LIST_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching material lists:", error);
      return { data: [], error: "Failed to fetch material lists" };
    }

    const formattedData: MaterialList[] = ((data as unknown as MaterialListDbRow[]) || []).map((row) => ({
      id: row.id,
      project_id: row.project_id,
      project_number: row.projects?.project_number,
      project_name: row.projects?.name,
      title: row.title,
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at,
    }));

    return { data: formattedData };
  } catch (error) {
    console.error("Service error (getMaterialLists):", error);
    return { data: [], error: "Internal server error" };
  }
}

/**
 * Service: Fetch material list and its items in PARALLEL via Promise.all
 * Eliminates sequential query waterfall
 */
export async function getMaterialListByIdService(
  id: string
): Promise<{ data?: { list: MaterialList; items: MaterialListItem[] }; error?: string }> {
  if (!isValidUUID(id)) {
    return { error: "Invalid material list ID format." };
  }

  try {
    const supabase = await createClient();

    // Parallelize list metadata and list items fetching
    const [listRes, itemsRes] = await Promise.all([
      supabase
        .from("material_lists")
        .select(MATERIAL_LIST_COLUMNS)
        .eq("id", id)
        .single(),
      supabase
        .from("material_list_items")
        .select(MATERIAL_LIST_ITEM_COLUMNS)
        .eq("list_id", id)
        .order("created_at", { ascending: true }),
    ]);

    if (listRes.error) {
      console.error("Error fetching material list:", listRes.error);
      return { error: "Failed to fetch material list" };
    }

    if (itemsRes.error) {
      console.error("Error fetching material list items:", itemsRes.error);
      return { error: "Failed to fetch material list items" };
    }

    const listRow = listRes.data as unknown as MaterialListDbRow;
    const formattedList: MaterialList = {
      id: listRow.id,
      project_id: listRow.project_id,
      project_number: listRow.projects?.project_number,
      project_name: listRow.projects?.name,
      title: listRow.title,
      created_at: listRow.created_at || new Date().toISOString(),
      updated_at: listRow.updated_at,
    };

    const formattedItems: MaterialListItem[] = ((itemsRes.data as unknown as MaterialListItemDbRow[]) || []).map((row) => ({
      id: row.id,
      list_id: row.list_id,
      material_id: row.material_id,
      material_name: row.materials?.name,
      material_brand: row.materials?.brand,
      material_unit: row.materials?.unit,
      qty: Number(row.qty),
      rate: Number(row.rate) || 0,
      amount: Number(row.amount) || 0,
      created_at: row.created_at || new Date().toISOString(),
    }));

    return { data: { list: formattedList, items: formattedItems } };
  } catch (error) {
    console.error("Service error (getMaterialListById):", error);
    return { error: "Internal server error" };
  }
}

export async function createMaterialListService(
  input: CreateMaterialListDTO
): Promise<{ data?: MaterialList; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("material_lists")
      .insert({
        project_id: input.project_id,
        title: input.title,
      })
      .select(MATERIAL_LIST_COLUMNS)
      .single();

    if (error) {
      console.error("Error creating material list:", error);
      return { error: "Failed to create material list" };
    }

    return { data: data as MaterialList };
  } catch (error) {
    console.error("Service error (createMaterialList):", error);
    return { error: "Internal server error" };
  }
}

export async function addMaterialListItemService(
  input: CreateMaterialListItemDTO
): Promise<{ data?: MaterialListItem; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("material_list_items")
      .insert({
        list_id: input.list_id,
        material_id: input.material_id,
        qty: Number(input.qty),
        rate: Number(input.rate) || 0,
        amount: Number(input.amount) || 0,
      })
      .select(MATERIAL_LIST_ITEM_COLUMNS)
      .single();

    if (error) {
      console.error("Error adding material list item:", error);
      return { error: "Failed to add material list item" };
    }

    const row = data as unknown as MaterialListItemDbRow;
    return {
      data: {
        id: row.id,
        list_id: row.list_id,
        material_id: row.material_id,
        material_name: row.materials?.name,
        material_brand: row.materials?.brand,
        material_unit: row.materials?.unit,
        qty: Number(row.qty),
        rate: Number(row.rate) || 0,
        amount: Number(row.amount) || 0,
        created_at: row.created_at || new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Service error (addMaterialListItem):", error);
    return { error: "Internal server error" };
  }
}

export async function deleteMaterialListItemService(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isValidUUID(id)) {
    return { success: false, error: "Invalid material list item ID format." };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("material_list_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting material list item:", error);
      return { success: false, error: "Failed to delete material list item" };
    }

    return { success: true };
  } catch (error) {
    console.error("Service error (deleteMaterialListItem):", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function deleteMaterialListService(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isValidUUID(id)) {
    return { success: false, error: "Invalid material list ID format." };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("material_lists")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting material list:", error);
      return { success: false, error: "Failed to delete material list" };
    }

    return { success: true };
  } catch (error) {
    console.error("Service error (deleteMaterialList):", error);
    return { success: false, error: "Internal server error" };
  }
}
