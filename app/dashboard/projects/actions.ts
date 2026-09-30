"use server";

import { revalidatePath } from "next/cache";
import {
  createProjectService,
  getProjectsService,
  getProjectByIdService,
  updateProjectService,
  deleteProjectService,
  Project,
} from "@/services/project.service";
import { validateIndianPhone, PROJECT_TYPES, PROJECT_STATUSES } from "@/lib/project-utils";

export type ProjectRecord = Project;

export async function createProjectAction(prevState: unknown, formData: FormData) {
  try {
    const customer_name = (formData.get("customer_name") as string)?.trim();
    const customer_phone = (formData.get("customer_phone") as string)?.trim() || null;
    const place = (formData.get("place") as string)?.trim() || (formData.get("address") as string)?.trim() || null;
    const project_type = (formData.get("project_type") as string)?.trim() || "Wiring";
    const status = (formData.get("status") as string)?.trim() || "Ongoing";
    const start_date = (formData.get("start_date") as string)?.trim() || null;
    const end_date = (formData.get("end_date") as string)?.trim() || (formData.get("expected_completion_date") as string)?.trim() || null;
    const work_description = (formData.get("work_description") as string)?.trim() || null;

    // Field Validations
    if (!customer_name) {
      return { error: "Name of the client is required." };
    }

    if (!customer_phone) {
      return { error: "Phone number is required." };
    }

    const phoneValidation = validateIndianPhone(customer_phone);
    if (!phoneValidation.isValid) {
      return { error: phoneValidation.error || "Please enter a valid 10-digit Indian phone number." };
    }

    if (!place) {
      return { error: "Place is required." };
    }

    if (!PROJECT_TYPES.includes(project_type as (typeof PROJECT_TYPES)[number])) {
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
      customer_name,
      customer_phone,
      place,
      project_address: place,
      address: place,
      project_type,
      work_description,
      start_date,
      end_date,
      expected_completion_date: end_date,
      status: normalizedStatus,
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

const sampleFallbackProjects: Record<string, ProjectRecord> = {
  "sample-1": {
    id: "sample-1",
    project_number: "PRJ-918234",
    customer_name: "Apex Commercial Plaza",
    customer_phone: "9845012345",
    place: "Kaloor, Kochi",
    address: "Kaloor, Kochi",
    project_type: "Maintenance",
    work_description: "Quarterly electrical maintenance and main distribution board check.",
    start_date: "2026-09-10",
    end_date: "2026-09-22",
    status: "Ongoing",
  },
  "sample-2": {
    id: "sample-2",
    project_number: "PRJ-482019",
    customer_name: "Sarah George",
    customer_phone: "9895123456",
    place: "Palarivattom, Ernakulam",
    address: "Palarivattom, Ernakulam",
    project_type: "Wiring & Plumbing",
    work_description: "Complete concealed wiring and pipe fittings for new villa.",
    start_date: "2026-09-01",
    end_date: "2026-09-15",
    status: "Completed",
  },
  "sample-3": {
    id: "sample-3",
    project_number: "PRJ-631940",
    customer_name: "Rahul Varma",
    customer_phone: "9744112233",
    place: "Marine Drive, Kochi",
    address: "Marine Drive, Kochi",
    project_type: "Wiring",
    work_description: "Living room lighting fixtures and false ceiling electrical work.",
    start_date: "2026-09-18",
    end_date: "2026-09-25",
    status: "Pending",
  },
};

export async function getProjectByIdAction(id: string): Promise<ProjectRecord | null> {
  if (id.startsWith("sample-") && sampleFallbackProjects[id]) {
    return sampleFallbackProjects[id];
  }
  const { data, error } = await getProjectByIdService(id);
  if (error || !data) {
    if (sampleFallbackProjects[id]) return sampleFallbackProjects[id];
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
