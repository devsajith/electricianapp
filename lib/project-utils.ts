/**
 * Helper utilities for formatting and badges across the electrician app
 */

export interface StatusStyle {
  label: string;
  badgeClass: string;
  dotClass: string;
}

/**
 * Returns Tailwind CSS badge and dot styles for a given project status.
 */
export function getStatusStyle(status: string): StatusStyle {
  const normalized = (status || "").toLowerCase().trim();

  switch (normalized) {
    case "completed":
    case "complete":
    case "done":
      return {
        label: "Completed",
        badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        dotClass: "bg-emerald-500",
      };
    case "in progress":
    case "in-progress":
    case "active":
    case "ongoing":
      return {
        label: "In Progress",
        badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
        dotClass: "bg-amber-500",
      };
    case "on hold":
    case "on-hold":
    case "paused":
    case "delayed":
      return {
        label: "On Hold",
        badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        dotClass: "bg-amber-500",
      };
    case "cancelled":
    case "canceled":
      return {
        label: "Cancelled",
        badgeClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800",
        dotClass: "bg-rose-500",
      };
    case "pending":
    case "planning":
    default:
      return {
        label: "Pending",
        badgeClass: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
        dotClass: "bg-zinc-400",
      };
  }
}

/**
 * Standard project type options supported in the app
 */
export const PROJECT_TYPES = [
  "Residential Wiring",
  "Residential Plumbing",
  "Residential Wiring and Plumbing",
  "Maintenance",
  "Emergency",
] as const;

/**
 * Formats phone numbers for display if needed
 */
export function formatPhoneNumber(phone?: string | null): string {
  if (!phone) return "No Phone";
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned || phone;
}
