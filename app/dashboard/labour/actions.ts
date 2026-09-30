"use server";

import { revalidatePath } from "next/cache";
import {
  getLaboursService,
  createLabourService,
  deleteLabourService,
  getLabourEntriesService,
  createLabourEntryService,
  deleteLabourEntryService,
} from "@/services/labour.service";
import { Labour, CreateLabourDTO, LabourEntry, CreateLabourEntryDTO } from "@/lib/types/labour";

export async function getLaboursAction(): Promise<Labour[]> {
  try {
    const { data } = await getLaboursService();
    return data || [];
  } catch (err) {
    console.error("Error in getLaboursAction:", err);
    return [];
  }
}

export async function createLabourAction(input: CreateLabourDTO) {
  try {
    const { data, error } = await createLabourService(input);
    if (error || !data) {
      return { error: error || "Failed to add labour." };
    }
    revalidatePath("/dashboard/labour");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add labour.";
    return { error: message };
  }
}

export async function deleteLabourAction(id: string) {
  try {
    const { success, error } = await deleteLabourService(id);
    if (error) return { error };
    revalidatePath("/dashboard/labour");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete labour.";
    return { error: message };
  }
}

export async function getLabourEntriesAction(workerId?: string): Promise<LabourEntry[]> {
  try {
    const { data } = await getLabourEntriesService(workerId);
    return data || [];
  } catch (err) {
    console.error("Error in getLabourEntriesAction:", err);
    return [];
  }
}

export async function createLabourEntryAction(input: CreateLabourEntryDTO) {
  try {
    const { data, error } = await createLabourEntryService(input);
    if (error || !data) {
      return { error: error || "Failed to save work entry." };
    }
    revalidatePath("/dashboard/labour");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save work entry.";
    return { error: message };
  }
}

export async function deleteLabourEntryAction(id: string) {
  try {
    const { success, error } = await deleteLabourEntryService(id);
    if (error) return { error };
    revalidatePath("/dashboard/labour");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete work entry.";
    return { error: message };
  }
}
