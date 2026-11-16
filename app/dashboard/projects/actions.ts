"use server";

import { revalidatePath } from "next/cache";
import {
  createProjectService,
  getProjectsService,
  getProjectByIdService,
  updateProjectService,
  deleteProjectService,
  Project,
  ProjectPlanFile,
} from "@/services/project.service";
import { getExpensesByProjectIdService } from "@/services/expense.service";
import { getPaymentsByProjectIdService } from "@/services/payment.service";
import { getLabourEntriesByProjectService, getLaboursService } from "@/services/labour.service";
import { Expense } from "@/lib/types/expense";
import { Payment } from "@/lib/types/payment";
import { Labour, LabourEntry } from "@/lib/types/labour";
import { validateIndianPhone, PROJECT_TYPES, PROJECT_STATUSES } from "@/lib/project-utils";

export type ProjectRecord = Project;
export type { ProjectPlanFile };

export async function createProjectAction(prevState: unknown, formData: FormData) {
  try {
    const name = (formData.get("name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim() || null;
    const place = (formData.get("place") as string)?.trim() || null;
    const type = (formData.get("type") as string)?.trim() || "Wiring";
    const status = (formData.get("status") as string)?.trim() || "Ongoing";
    const start_date = (formData.get("start_date") as string)?.trim() || null;
    const end_date = (formData.get("end_date") as string)?.trim() || null;
    const description = (formData.get("description") as string)?.trim() || null;

    const plansRaw = (formData.get("plans") as string)?.trim();
    let plans: ProjectPlanFile[] = [];
    if (plansRaw) {
      try {
        plans = JSON.parse(plansRaw);
      } catch (err) {
        console.error("Failed to parse plans JSON:", err);
      }
    }

    // Field Validations
    if (!name) {
      return { error: "Name of the client is required." };
    }

    if (!phone) {
      return { error: "Phone number is required." };
    }

    const phoneValidation = validateIndianPhone(phone);
    if (!phoneValidation.isValid) {
      return { error: phoneValidation.error || "Please enter a valid 10-digit Indian phone number." };
    }

    if (!place) {
      return { error: "Place is required." };
    }

    if (!PROJECT_TYPES.includes(type as (typeof PROJECT_TYPES)[number])) {
      return { error: `Invalid project type. Must be one of: ${PROJECT_TYPES.join(", ")}.` };
    }

    const normalizedStatus = PROJECT_STATUSES.find(
      (s) => s.toLowerCase() === status.toLowerCase()
    ) || "Ongoing";

    // Date validations
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      if (end < start) {
        return { error: "End date cannot be earlier than start date." };
      }
    }

    const { data, error } = await createProjectService({
      name,
      phone,
      place,
      type,
      description,
      start_date,
      end_date,
      status: normalizedStatus,
      plans,
    });

    if (error) {
      return { error };
    }

    revalidatePath("/dashboard/projects");
    return { success: true, project: data };
  } catch (err: unknown) {
    console.error("Failed to execute createProjectAction:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { error: message };
  }
}

export async function getProjectsAction(): Promise<ProjectRecord[]> {
  const { data, error } = await getProjectsService();
  if (error || !data) {
    return [];
  }
  return data;
}

export async function getProjectByIdAction(id: string): Promise<ProjectRecord | null> {
  const { data, error } = await getProjectByIdService(id);
  if (error || !data) {
    return null;
  }
  return data;
}

export async function updateProjectStatusAction(id: string, status: string) {
  try {
    const { data, error } = await updateProjectService(id, { status });
    if (error) return { error };
    revalidatePath("/dashboard/projects");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update project status.";
    return { error: message };
  }
}

export async function updateProjectDescriptionAction(id: string, description: string) {
  try {
    const { data, error } = await updateProjectService(id, { description });
    if (error) return { error };
    revalidatePath(`/dashboard/projects/${id}`);
    revalidatePath("/dashboard/projects");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update project description.";
    return { error: message };
  }
}

export async function deleteProjectAction(id: string) {
  try {
    const { error } = await deleteProjectService(id);
    if (error) return { error };
    revalidatePath("/dashboard/projects");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete project.";
    return { error: message };
  }
}

export async function updateProjectPlansAction(id: string, plans: ProjectPlanFile[]) {
  try {
    const { data, error } = await updateProjectService(id, { plans });
    if (error) return { error };
    revalidatePath(`/dashboard/projects/${id}`);
    revalidatePath("/dashboard/projects");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update project plans.";
    return { error: message };
  }
}

export interface ProjectBundle {
  project: ProjectRecord | null;
  expenses: Expense[];
  payments: Payment[];
  labourEntries: LabourEntry[];
  workers: Labour[];
}

/**
 * Server Action: Fetches all project data (project, expenses, payments, labour, workers)
 * in parallel in a single server-side invocation, reducing 5 network roundtrips to 1.
 */
export async function getProjectBundleAction(id: string): Promise<ProjectBundle> {
  try {
    const [projRes, expRes, payRes, labourRes, laboursList] = await Promise.all([
      getProjectByIdService(id),
      getExpensesByProjectIdService(id),
      getPaymentsByProjectIdService(id),
      getLabourEntriesByProjectService(id),
      getLaboursService(),
    ]);

    return {
      project: projRes.data || null,
      expenses: expRes.data || [],
      payments: payRes.data || [],
      labourEntries: labourRes.data || [],
      workers: laboursList.data || [],
    };
  } catch (err) {
    console.error("Error in getProjectBundleAction:", err);
    return {
      project: null,
      expenses: [],
      payments: [],
      labourEntries: [],
      workers: [],
    };
  }
}

