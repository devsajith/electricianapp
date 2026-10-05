"use server";

import { revalidatePath } from "next/cache";
import {
  getQuotationsService,
  getQuotationByIdService,
  updateQuotationService,
  createQuotationService,
  deleteQuotationService,
} from "@/services/quotation.service";
import { Quotation, CreateQuotationDTO } from "@/lib/types/quotation";

export async function getQuotationsAction(): Promise<Quotation[]> {
  try {
    const { data, error } = await getQuotationsService();
    if (error || !data || data.length === 0) {
      return [];
    }
    return data;
  } catch (e) {
    console.error("Error in getQuotationsAction:", e);
    return [];
  }
}

export async function getQuotationByIdAction(id: string): Promise<Quotation | null> {
  try {
    const { data } = await getQuotationByIdService(id);
    return data || null;
  } catch (e) {
    console.error(`Error in getQuotationByIdAction (${id}):`, e);
    return null;
  }
}

export async function updateQuotationStatusAction(id: string, status: string) {
  try {
    const { error } = await updateQuotationService(id, { status });
    if (error) return { error };
    revalidatePath("/dashboard/estimates");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update quotation status.";
    return { error: message };
  }
}

export async function createQuotationAction(input: CreateQuotationDTO) {
  try {
    const { data, error } = await createQuotationService(input);
    if (error) return { error };
    revalidatePath("/dashboard/estimates");
    revalidatePath("/dashboard/projects");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create quotation in database.";
    return { error: message };
  }
}

export async function deleteQuotationAction(id: string) {
  try {
    const { error } = await deleteQuotationService(id);
    if (error) return { error };
    revalidatePath("/dashboard/estimates");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete quotation.";
    return { error: message };
  }
}
