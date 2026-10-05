"use server";

import { revalidatePath } from "next/cache";
import {
  getMaterialsService,
  getMaterialByIdService,
  createMaterialService,
  deleteMaterialService,
} from "@/services/material.service";
import { Material, CreateMaterialDTO } from "@/lib/types/material";

export async function getMaterialsAction(): Promise<Material[]> {
  try {
    const { data } = await getMaterialsService();
    return data || [];
  } catch (err) {
    console.error("Error in getMaterialsAction:", err);
    return [];
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
    const { data, error } = await createMaterialService(input);
    if (error || !data) {
      return { error: error || "Failed to create material record." };
    }
    revalidatePath("/dashboard/materials");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create material.";
    return { error: message };
  }
}

export async function deleteMaterialAction(id: string) {
  try {
    const { error } = await deleteMaterialService(id);
    if (error) return { error };
    revalidatePath("/dashboard/materials");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete material.";
    return { error: message };
  }
}
