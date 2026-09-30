"use server";

import { revalidatePath } from "next/cache";
import {
  getEstimatesService,
  getEstimateByIdService,
  updateEstimateStatusService,
  createEstimateService,
  CreateEstimateDTO,
} from "@/services/estimate.service";
import { Estimate, initialSampleEstimates } from "@/lib/types/estimate";

export async function getEstimatesAction(): Promise<Estimate[]> {
  try {
    const { data, error } = await getEstimatesService();
    if (error || !data || data.length === 0) {
      return initialSampleEstimates;
    }
    return data;
  } catch (e) {
    console.error("Error in getEstimatesAction:", e);
    return initialSampleEstimates;
  }
}

export async function getEstimateByIdAction(id: string): Promise<Estimate | null> {
  try {
    const { data } = await getEstimateByIdService(id);
    return data || null;
  } catch (e) {
    console.error(`Error in getEstimateByIdAction (${id}):`, e);
    return null;
  }
}

export async function updateEstimateStatusAction(id: string, status: string) {
  try {
    const { success, error } = await updateEstimateStatusService(id, status);
    if (error) return { error };
    revalidatePath("/dashboard/estimates");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update estimate status.";
    return { error: message };
  }
}

export async function createEstimateAction(input: CreateEstimateDTO) {
  try {
    const { data, error } = await createEstimateService(input);
    if (error) return { error };
    revalidatePath("/dashboard/estimates");
    revalidatePath("/dashboard/projects");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create estimate in database.";
    return { error: message };
  }
}
