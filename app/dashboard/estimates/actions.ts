"use server";

import { revalidatePath } from "next/cache";
import {
  getQuotationsService,
  getQuotationByIdService,
  updateQuotationService,
  createQuotationService,
  deleteQuotationService,
} from "@/services/quotation.service";
import { createProjectService } from "@/services/project.service";
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

export async function updateQuotationAction(id: string, input: Partial<CreateQuotationDTO>) {
  try {
    const { data, error } = await updateQuotationService(id, input);
    if (error) return { error };
    revalidatePath("/dashboard/estimates");
    revalidatePath(`/dashboard/estimates/${id}`);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update quotation.";
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

export async function convertQuotationToProjectAction(id: string) {
  try {
    const { data: quotation, error: qError } = await getQuotationByIdService(id);
    if (qError || !quotation) {
      return { error: qError || "Quotation not found" };
    }

    // Determine project type from quotation
    let pType = "Wiring";
    const rawType = (quotation.project_type || "").toLowerCase();
    if (rawType.includes("plumb") && rawType.includes("wir")) {
      pType = "Wiring & Plumbing";
    } else if (rawType.includes("plumb")) {
      pType = "Plumbing";
    } else {
      pType = "Wiring";
    }

    const itemsSummary =
      quotation.items && quotation.items.length > 0
        ? quotation.items
            .map(
              (it, idx) =>
                `${idx + 1}. ${it.description} (${it.unit}) - Rs. ${it.rate}`
            )
            .join("\n")
        : "";

    const description = [
      `Converted from Quotation #${quotation.quotation_number}`,
      quotation.subject ? `Subject: ${quotation.subject}` : "",
      itemsSummary ? `\nRate Schedule Items:\n${itemsSummary}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const { data: project, error: pError } = await createProjectService({
      name: quotation.client_name,
      phone: quotation.client_phone || null,
      place: quotation.client_place || null,
      type: pType,
      status: "Ongoing",
      description,
    });

    if (pError || !project) {
      return { error: pError || "Failed to create project from quotation" };
    }

    // Set quotation status to Approved
    await updateQuotationService(id, { status: "Approved" });

    revalidatePath("/dashboard/projects");
    revalidatePath("/dashboard/estimates");
    revalidatePath(`/dashboard/estimates/${id}`);

    return { success: true, project };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to convert quotation to project.";
    return { error: message };
  }
}
