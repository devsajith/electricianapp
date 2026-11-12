"use server";

import { revalidatePath } from "next/cache";
import {
  getMaterialListsService,
  getMaterialListByIdService,
  createMaterialListService,
  deleteMaterialListService,
  addMaterialListItemService,
  addMaterialListItemsBatchService,
  deleteMaterialListItemService,
  updateMaterialListItemQtyService,
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

export async function addMaterialListItemAction(
  listId: string,
  item: {
    material_id?: string | null;
    name: string;
    cat?: string | null;
    brand?: string | null;
    unit: string;
    qty: number;
  }
) {
  try {
    if (!item.name || !item.name.trim()) {
      return { error: "Please enter an item name." };
    }
    const { data, error } = await addMaterialListItemService(listId, item);
    if (error || !data) {
      return { error: error || "Failed to add item to material list." };
    }
    revalidatePath(`/dashboard/item-list/${listId}`);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add item.";
    return { error: message };
  }
}

export async function addMaterialListItemsBatchAction(
  listId: string,
  items: {
    material_id?: string | null;
    name: string;
    cat?: string | null;
    brand?: string | null;
    unit: string;
    qty: number;
  }[]
) {
  try {
    if (!items || items.length === 0) {
      return { error: "No items selected to add." };
    }
    const { data, error } = await addMaterialListItemsBatchService(listId, items);
    if (error || !data) {
      return { error: error || "Failed to add items to material list." };
    }
    revalidatePath(`/dashboard/item-list/${listId}`);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add items.";
    return { error: message };
  }
}

export async function updateMaterialListItemQtyAction(
  itemId: string,
  qty: number,
  listId?: string
) {
  try {
    const { success, error } = await updateMaterialListItemQtyService(itemId, qty);
    if (!success) {
      return { error: error || "Failed to update item quantity." };
    }
    if (listId) {
      revalidatePath(`/dashboard/item-list/${listId}`);
    }
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update quantity.";
    return { error: message };
  }
}

export async function deleteMaterialListItemAction(
  itemId: string,
  listId: string
) {
  try {
    const { success, error } = await deleteMaterialListItemService(itemId);
    if (!success) {
      return { error: error || "Failed to delete item." };
    }
    revalidatePath(`/dashboard/item-list/${listId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete item.";
    return { error: message };
  }
}
