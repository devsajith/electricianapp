import { createClient } from "@/lib/supabase/server";
import { PostgrestError } from "@supabase/supabase-js";
import { withTimeout } from "@/lib/timeout";

export interface Project {
  id?: string;
  project_number: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  address?: string | null;
  project_address?: string | null;
  place?: string | null;
  project_type: string;
  work_description?: string | null;
  start_date?: string | null;
  expected_completion_date?: string | null;
  end_date?: string | null;
  status: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProjectDTO {
  project_number?: string;
  customer_name: string;
  customer_phone?: string | null;
  address?: string | null;
  project_address?: string | null;
  place?: string | null;
  project_type?: string;
  work_description?: string | null;
  start_date?: string | null;
  expected_completion_date?: string | null;
  end_date?: string | null;
  status?: string;
  notes?: string | null;
}

export interface UpdateProjectDTO {
  customer_name?: string;
  customer_phone?: string | null;
  address?: string | null;
  project_address?: string | null;
  place?: string | null;
  project_type?: string;
  work_description?: string | null;
  start_date?: string | null;
  expected_completion_date?: string | null;
  end_date?: string | null;
  status?: string;
  notes?: string | null;
}

/**
 * Service: Create a new project record in Supabase using exact database schema
 */
export async function createProjectService(input: CreateProjectDTO): Promise<{ data?: Project; error?: string }> {
  try {
    const supabase = await createClient();

    // Auto-generate project_number if not provided
    const project_number =
      input.project_number || `PRJ-${Math.floor(100000 + Math.random() * 900000)}`;

    const addrValue = input.place || input.project_address || input.address || null;
    const endDateValue = input.end_date || input.expected_completion_date || null;

    const payload: Record<string, unknown> = {
      project_number,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone || null,
      project_address: addrValue,
      address: addrValue,
      project_type: input.project_type || "Wiring",
      work_description: input.work_description || null,
      start_date: input.start_date || null,
      expected_completion_date: endDateValue,
      status: input.status || "Ongoing",
    };

    if (input.notes) {
      payload.notes = input.notes;
    }

    let data: Record<string, unknown> | null = null;
    let error: PostgrestError | null = null;

    // Up to 5 attempts with progressive fallbacks for schema and constraints
    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await supabase
        .from("projects")
        .insert([payload])
        .select()
        .single();

      data = res.data as Record<string, unknown> | null;
      error = res.error;

      if (!error) break;

      // Fallback 1: If 'notes' column is deleted from schema
      if (error.code === "PGRST204" && error.message.includes("'notes'")) {
        delete payload.notes;
        continue;
      }

      // Fallback 2: If 'address' column is missing in schema
      if (error.code === "PGRST204" && error.message.includes("'address'")) {
        delete payload.address;
        continue;
      }

      // Fallback 3: If 'project_address' column is missing in schema
      if (error.code === "PGRST204" && error.message.includes("'project_address'")) {
        delete payload.project_address;
        continue;
      }

      // Fallback 4: If project_type violates legacy Postgres CHECK constraint (23514)
      if (error.code === "23514" && (error.message.includes("project_type") || error.message.includes("projects_project_type_check"))) {
        console.warn("[ProjectService] project_type constraint violation (23514). Merging type into notes and omitting project_type field.");
        const origType = payload.project_type as string | undefined;
        delete payload.project_type;
        const currentNotes = (payload.notes as string) || "";
        if (origType && !currentNotes.includes(`[Type: ${origType}]`)) {
          payload.notes = currentNotes
            ? `[Type: ${origType}] ${currentNotes}`
            : `[Type: ${origType}]`;
        }
        continue;
      }

      // Fallback 5: If status violates projects_status_check constraint (23514)
      if (error.code === "23514" && (error.message.includes("status_check") || error.message.includes("status"))) {
        console.warn("[ProjectService] status constraint violation (23514). Merging status into notes and omitting status field.");
        const origStatus = payload.status as string | undefined;
        delete payload.status;
        const currentNotes = (payload.notes as string) || "";
        if (origStatus && !currentNotes.includes(`[Status: ${origStatus}]`)) {
          payload.notes = currentNotes
            ? `[Status: ${origStatus}] ${currentNotes}`
            : `[Status: ${origStatus}]`;
        }
        continue;
      }

      break;
    }

    if (error) {
      console.error("[ProjectService] Error creating project after retries:", error);
      return { error: error.message };
    }

    // Normalize output fields
    if (data) {
      data.place = (data.project_address as string) || (data.address as string) || addrValue;
      data.address = data.place;
      data.project_address = data.place;
      data.end_date = (data.expected_completion_date as string) || endDateValue;
      data.expected_completion_date = data.end_date;
      data.status = (data.status as string) || input.status || "Ongoing";
      data.project_type = (data.project_type as string) || input.project_type || "Wiring";
    }

    return { data: (data as unknown) as Project };
  } catch (err: unknown) {
    console.error("[ProjectService] Exception in createProjectService:", err);
    const msg = err instanceof Error ? err.message : "Internal server error while creating project.";
    return { error: msg };
  }
}

/**
 * Service: Get all project records from Supabase
 */
export async function getProjectsService(): Promise<{ data?: Project[]; error?: string }> {
  return withTimeout(
    (async () => {
      try {
        const supabase = await createClient();

        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("[ProjectService] Error fetching projects:", error);
          return { error: error.message, data: [] };
        }

        // Normalize output records so address and place are populated
        const rows = (data || []) as Record<string, unknown>[];
        const normalized = rows.map((row) => {
          const place = (row.place as string) || (row.project_address as string) || (row.address as string) || null;
          const end_date = (row.end_date as string) || (row.expected_completion_date as string) || null;
          return {
            ...row,
            place,
            address: place,
            project_address: place,
            end_date,
            expected_completion_date: end_date,
          };
        });

        return { data: (normalized as unknown) as Project[] };
      } catch (err: unknown) {
        console.error("[ProjectService] Exception in getProjectsService:", err);
        const msg = err instanceof Error ? err.message : "Internal server error while fetching projects.";
        return { error: msg, data: [] };
      }
    })(),
    { data: [] },
    8000
  );
}

/**
 * Service: Get a single project record by ID
 */
export async function getProjectByIdService(id: string): Promise<{ data?: Project; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`[ProjectService] Error fetching project ${id}:`, error);
      return { error: error.message };
    }

    const row = data as Record<string, unknown> | null;
    if (row) {
      const place = (row.place as string) || (row.project_address as string) || (row.address as string) || null;
      const end_date = (row.end_date as string) || (row.expected_completion_date as string) || null;
      row.place = place;
      row.address = place;
      row.project_address = place;
      row.end_date = end_date;
      row.expected_completion_date = end_date;
    }

    return { data: (row as unknown) as Project };
  } catch (err: unknown) {
    console.error(`[ProjectService] Exception in getProjectByIdService (${id}):`, err);
    const msg = err instanceof Error ? err.message : "Internal server error while fetching project.";
    return { error: msg };
  }
}

/**
 * Service: Update an existing project by ID
 */
export async function updateProjectService(
  id: string,
  input: UpdateProjectDTO
): Promise<{ data?: Project; error?: string }> {
  try {
    const supabase = await createClient();

    const addrValue = input.place || input.project_address || input.address;
    const endDateValue = input.end_date || input.expected_completion_date;

    const updatePayload: Record<string, unknown> = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    if (addrValue !== undefined) {
      updatePayload.project_address = addrValue;
      updatePayload.address = addrValue;
      delete updatePayload.place;
    }

    if (endDateValue !== undefined) {
      updatePayload.expected_completion_date = endDateValue;
      delete updatePayload.end_date;
    }

    const { data, error } = await supabase
      .from("projects")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`[ProjectService] Error updating project ${id}:`, error);
      return { error: error.message };
    }

    const row = data as Record<string, unknown> | null;
    if (row) {
      const place = (row.place as string) || (row.project_address as string) || (row.address as string) || null;
      const end_date = (row.end_date as string) || (row.expected_completion_date as string) || null;
      row.place = place;
      row.address = place;
      row.project_address = place;
      row.end_date = end_date;
      row.expected_completion_date = end_date;
    }

    return { data: (row as unknown) as Project };
  } catch (err: unknown) {
    console.error(`[ProjectService] Exception in updateProjectService (${id}):`, err);
    const msg = err instanceof Error ? err.message : "Internal server error while updating project.";
    return { error: msg };
  }
}

/**
 * Service: Delete a project by ID
 */
export async function deleteProjectService(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`[ProjectService] Error deleting project ${id}:`, error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error(`[ProjectService] Exception in deleteProjectService (${id}):`, err);
    const msg = err instanceof Error ? err.message : "Internal server error while deleting project.";
    return { error: msg };
  }
}
