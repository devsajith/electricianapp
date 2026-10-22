import { createClient } from "@/lib/supabase/server";
import {
  Quotation,
  CreateQuotationDTO,
  QuotationItem,
  DEFAULT_QUOTATION_SUBJECT,
  DEFAULT_QUOTATION_INTRO,
  DEFAULT_QUOTATION_TERMS,
} from "@/lib/types/quotation";
import { withTimeout } from "@/lib/timeout";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id?: string | null): boolean {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

interface RawQuotationRow {
  id: string;
  quotation_number: string;
  client_name: string;
  client_phone?: string | null;
  client_place?: string | null;
  project_type?: string | null;
  unit?: string | null;
  rate?: number | null;
  description?: string | null;
  terms?: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
  items?: QuotationItem[] | null;
  client_address?: string | null;
  quotation_date?: string | null;
  subject?: string | null;
  intro_text?: string | null;
}

function normalizeQuotation(row: RawQuotationRow): Quotation {
  let items: QuotationItem[] = [];
  let client_address = row.client_address || null;
  let quotation_date = row.quotation_date || null;
  let project_type = row.project_type || "Wiring";
  let subject = row.subject || DEFAULT_QUOTATION_SUBJECT;
  let intro_text = row.intro_text || DEFAULT_QUOTATION_INTRO;

  // 1. Try row.items if it's already an array
  if (Array.isArray(row.items) && row.items.length > 0) {
    items = row.items;
  } else if (typeof row.items === "string") {
    try {
      const parsed = JSON.parse(row.items);
      if (Array.isArray(parsed)) items = parsed;
    } catch {
      // ignore
    }
  }

  // 2. If no items yet, check if description has packed JSON
  if (items.length === 0 && row.description && row.description.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(row.description);
      if (Array.isArray(parsed.items)) {
        items = parsed.items;
      }
      if (parsed.client_address) client_address = parsed.client_address;
      if (parsed.quotation_date) quotation_date = parsed.quotation_date;
      if (parsed.project_type) project_type = parsed.project_type;
      if (parsed.subject) subject = parsed.subject;
      if (parsed.intro_text) intro_text = parsed.intro_text;
    } catch {
      // description was not json
    }
  }

  // 3. Fallback to legacy single item if still empty
  if (items.length === 0) {
    const rawRate = Number(row.rate) || 0;
    const rawUnit = row.unit || "Nos";
    const rawDesc = row.description || "General Electrical Installation Work";
    if (rawRate > 0 || rawDesc) {
      items = [
        {
          id: "1",
          description: rawDesc,
          unit: rawUnit,
          rate: rawRate,
        },
      ];
    }
  }

  // Fallback quotation_date if not present
  if (!quotation_date && row.created_at) {
    try {
      const d = new Date(row.created_at);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      quotation_date = `${day}/${month}/${year}`;
    } catch {
      quotation_date = null;
    }
  }

  return {
    id: row.id,
    quotation_number: row.quotation_number,
    quotation_date: quotation_date || new Date().toLocaleDateString("en-GB"),
    client_name: row.client_name,
    client_address: client_address,
    client_phone: row.client_phone || null,
    client_place: row.client_place || null,
    project_type: project_type || "Wiring",
    subject: subject || DEFAULT_QUOTATION_SUBJECT,
    intro_text: intro_text || DEFAULT_QUOTATION_INTRO,
    items,
    unit: row.unit || "Nos",
    rate: Number(row.rate) || (items[0]?.rate ?? 0),
    description: row.description,
    terms: row.terms || DEFAULT_QUOTATION_TERMS,
    status: (row.status as Quotation["status"]) || "Draft",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getQuotationsService(): Promise<{ data: Quotation[]; error?: string }> {
  return withTimeout(
    (async () => {
      try {
        const supabase = await createClient();

        const { data, error } = await supabase
          .from("quotations")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching quotations:", error.message || error);
          return { data: [], error: error.message };
        }

        const normalized = (data || []).map((row) => normalizeQuotation(row as RawQuotationRow));
        return { data: normalized };
      } catch (error) {
        console.error("Service error (getQuotations):", error);
        return { data: [], error: error instanceof Error ? error.message : "Internal server error" };
      }
    })(),
    { data: [], error: "timeout" },
    3500
  );
}

export async function getQuotationByIdService(id: string): Promise<{ data?: Quotation; error?: string }> {
  if (!isValidUUID(id)) {
    return { error: "Invalid quotation ID format." };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching quotation:", error);
      return { error: "Failed to fetch quotation" };
    }

    return { data: normalizeQuotation(data as RawQuotationRow) };
  } catch (error) {
    console.error("Service error (getQuotationById):", error);
    return { error: "Internal server error" };
  }
}

export async function createQuotationService(input: CreateQuotationDTO): Promise<{ data?: Quotation; error?: string }> {
  try {
    const supabase = await createClient();

    const randomSuffix = String(Math.floor(100 + Math.random() * 900)).padStart(4, "0");
    const quotation_number = input.quotation_number || `PE/2026/${randomSuffix}`;
    const todayStr = input.quotation_date || new Date().toLocaleDateString("en-GB");
    const project_type = input.project_type || "Wiring";

    // Packed fallback payload into description to ensure persistence even before column migration
    const packedDescription = JSON.stringify({
      items: input.items || [],
      client_address: input.client_address || null,
      quotation_date: todayStr,
      project_type,
      subject: input.subject || DEFAULT_QUOTATION_SUBJECT,
      intro_text: input.intro_text || DEFAULT_QUOTATION_INTRO,
      raw_description: input.description || null,
    });

    const firstItem = input.items && input.items.length > 0 ? input.items[0] : null;

    // Try full insert first with extended columns
    const fullPayload: Record<string, unknown> = {
      quotation_number,
      client_name: input.client_name,
      client_address: input.client_address || null,
      client_phone: input.client_phone || null,
      client_place: input.client_place || null,
      project_type,
      quotation_date: todayStr,
      subject: input.subject || DEFAULT_QUOTATION_SUBJECT,
      intro_text: input.intro_text || DEFAULT_QUOTATION_INTRO,
      items: input.items || [],
      unit: input.unit || firstItem?.unit || "Nos",
      rate: Number(input.rate || firstItem?.rate || 0),
      description: packedDescription,
      terms: input.terms || DEFAULT_QUOTATION_TERMS,
      status: input.status || "Draft",
    };

    const { data: fullData, error: fullError } = await supabase
      .from("quotations")
      .insert(fullPayload)
      .select("*")
      .single();

    if (!fullError && fullData) {
      return { data: normalizeQuotation(fullData as RawQuotationRow) };
    }

    // Fallback: If table doesn't have the new columns yet, insert standard columns with packed description
    const fallbackPayload: Record<string, unknown> = {
      quotation_number,
      client_name: input.client_name,
      client_phone: input.client_phone || null,
      client_place: input.client_place || null,
      unit: input.unit || firstItem?.unit || "Nos",
      rate: Number(input.rate || firstItem?.rate || 0),
      description: packedDescription,
      terms: input.terms || DEFAULT_QUOTATION_TERMS,
      status: input.status || "Draft",
    };

    const { data: fallbackData, error: fallbackError } = await supabase
      .from("quotations")
      .insert(fallbackPayload)
      .select("*")
      .single();

    if (fallbackError) {
      console.error("Error creating quotation:", fallbackError.message || fallbackError);
      return { error: fallbackError.message || "Failed to create quotation" };
    }

    return { data: normalizeQuotation(fallbackData as RawQuotationRow) };
  } catch (error) {
    console.error("Service error (createQuotation):", error);
    return { error: "Internal server error" };
  }
}

export async function updateQuotationService(
  id: string,
  input: Partial<CreateQuotationDTO>
): Promise<{ data?: Quotation; error?: string }> {
  if (!isValidUUID(id)) {
    return { error: "Invalid quotation ID format." };
  }

  try {
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", id)
      .single();

    const existingNormalized = existing ? normalizeQuotation(existing as RawQuotationRow) : null;

    const mergedItems = input.items !== undefined ? input.items : existingNormalized?.items || [];
    const mergedAddress = input.client_address !== undefined ? input.client_address : existingNormalized?.client_address;
    const mergedDate = input.quotation_date !== undefined ? input.quotation_date : existingNormalized?.quotation_date;
    const mergedProjectType = input.project_type !== undefined ? input.project_type : existingNormalized?.project_type || "Wiring";
    const mergedSubject = input.subject !== undefined ? input.subject : existingNormalized?.subject;
    const mergedIntro = input.intro_text !== undefined ? input.intro_text : existingNormalized?.intro_text;

    const packedDescription = JSON.stringify({
      items: mergedItems,
      client_address: mergedAddress,
      quotation_date: mergedDate,
      project_type: mergedProjectType,
      subject: mergedSubject,
      intro_text: mergedIntro,
    });

    const updatePayload: Record<string, unknown> = {};
    if (input.client_name !== undefined) updatePayload.client_name = input.client_name;
    if (input.client_phone !== undefined) updatePayload.client_phone = input.client_phone;
    if (input.client_place !== undefined) updatePayload.client_place = input.client_place;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.terms !== undefined) updatePayload.terms = input.terms;
    updatePayload.description = packedDescription;

    try {
      const { data, error } = await supabase
        .from("quotations")
        .update({
          ...updatePayload,
          items: mergedItems,
          client_address: mergedAddress,
          quotation_date: mergedDate,
          project_type: mergedProjectType,
          subject: mergedSubject,
          intro_text: mergedIntro,
        })
        .eq("id", id)
        .select("*")
        .single();

      if (!error && data) {
        return { data: normalizeQuotation(data as RawQuotationRow) };
      }
    } catch {
      // fallback
    }

    const { data: fallbackData, error: fallbackError } = await supabase
      .from("quotations")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (fallbackError) {
      console.error("Error updating quotation:", fallbackError);
      return { error: "Failed to update quotation" };
    }

    return { data: normalizeQuotation(fallbackData as RawQuotationRow) };
  } catch (error) {
    console.error("Service error (updateQuotation):", error);
    return { error: "Internal server error" };
  }
}

export async function deleteQuotationService(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isValidUUID(id)) {
    return { success: false, error: "Invalid quotation ID format." };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("quotations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting quotation:", error);
      return { success: false, error: "Failed to delete quotation" };
    }

    return { success: true };
  } catch (error) {
    console.error("Service error (deleteQuotation):", error);
    return { success: false, error: "Internal server error" };
  }
}
