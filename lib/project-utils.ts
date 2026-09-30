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
    case "compleated":
    case "done":
      return {
        label: "Completed",
        badgeClass: "bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40",
        dotClass: "bg-emerald-400",
      };
    case "ongoing":
    case "in progress":
    case "in-progress":
    case "active":
      return {
        label: "Ongoing",
        badgeClass: "bg-blue-950/80 text-blue-400 border border-blue-500/40 hover:border-blue-400 focus:ring-2 focus:ring-blue-500/40",
        dotClass: "bg-blue-400",
      };
    case "pending":
    case "planning":
    case "scheduled":
    default:
      return {
        label: "Pending",
        badgeClass: "bg-rose-950/80 text-rose-400 border border-rose-500/40 hover:border-rose-400 focus:ring-2 focus:ring-rose-500/40",
        dotClass: "bg-rose-400",
      };
  }
}

/**
 * Standard project type options supported in the app
 */
export const PROJECT_TYPES = [
  "Wiring",
  "Plumbing",
  "Wiring & Plumbing",
  "Maintenance",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_STATUSES = [
  "Ongoing",
  "Pending",
  "Completed",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/**
 * Validates Indian phone number format (10 digits starting with 6, 7, 8, or 9, optional +91 or 0 prefix)
 */
export function validateIndianPhone(phone: string): { isValid: boolean; error?: string } {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: "Phone number is required." };
  }
  const cleaned = phone.trim().replace(/[\s-]/g, "");
  // Matches +919876543210, 919876543210, 09876543210, or 9876543210
  const indianPhoneRegex = /^(?:\+?91|0)?[6-9]\d{9}$/;
  if (!indianPhoneRegex.test(cleaned)) {
    return {
      isValid: false,
      error: "Enter a valid 10-digit Indian phone number (e.g. 9876543210 or +91 98765 43210).",
    };
  }
  return { isValid: true };
}

/**
 * Normalizes Indian phone number to 10 digits or 91... for WhatsApp / Phone dialing
 */
export function getIndianPhoneDigits(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * Formats phone numbers for display with +91 if 10-digit Indian
 */
export function formatPhoneNumber(phone?: string | null): string {
  if (!phone) return "No Phone";
  const cleaned = phone.replace(/[^\d+]/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    const raw = digits.slice(2);
    return `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`;
  }
  return phone;
}
