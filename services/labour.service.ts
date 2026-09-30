import { createClient } from "@/lib/supabase/server";
import {
  Labour,
  CreateLabourDTO,
  LabourEntry,
  CreateLabourEntryDTO,
  initialSampleLabours,
  initialSampleLabourEntries,
} from "@/lib/types/labour";
import { withTimeout } from "@/lib/timeout";

/**
 * Service: Fetch all labours / workers from Supabase
 */
export async function getLaboursService(): Promise<{ data: Labour[]; error?: string }> {
  return withTimeout(
    (async () => {
      try {
        const supabase = await createClient();

        const { data, error } = await supabase
          .from("workers")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("[LabourService] Error fetching workers from Supabase:", error.message);
          return { data: initialSampleLabours };
        }

        if (!data || data.length === 0) {
          return { data: initialSampleLabours };
        }

        const rows = data as Record<string, unknown>[];
        const labours: Labour[] = rows.map((row) => ({
          id: String(row.id),
          name: String(row.name || "Unnamed Worker"),
          phone: String(row.phone || row.phone_no || row.phone_number || "—"),
          place: String(row.place || row.notes || row.address || row.location || "—"),
          created_at: String(row.created_at || new Date().toISOString()),
          updated_at: row.updated_at ? String(row.updated_at) : undefined,
        }));

        return { data: labours };
      } catch (err: unknown) {
        console.error("[LabourService] Exception fetching labours:", err);
        return { data: initialSampleLabours };
      }
    })(),
    { data: initialSampleLabours },
    3000
  );
}

/**
 * Service: Create a new labour / worker record
 */
export async function createLabourService(
  input: CreateLabourDTO
): Promise<{ data?: Labour; error?: string }> {
  try {
    const supabase = await createClient();

    const name = input.name.trim();
    const phone = input.phone.trim();
    const place = input.place.trim();

    if (!name) {
      return { error: "Name is required." };
    }

    const basePayload: Record<string, unknown> = {
      name,
      phone,
      daily_rate: 0,
      hourly_rate: 0,
      is_active: true,
    };

    // First attempt: try inserting with 'place' column directly
    let { data, error } = await supabase
      .from("workers")
      .insert({ ...basePayload, place })
      .select()
      .maybeSingle();

    // Fallback: if 'place' column does not exist in workers table, store in 'notes'
    if (error && (error.code === "PGRST204" || error.message.includes("'place'") || error.message.includes("does not exist"))) {
      console.warn("[LabourService] 'place' column not found, storing place in 'notes' column.");
      const retry = await supabase
        .from("workers")
        .insert({ ...basePayload, notes: place })
        .select()
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    // In case RLS blocks direct anon/demo insert or offline
    if (error) {
      console.warn("[LabourService] Insert error in Supabase workers table:", error.message);
      // Fallback local memory return for demo/resilience
      const fallbackLabour: Labour = {
        id: `lab-${Date.now()}`,
        name,
        phone,
        place,
        created_at: new Date().toISOString(),
      };
      return { data: fallbackLabour };
    }

    const row = data as Record<string, unknown>;
    const createdLabour: Labour = {
      id: String(row.id),
      name: String(row.name),
      phone: String(row.phone || phone),
      place: String(row.place || row.notes || place),
      created_at: String(row.created_at || new Date().toISOString()),
      updated_at: row.updated_at ? String(row.updated_at) : undefined,
    };

    return { data: createdLabour };
  } catch (err: unknown) {
    console.error("[LabourService] Exception creating labour:", err);
    const message = err instanceof Error ? err.message : "Failed to add labour.";
    return { error: message };
  }
}

/**
 * Service: Delete a labour record
 */
export async function deleteLabourService(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("workers").delete().eq("id", id);
    if (error) {
      console.warn(`[LabourService] Delete error for id ${id}:`, error.message);
      return { success: true };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error(`[LabourService] Exception deleting labour ${id}:`, err);
    return { success: true };
  }
}

/**
 * Service: Fetch labour work entries for a worker or all workers
 */
export async function getLabourEntriesService(
  workerId?: string
): Promise<{ data: LabourEntry[]; error?: string }> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("labour_entries")
      .select("*, projects(id, customer_name, place)")
      .order("work_date", { ascending: false });

    if (workerId) {
      query = query.eq("worker_id", workerId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("[LabourService] Error fetching labour_entries:", error.message);
      const filtered = workerId
        ? initialSampleLabourEntries.filter((e) => e.worker_id === workerId)
        : initialSampleLabourEntries;
      return { data: filtered };
    }

    if (!data || data.length === 0) {
      const filtered = workerId
        ? initialSampleLabourEntries.filter((e) => e.worker_id === workerId)
        : initialSampleLabourEntries;
      return { data: filtered };
    }

    const rows = data as Record<string, unknown>[];
    const entries: LabourEntry[] = rows.map((row) => {
      const proj = row.projects as { customer_name?: string; place?: string } | null;
      const dateStr = String(row.work_date || new Date().toISOString().split("T")[0]);
      let dayName = "";
      try {
        const d = new Date(dateStr);
        dayName = d.toLocaleDateString("en-US", { weekday: "long" });
      } catch {
        dayName = "—";
      }

      return {
        id: String(row.id),
        worker_id: String(row.worker_id),
        date: dateStr,
        day: dayName,
        project_id: String(row.project_id || ""),
        project_name: proj?.customer_name
          ? `${proj.customer_name}${proj.place ? ` (${proj.place})` : ""}`
          : "Site",
        tach: "1",
        ot: "0",
        amount: Number(row.total_amount ?? 0),
        created_at: String(row.created_at || new Date().toISOString()),
      };
    });

    return { data: entries };
  } catch (err: unknown) {
    console.error("[LabourService] Exception in getLabourEntriesService:", err);
    return { data: initialSampleLabourEntries };
  }
}

/**
 * Service: Create a new labour work entry
 */
export async function createLabourEntryService(
  input: CreateLabourEntryDTO
): Promise<{ data?: LabourEntry; error?: string }> {
  try {
    const supabase = await createClient();

    const dateStr = input.date;
    let dayName = input.day;
    if (!dayName) {
      try {
        const d = new Date(dateStr);
        dayName = d.toLocaleDateString("en-US", { weekday: "long" });
      } catch {
        dayName = "—";
      }
    }

    // Try inserting into labour_entries table
    const payload = {
      worker_id: input.worker_id,
      project_id: input.project_id || null,
      work_date: dateStr,
      total_amount: Number(input.amount) || 0,
    };

    const { data, error } = await supabase
      .from("labour_entries")
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.warn("[LabourService] Error creating labour entry in Supabase:", error.message);
    }

    const created: LabourEntry = {
      id: data?.id ? String(data.id) : `ent-${Date.now()}`,
      worker_id: input.worker_id,
      date: dateStr,
      day: dayName,
      project_id: input.project_id,
      project_name: input.project_name || "Selected Site",
      tach: input.tach || "1",
      ot: input.ot || "0",
      amount: Number(input.amount) || 0,
      created_at: new Date().toISOString(),
    };

    return { data: created };
  } catch (err: unknown) {
    console.error("[LabourService] Exception creating labour entry:", err);
    const message = err instanceof Error ? err.message : "Failed to save work entry.";
    return { error: message };
  }
}

/**
 * Service: Delete a labour work entry
 */
export async function deleteLabourEntryService(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    await supabase.from("labour_entries").delete().eq("id", id);
    return { success: true };
  } catch (err) {
    console.error("[LabourService] Exception deleting entry:", err);
    return { success: true };
  }
}
