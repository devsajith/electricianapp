import { Estimate, initialSampleEstimates, EstimateStatus } from "./types/estimate";

const STORAGE_KEY = "electrician_app_estimates_v2";

export function getEstimates(): Estimate[] {
  if (typeof window === "undefined") return initialSampleEstimates;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSampleEstimates));
      return initialSampleEstimates;
    }
    return JSON.parse(data);
  } catch {
    return initialSampleEstimates;
  }
}

export function getEstimateById(id: string): Estimate | null {
  const estimates = getEstimates();
  return estimates.find((e) => e.id === id || e.estimate_number === id) || null;
}

export function createEstimateRecord(
  newEstimate: Omit<Estimate, "id" | "created_at">
): Estimate {
  const estimates = getEstimates();
  const id = `est-${Date.now()}`;

  // Attach estimate_id to each item
  const itemsWithId = newEstimate.items.map((item, idx) => ({
    ...item,
    id: item.id || `item-${Date.now()}-${idx}`,
    estimate_id: id,
  }));

  const nextSeq = estimates.length + 1;
  const estimate_number =
    newEstimate.estimate_number && newEstimate.estimate_number.trim()
      ? newEstimate.estimate_number
      : `EST-2026-${String(nextSeq).padStart(3, "0")}`;

  const created: Estimate = {
    ...newEstimate,
    id,
    estimate_number,
    items: itemsWithId,
    created_at: new Date().toISOString(),
  };

  const updatedList = [created, ...estimates];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.error("Error writing estimates to localStorage", e);
    }
  }

  return created;
}

export const saveEstimate = createEstimateRecord;

export function updateEstimateStatus(id: string, status: EstimateStatus): boolean {
  const estimates = getEstimates();
  const idx = estimates.findIndex((e) => e.id === id || e.estimate_number === id);
  if (idx === -1) return false;

  estimates[idx].status = status;
  estimates[idx].updated_at = new Date().toISOString();
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estimates));
    } catch (e) {
      console.error("Error writing estimates to localStorage", e);
    }
  }
  return true;
}
