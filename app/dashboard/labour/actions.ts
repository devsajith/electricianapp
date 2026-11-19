"use server";

import { revalidatePath } from "next/cache";
import {
  getLaboursService,
  getLabourByIdService,
  createLabourService,
  deleteLabourService,
  getLabourEntriesService,
  createLabourEntryService,
  deleteLabourEntryService,
} from "@/services/labour.service";
import { getProjectsService, Project } from "@/services/project.service";
import { Labour, CreateLabourDTO, LabourEntry, CreateLabourEntryDTO } from "@/lib/types/labour";

export interface LabourBundle {
  worker: Labour | null;
  entries: LabourEntry[];
  projects: Project[];
}

export async function getLabourBundleAction(id: string): Promise<LabourBundle> {
  try {
    const [workerRes, entriesRes, projsRes] = await Promise.all([
      getLabourByIdService(id),
      getLabourEntriesService(id),
      getProjectsService(),
    ]);

    return {
      worker: workerRes.data || null,
      entries: entriesRes.data || [],
      projects: projsRes.data || [],
    };
  } catch (err) {
    console.error("Error in getLabourBundleAction:", err);
    return { worker: null, entries: [], projects: [] };
  }
}

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
    const { error } = await deleteLabourService(id);
    if (error) return { error };
    revalidatePath("/dashboard/labour");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete labour.";
    return { error: message };
  }
}

export async function getLabourEntriesAction(
  workerId?: string,
  projectId?: string
): Promise<LabourEntry[]> {
  try {
    const { data } = await getLabourEntriesService(workerId, projectId);
    return data || [];
  } catch (err) {
    console.error("Error in getLabourEntriesAction:", err);
    return [];
  }
}

export async function getLabourEntriesByProjectAction(projectId: string): Promise<LabourEntry[]> {
  return getLabourEntriesAction(undefined, projectId);
}

export async function createLabourEntryAction(input: CreateLabourEntryDTO) {
  try {
    const { data, error } = await createLabourEntryService(input);
    if (error || !data) {
      return { error: error || "Failed to save work entry." };
    }
    revalidatePath("/dashboard/labour");
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/projects");
    revalidatePath("/dashboard/reports");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save work entry.";
    return { error: message };
  }
}

export async function deleteLabourEntryAction(id: string) {
  try {
    const { error } = await deleteLabourEntryService(id);
    if (error) return { error };
    revalidatePath("/dashboard/labour");
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/projects");
    revalidatePath("/dashboard/reports");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete work entry.";
    return { error: message };
  }
}
