"use server";

import { revalidatePath } from "next/cache";
import {
  getMaterialsService,
  getMaterialByIdService,
  createMaterialService,
  updateMaterialStatusService,
  deleteMaterialService,
  CreateMaterialDTO,
} from "@/services/material.service";
import { Material, initialSampleMaterials } from "@/lib/types/material";

export async function getMaterialsAction(): Promise<Material[]> {
  try {
    const { data } = await getMaterialsService();
    return data || initialSampleMaterials;
  } catch (err) {
    console.error("Error in getMaterialsAction:", err);
    return initialSampleMaterials;
  }
}

export async function getMaterialByIdAction(id: string): Promise<Material | null> {
  try {
    const { data } = await getMaterialByIdService(id);
    return data || null;
  } catch (err) {
    console.error(`Error in getMaterialByIdAction (${id}):`, err);
    return null;
  }
}

export async function createMaterialAction(input: CreateMaterialDTO) {
  try {
    console.log("[createMaterialAction] INPUT:", JSON.stringify(input));
    const { data, error } = await createMaterialService(input);
    console.log("[createMaterialAction] RESULT data:", JSON.stringify(data));
    console.log("[createMaterialAction] RESULT error:", error);
    if (error || !data) {
      return { error: error || "Failed to create material record in Supabase." };
    }
    revalidatePath("/dashboard/materials");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create material.";
    console.error("[createMaterialAction] EXCEPTION:", err);
    return { error: message };
  }
}

export async function toggleMaterialStatusAction(id: string, is_active: boolean) {
  try {
    const { success, error } = await updateMaterialStatusService(id, is_active);
    if (error) return { error };
    revalidatePath("/dashboard/materials");
    revalidatePath(`/dashboard/materials/${id}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to toggle status.";
    return { error: message };
  }
}

export async function deleteMaterialAction(id: string) {
  try {
    const { success, error } = await deleteMaterialService(id);
    if (error) return { error };
    revalidatePath("/dashboard/materials");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete material.";
    return { error: message };
  }
}
