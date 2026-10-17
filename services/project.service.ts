import { createClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/timeout";

export interface ProjectPlanFile {
  id: string;
  name: string;
  url: string;
  path: string;
  type: string;
  size?: number;
  uploaded_at: string;
}

export interface Project {
  id: string;
  project_number: string;
  name: string;
  phone?: string | null;
  place?: string | null;
  type: string;
  status: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  plans?: ProjectPlanFile[];
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
  plans?: ProjectPlanFile[];
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
  plans?: ProjectPlanFile[];
}

const PROJECT_BASE_COLUMNS = "id, project_number, name, phone, place, type, status, description, start_date, end_date, created_at, updated_at";
const PROJECT_COLUMNS = `${PROJECT_BASE_COLUMNS}, plans`;
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
      plans: input.plans || [],
    };

    let { data, error } = await supabase
      .from("projects")
      .insert([payload])
      .select(PROJECT_COLUMNS)
      .single();

    // Fallback if 'plans' column does not exist in database yet
    if (error && (error.code === "42703" || error.message?.toLowerCase().includes("plans"))) {
      console.warn("[ProjectService] 'plans' column not found on insert, falling back to base columns.");
      const { plans: _, ...basePayload } = payload;
      const fallback = await supabase
        .from("projects")
        .insert([basePayload])
        .select(PROJECT_BASE_COLUMNS)
        .single();
      if (!fallback.error) {
        data = fallback.data ? ({ ...fallback.data, plans: [] } as any) : null;
        error = null;
      }
    }

    if (error) {
      console.error("[ProjectService] Error creating project:", error.message || error);
      return { error: error.message };
    }

    return { data: data as Project };
  } catch (err: unknown) {
    console.error("[ProjectService] Exception:", err instanceof Error ? err.message : err);
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

        let { data, error } = await supabase
          .from("projects")
          .select(PROJECT_COLUMNS)
          .order("created_at", { ascending: false });

        // Fallback if 'plans' column has not been migrated in the database
        if (error && (error.code === "42703" || error.message?.toLowerCase().includes("plans"))) {
          console.warn("[ProjectService] 'plans' column not found, falling back to base columns.");
          const fallback = await supabase
            .from("projects")
            .select(PROJECT_BASE_COLUMNS)
            .order("created_at", { ascending: false });
          if (!fallback.error) {
            data = fallback.data ? (fallback.data as any[]).map((p) => ({ ...p, plans: [] })) as any : [];
            error = null;
          }
        }

        if (error) {
          console.error("[ProjectService] Error fetching projects:", error.message || error);
          return { data: [], error: error.message };
        }

        return { data: (data || []) as Project[] };
      } catch (err: unknown) {
        console.error("[ProjectService] Exception:", err instanceof Error ? err.message : err);
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

    let { data, error } = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("id", id)
      .single();

    // Fallback if 'plans' column has not been migrated in the database
    if (error && (error.code === "42703" || error.message?.toLowerCase().includes("plans"))) {
      console.warn(`[ProjectService] 'plans' column not found for project ${id}, falling back to base columns.`);
      const fallback = await supabase
        .from("projects")
        .select(PROJECT_BASE_COLUMNS)
        .eq("id", id)
        .single();
      if (!fallback.error) {
        data = fallback.data ? ({ ...fallback.data, plans: [] } as any) : null;
        error = null;
      }
    }

    if (error) {
      console.error(`[ProjectService] Error fetching project ${id}:`, error.message || error);
      return { error: error.message };
    }

    return { data: data as Project };
  } catch (err: unknown) {
    console.error(`[ProjectService] Exception fetching project ${id}:`, err instanceof Error ? err.message : err);
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
    if (input.plans !== undefined) payload.plans = input.plans;

    let { data, error } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", id)
      .select(PROJECT_COLUMNS)
      .single();

    // Fallback if 'plans' column has not been migrated in the database
    if (error && (error.code === "42703" || error.message?.toLowerCase().includes("plans"))) {
      console.warn(`[ProjectService] 'plans' column not found on update for project ${id}, falling back.`);
      const { plans: _, ...basePayload } = payload;
      const fallback = await supabase
        .from("projects")
        .update(basePayload)
        .eq("id", id)
        .select(PROJECT_BASE_COLUMNS)
        .single();
      if (!fallback.error) {
        data = fallback.data ? ({ ...fallback.data, plans: [] } as any) : null;
        error = null;
      }
    }

    if (error) {
      console.error(`[ProjectService] Error updating project ${id}:`, error.message || error);
      return { error: error.message };
    }

    return { data: data as Project };
  } catch (err: unknown) {
    console.error(`[ProjectService] Exception updating project ${id}:`, err instanceof Error ? err.message : err);
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
      console.error(`[ProjectService] Error deleting project ${id}:`, error.message || error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error(`[ProjectService] Exception deleting project ${id}:`, err instanceof Error ? err.message : err);
    return { success: false, error: err instanceof Error ? err.message : "Error deleting project" };
  }
}
