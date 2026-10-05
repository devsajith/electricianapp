import { getLaboursService, getLabourEntriesService } from "@/services/labour.service";
import { getProjectsService } from "@/services/project.service";
import { Labour, LabourEntry, initialSampleLabours, initialSampleLabourEntries } from "@/lib/types/labour";
import LabourClient from "./labour-client";
import { withTimeout } from "@/lib/timeout";

export const dynamic = "force-dynamic";

export default async function LabourPage() {
  let labours: Labour[] = [];
  let projectsList: { id: string; name: string }[] = [];
  let entries: LabourEntry[] = [];

  try {
    const [laboursRes, projectsRes, entriesRes] = await Promise.all([
      withTimeout(getLaboursService(), { data: initialSampleLabours }, 3000),
      withTimeout(getProjectsService(), { data: [] }, 3000),
      withTimeout(getLabourEntriesService(), { data: initialSampleLabourEntries }, 3000),
    ]);

    if (laboursRes.data && Array.isArray(laboursRes.data)) {
      labours = laboursRes.data;
    }
    if (entriesRes.data && Array.isArray(entriesRes.data)) {
      entries = entriesRes.data;
    }
    if (projectsRes.data && Array.isArray(projectsRes.data)) {
      projectsList = projectsRes.data
        .filter((p) => p && p.id)
        .map((p) => ({
          id: String(p.id ?? ""),
          name: `${p.name || "Project"}${p.place ? ` (${p.place})` : ""}`,
        }));
    }
  } catch (err) {
    console.error("[LabourPage] Error loading data:", err);
    labours = initialSampleLabours;
    entries = initialSampleLabourEntries;
  }

  // Fallback default sites if projects list is empty
  if (projectsList.length === 0) {
    projectsList = [
      { id: "proj-1", name: "Apex Commercial Plaza (Kochi)" },
      { id: "proj-2", name: "Green Valley Villa (Aluva)" },
      { id: "proj-3", name: "Skyline Heights (Kakkanad)" },
      { id: "proj-4", name: "General Maintenance & Repair" },
    ];
  }

  const safeLabours: Labour[] = (labours || []).map((item) => ({
    id: String(item.id ?? ""),
    name: String(item.name ?? "Unnamed Worker"),
    phone: String(item.phone ?? "—"),
    place: String(item.place ?? "—"),
    created_at: String(item.created_at ?? new Date().toISOString()),
  }));

  return (
    <LabourClient
      initialLabours={safeLabours}
      initialProjects={projectsList}
      initialEntries={entries}
    />
  );
}
