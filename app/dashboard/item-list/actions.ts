"use server";

import { revalidatePath } from "next/cache";
import {
  getAllProjectItemListsService,
  getProjectItemListService,
  saveProjectItemListService,
  deleteProjectItemListService,
} from "@/services/estimate.service";
import { getMaterialsService } from "@/services/material.service";
import { EstimateItem, ProjectItemList } from "@/lib/types/estimate";
import { Material } from "@/lib/types/material";

/**
 * Fetch all projects and their corresponding item lists
 */
export async function getAllProjectItemListsAction(): Promise<{ data: ProjectItemList[]; error?: string }> {
  try {
    return await getAllProjectItemListsService();
  } catch (err: unknown) {
    console.error("Error in getAllProjectItemListsAction:", err);
    return { data: [], error: err instanceof Error ? err.message : "Failed to load project item lists." };
  }
}

/**
 * Fetch the item list for a specific project
 */
export async function getProjectItemListAction(
  projectId: string
): Promise<{ data?: ProjectItemList; error?: string }> {
  try {
    return await getProjectItemListService(projectId);
  } catch (err: unknown) {
    console.error(`Error in getProjectItemListAction (${projectId}):`, err);
    return { error: err instanceof Error ? err.message : "Failed to load project items." };
  }
}

/**
 * Save or update the item list for a specific project
 */
export async function saveProjectItemListAction(input: {
  projectId: string;
  items: EstimateItem[];
  notes?: string;
  discount?: number;
  tax?: number;
}): Promise<{ data?: ProjectItemList; error?: string }> {
  try {
    const res = await saveProjectItemListService(input);
    if (!res.error) {
      revalidatePath("/dashboard/item-list");
      revalidatePath("/dashboard/projects");
      revalidatePath("/dashboard/estimates");
    }
    return res;
  } catch (err: unknown) {
    console.error("Error in saveProjectItemListAction:", err);
    return { error: err instanceof Error ? err.message : "Failed to save project item list." };
  }
}

/**
 * Clear/delete items for a project
 */
export async function deleteProjectItemListAction(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await deleteProjectItemListService(projectId);
    if (res.success) {
      revalidatePath("/dashboard/item-list");
      revalidatePath("/dashboard/projects");
      revalidatePath("/dashboard/estimates");
    }
    return res;
  } catch (err: unknown) {
    console.error("Error in deleteProjectItemListAction:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete item list." };
  }
}

/**
 * Fetch material catalogue items for quick item selection
 */
export async function getCatalogueMaterialsAction(): Promise<Material[]> {
  try {
    const { data } = await getMaterialsService();
    return data || [];
  } catch (err) {
    console.error("Error in getCatalogueMaterialsAction:", err);
    return [];
  }
}
