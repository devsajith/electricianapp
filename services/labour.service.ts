import { createClient } from "@/lib/supabase/server";
import { Labour, CreateLabourDTO, LabourEntry, CreateLabourEntryDTO } from "@/lib/types/labour";
import { withTimeout } from "@/lib/timeout";
import { createExpenseService } from "@/services/expense.service";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id?: string | null): boolean {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

const WORKER_COLUMNS = "id, name, phone, place, created_at, updated_at";
const LABOUR_LOG_COLUMNS =
  "id, worker_id, project_id, work_date, day, tach, ot, amount_paid, created_at, projects(id, name, place)";

export async function getLaboursService(): Promise<{ data: Labour[]; error?: string }> {
  return withTimeout(
    (async () => {
      try {
        const supabase = await createClient();

        const { data, error } = await supabase
          .from("workers")
          .select(WORKER_COLUMNS)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching workers:", error.message || error);
          return { data: [], error: error.message };
        }

        const formattedData: Labour[] = ((data as unknown as Labour[]) || []).map((row) => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          place: row.place,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }));

        return { data: formattedData };
      } catch (error) {
        console.error("Service error (getLabours):", error);
        return { data: [], error: error instanceof Error ? error.message : "Internal server error" };
      }
    })(),
    { data: [], error: "timeout" },
    3000
  );
}

export async function createLabourService(input: CreateLabourDTO): Promise<{ data?: Labour; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("workers")
      .insert({
        name: input.name,
        phone: input.phone,
        place: input.place,
      })
      .select(WORKER_COLUMNS)
      .single();

    if (error) {
      console.error("Error creating worker:", error.message || error);
      return { error: "Failed to create worker" };
    }

    if (data) {
      return {
        data: {
          id: data.id,
          name: data.name,
          phone: data.phone,
          place: data.place,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
      };
    }

    return { error: "Failed to return created worker" };
  } catch (error) {
    console.error("Service error (createLabour):", error);
    return { error: "Internal server error" };
  }
}

export async function deleteLabourService(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isValidUUID(id)) {
    return { success: false, error: "Invalid worker ID format." };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("workers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting worker:", error.message || error);
      return { success: false, error: "Failed to delete worker" };
    }

    return { success: true };
  } catch (error) {
    console.error("Service error (deleteLabour):", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function getLabourEntriesService(workerId?: string): Promise<{ data: LabourEntry[]; error?: string }> {
  try {
    if (workerId && !isValidUUID(workerId)) {
      return { data: [] };
    }

    const supabase = await createClient();

    let query = supabase
      .from("labour_logs")
      .select(LABOUR_LOG_COLUMNS)
      .order("work_date", { ascending: false });

    if (workerId) {
      query = query.eq("worker_id", workerId);
    }

    let { data, error } = await query;

    // Graceful fallback to labour_entries if table hasn't been renamed yet
    if (error && (error.code === "PGRST205" || error.message?.includes("labour_logs"))) {
      let fallbackQuery = supabase
        .from("labour_entries")
        .select("*, projects(id, name, place)")
        .order("work_date", { ascending: false });

      if (workerId) {
        fallbackQuery = fallbackQuery.eq("worker_id", workerId);
      }

      const fb = await fallbackQuery;
      if (!fb.error) {
        data = fb.data;
        error = null;
      }
    }

    if (error) {
      console.error("Error fetching labour logs:", error.message || error);
      return { data: [], error: error.message || "Failed to fetch labour logs" };
    }

    interface LabourEntryDbRow {
      id: string;
      worker_id: string;
      work_date?: string;
      day?: string;
      project_id?: string | null;
      projects?: {
        name?: string;
        place?: string;
      } | null;
      tach?: string | number;
      ot?: string | number;
      amount_paid?: number | string;
      amount?: number | string;
      total_amount?: number | string;
      created_at?: string;
    }

    const formattedData: LabourEntry[] = ((data as unknown as LabourEntryDbRow[]) || []).map((row) => {
      const proj = row.projects;
      const projectName = proj?.name ? `${proj.name}${proj.place ? ` (${proj.place})` : ""}` : "Site";
      const workDate = row.work_date ? new Date(row.work_date) : new Date();
      const day = row.day || workDate.toLocaleDateString("en-US", { weekday: "short" });

      const paid = Number(row.amount_paid ?? row.amount ?? row.total_amount) || 0;

      return {
        id: row.id,
        worker_id: row.worker_id,
        date: row.work_date || "",
        day,
        project_id: row.project_id || "",
        project_name: projectName,
        tach: String(row.tach ?? "1"),
        ot: String(row.ot ?? "0"),
        amount_paid: paid,
        amount: paid,
        created_at: row.created_at,
      };
    });

    return { data: formattedData };
  } catch (error) {
    console.error("Service error (getLabourEntries):", error);
    return { data: [], error: "Internal server error" };
  }
}

export async function createLabourEntryService(input: CreateLabourEntryDTO): Promise<{ data?: LabourEntry; error?: string }> {
  try {
    const supabase = await createClient();

    const workDate = new Date(input.date);
    const day = input.day || workDate.toLocaleDateString("en-US", { weekday: "short" });
    const paidAmount = Number(input.amount_paid ?? input.amount) || 0;

    let { data, error } = await supabase
      .from("labour_logs")
      .insert({
        worker_id: input.worker_id,
        project_id: input.project_id,
        work_date: input.date,
        day: day,
        tach: Number(input.tach) || 1,
        ot: Number(input.ot) || 0,
        amount_paid: paidAmount,
      })
      .select(LABOUR_LOG_COLUMNS)
      .single();

    // Fallback: If amount_paid column doesn't exist yet, retry with amount
    if (error && (error.message?.includes("amount_paid") || error.code === "42703")) {
      const fbAmount = await supabase
        .from("labour_logs")
        .insert({
          worker_id: input.worker_id,
          project_id: input.project_id,
          work_date: input.date,
          day: day,
          tach: Number(input.tach) || 1,
          ot: Number(input.ot) || 0,
          amount: paidAmount,
        })
        .select("*, projects(id, name, place)")
        .single();

      if (!fbAmount.error && fbAmount.data) {
        data = fbAmount.data;
        error = null;
      }
    }

    // Fallback if labour_logs table hasn't been renamed yet
    if (error && (error.code === "PGRST205" || error.message?.includes("labour_logs"))) {
      const fb = await supabase
        .from("labour_entries")
        .insert({
          worker_id: input.worker_id,
          project_id: input.project_id,
          work_date: input.date,
          total_amount: paidAmount,
        })
        .select("*, projects(id, name, place)")
        .single();

      if (!fb.error && fb.data) {
        data = fb.data;
        error = null;
      }
    }

    if (error) {
      console.error("Error creating labour log:", error.message || error);
      return { error: "Failed to create labour log" };
    }

    if (data) {
      interface LabourLogSingleResult {
        id: string;
        worker_id: string;
        work_date?: string;
        day?: string;
        project_id?: string | null;
        projects?: {
          name?: string;
          place?: string;
        } | { name?: string; place?: string }[] | null;
        tach?: string | number;
        ot?: string | number;
        amount_paid?: number | string;
        amount?: number | string;
        total_amount?: number | string;
        created_at?: string;
      }

      const row = data as unknown as LabourLogSingleResult;
      const proj = Array.isArray(row.projects) ? row.projects[0] : row.projects;
      const projectName = proj?.name ? `${proj.name}${proj.place ? ` (${proj.place})` : ""}` : "Site";
      const returnPaid = Number(row.amount_paid ?? row.amount ?? row.total_amount ?? paidAmount) || 0;

      // Automatically create an expense entry for the project if associated with a project and amount paid > 0
      if (row.project_id && returnPaid > 0) {
        try {
          let workerName = "";
          if (row.worker_id) {
            const { data: workerData } = await supabase
              .from("workers")
              .select("name")
              .eq("id", row.worker_id)
              .maybeSingle();
            if (workerData?.name) {
              workerName = workerData.name;
            }
          }

          const tachVal = row.tach ?? input.tach ?? "1";
          const otVal = row.ot ?? input.ot ?? "0";
          const entryDay = row.day || day;
          const desc = workerName
            ? `Labour: ${workerName} (${entryDay} - Tach: ${tachVal}, OT: ${otVal}h)`
            : `Labour (${entryDay} - Tach: ${tachVal}, OT: ${otVal}h)`;

          await createExpenseService({
            type: "project",
            project_id: row.project_id,
            amount: returnPaid,
            description: desc,
            date: row.work_date || input.date,
            labour_log_id: row.id,
          });
        } catch (expErr) {
          console.error("Failed to automatically create expense for labour log:", expErr);
        }
      }

      return {
        data: {
          id: row.id,
          worker_id: row.worker_id,
          date: row.work_date || input.date,
          day: row.day || day,
          project_id: row.project_id || "",
          project_name: projectName,
          tach: String(row.tach ?? input.tach ?? "1"),
          ot: String(row.ot ?? input.ot ?? "0"),
          amount_paid: returnPaid,
          amount: returnPaid,
          created_at: row.created_at || new Date().toISOString(),
        },
      };
    }

    return { error: "Failed to return created log" };
  } catch (error) {
    console.error("Service error (createLabourEntry):", error);
    return { error: "Internal server error" };
  }
}

export async function deleteLabourEntryService(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isValidUUID(id)) {
    return { success: false, error: "Invalid labour log ID format." };
  }

  try {
    const supabase = await createClient();

    // Delete associated expense if it exists
    try {
      await supabase.from("expenses").delete().eq("labour_log_id", id);
    } catch {
      // Ignore if labour_log_id column doesn't exist
    }

    let { error } = await supabase
      .from("labour_logs")
      .delete()
      .eq("id", id);

    if (error && (error.code === "PGRST205" || error.message?.includes("labour_logs"))) {
      const fb = await supabase
        .from("labour_entries")
        .delete()
        .eq("id", id);
      error = fb.error;
    }

    if (error) {
      console.error("Error deleting labour log:", error.message || error);
      return { success: false, error: "Failed to delete labour log" };
    }

    return { success: true };
  } catch (error) {
    console.error("Service error (deleteLabourEntry):", error);
    return { success: false, error: "Internal server error" };
  }
}
