"use server";

import { revalidatePath } from "next/cache";
import {
  getMaterialListsService,
  getMaterialListByIdService,
  createMaterialListService,
  deleteMaterialListService,
  toggleMaterialListItemPurchasedService,
  getMaterialsService,
} from "@/services/material.service";
import { getProjectsService } from "@/services/project.service";
import {
  MaterialList,
  MaterialListItem,
  CreateMaterialListDTO,
  Material,
} from "@/lib/types/material";

export async function getMaterialListsAction(): Promise<MaterialList[]> {
  try {
    const { data } = await getMaterialListsService();
    return data || [];
  } catch (err) {
    console.error("Error in getMaterialListsAction:", err);
    return [];
  }
}

export async function getMaterialListByIdAction(
  id: string
): Promise<{ list: MaterialList; items: MaterialListItem[] } | null> {
  try {
    const { data } = await getMaterialListByIdService(id);
    return data || null;
  } catch (err) {
    console.error(`Error in getMaterialListByIdAction (${id}):`, err);
    return null;
  }
}

export async function createMaterialListAction(input: CreateMaterialListDTO) {
  try {
    if (!input.title || !input.title.trim()) {
      return { error: "Please enter a title for the material list." };
    }

    if (!input.items || input.items.length === 0) {
      return { error: "Please add at least one material to the list." };
    }

    const { data, error } = await createMaterialListService(input);

    if (error || !data) {
      return { error: error || "Failed to create material list." };
    }

    revalidatePath("/dashboard/item-list");
    if (input.project_id) {
      revalidatePath(`/dashboard/projects/${input.project_id}`);
    }

    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create material list.";
    return { error: message };
  }
}

export async function deleteMaterialListAction(id: string) {
  try {
    const { success, error } = await deleteMaterialListService(id);
    if (!success) {
      return { error: error || "Failed to delete material list." };
    }

    revalidatePath("/dashboard/item-list");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete material list.";
    return { error: message };
  }
}

export async function toggleItemPurchasedAction(
  itemId: string,
  isPurchased: boolean,
  listId?: string
) {
  try {
    const { success, error } = await toggleMaterialListItemPurchasedService(itemId, isPurchased);
    if (!success) {
      return { error: error || "Failed to update item status." };
    }

    if (listId) {
      revalidatePath(`/dashboard/item-list/${listId}`);
    }
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to update item." };
  }
}

export async function getMaterialsCatalogAction(): Promise<Material[]> {
  try {
    const { data } = await getMaterialsService();
    return data || [];
  } catch (err) {
    console.error("Error fetching materials catalog for item list:", err);
    return [];
  }
}

export async function getProjectsForListAction(): Promise<
  { id: string; project_number: string; name: string; place?: string | null }[]
> {
  try {
    const { data } = await getProjectsService();
    return (data || [])
      .filter((p) => p.id)
      .map((p) => ({
        id: p.id!,
        project_number: p.project_number,
        name: p.name,
        place: p.place,
      }));
  } catch (err) {
    console.error("Error fetching projects for material list:", err);
    return [];
  }
}
