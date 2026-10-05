import { createClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/timeout";

export interface Project {
  id?: string;
  project_number: string;
  name: string;
  phone?: string | null;
  place?: string | null;
  type: string;
  status: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProjectDTO {
  project_number?: string;
  name: string;
  phone?: string | null;
  place?: string | null;
  type?: string;
  status?: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface UpdateProjectDTO {
  name?: string;
  phone?: string | null;
  place?: string | null;
  type?: string;
  status?: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

const PROJECT_COLUMNS = "id, project_number, name, phone, place, type, status, description, start_date, end_date, created_at, updated_at";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id?: string | null): boolean {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

/**
 * Service: Create a new project
 */
export async function createProjectService(
  input: CreateProjectDTO
): Promise<{ data?: Project; error?: string }> {
  try {
    const supabase = await createClient();

    const project_number =
      input.project_number || `PRJ-${Math.floor(100000 + Math.random() * 900000)}`;

    const payload = {
      project_number,
      name: input.name,
      phone: input.phone || null,
      place: input.place || null,
      type: input.type || "Wiring",
      status: input.status || "Ongoing",
      description: input.description || null,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
    };

    const { data, error } = await supabase
      .from("projects")
      .insert([payload])
      .select(PROJECT_COLUMNS)
      .single();

    if (error) {
      console.error("[ProjectService] Error creating project:", error);
      return { error: error.message };
    }

    return { data: data as Project };
  } catch (err: unknown) {
    console.error("[ProjectService] Exception:", err);
    return { error: err instanceof Error ? err.message : "Failed to create project." };
  }
}

/**
 * Service: Fetch all projects with explicit column projection
 */
export async function getProjectsService(): Promise<{ data: Project[]; error?: string }> {
  return withTimeout(
    (async () => {
      try {
        const supabase = await createClient();

        const { data, error } = await supabase
          .from("projects")
          .select(PROJECT_COLUMNS)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("[ProjectService] Error fetching projects:", error);
          return { data: [], error: error.message };
        }

        return { data: (data || []) as Project[] };
      } catch (err: unknown) {
        console.error("[ProjectService] Exception:", err);
        return { data: [], error: err instanceof Error ? err.message : "Error fetching projects" };
      }
    })(),
    { data: [], error: "timeout" },
    2500
  );
}

/**
 * Service: Fetch a single project by ID with fast-path UUID check
 */
export async function getProjectByIdService(
  id: string
): Promise<{ data?: Project; error?: string }> {
  if (!isValidUUID(id)) {
    return { error: "Invalid project ID format." };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("id", id)
      .single();

    if (error) {
      console.error(`[ProjectService] Error fetching project ${id}:`, error);
      return { error: error.message };
    }

    return { data: data as Project };
  } catch (err: unknown) {
    console.error(`[ProjectService] Exception fetching project ${id}:`, err);
    return { error: err instanceof Error ? err.message : "Error fetching project" };
  }
}

/**
 * Service: Update a project with fast-path UUID check
 */
export async function updateProjectService(
  id: string,
  input: UpdateProjectDTO
): Promise<{ data?: Project; error?: string }> {
  if (!isValidUUID(id)) {
    return { error: "Invalid project ID format." };
  }

  try {
    const supabase = await createClient();

    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) payload.name = input.name;
    if (input.phone !== undefined) payload.phone = input.phone;
    if (input.place !== undefined) payload.place = input.place;
    if (input.type !== undefined) payload.type = input.type;
    if (input.status !== undefined) payload.status = input.status;
    if (input.description !== undefined) payload.description = input.description;
    if (input.start_date !== undefined) payload.start_date = input.start_date;
    if (input.end_date !== undefined) payload.end_date = input.end_date;

    const { data, error } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", id)
      .select(PROJECT_COLUMNS)
      .single();

    if (error) {
      console.error(`[ProjectService] Error updating project ${id}:`, error);
      return { error: error.message };
    }

    return { data: data as Project };
  } catch (err: unknown) {
    console.error(`[ProjectService] Exception updating project ${id}:`, err);
    return { error: err instanceof Error ? err.message : "Error updating project" };
  }
}

/**
 * Service: Delete a project with fast-path UUID check
 */
export async function deleteProjectService(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!isValidUUID(id)) {
    return { success: false, error: "Invalid project ID format." };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      console.error(`[ProjectService] Error deleting project ${id}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error(`[ProjectService] Exception deleting project ${id}:`, err);
    return { success: false, error: err instanceof Error ? err.message : "Error deleting project" };
  }
}
