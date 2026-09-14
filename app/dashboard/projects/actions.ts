"use server";

import { revalidatePath } from "next/cache";
import {
  createProjectService,
  getProjectsService,
  updateProjectService,
  deleteProjectService,
  Project,
} from "@/services/project.service";

export type ProjectRecord = Project;

export async function createProjectAction(prevState: unknown, formData: FormData) {
  try {
    const customer_name = formData.get("customer_name") as string;

    if (!customer_name || !customer_name.trim()) {
      return { error: "Customer Name is required." };
    }

    const { data, error } = await createProjectService({
      customer_name: customer_name.trim(),
      customer_phone: (formData.get("customer_phone") as string) || null,
      address: (formData.get("address") as string) || null,
      project_type: (formData.get("project_type") as string) || "Residential Wiring",
      work_description: (formData.get("work_description") as string) || null,
      start_date: (formData.get("start_date") as string) || null,
      expected_completion_date: (formData.get("expected_completion_date") as string) || null,
      status: (formData.get("status") as string) || "Pending",
      notes: (formData.get("notes") as string) || null,
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
