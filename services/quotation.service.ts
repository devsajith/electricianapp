import { createClient } from "@/lib/supabase/server";
import { Quotation, CreateQuotationDTO } from "@/lib/types/quotation";
import { withTimeout } from "@/lib/timeout";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id?: string | null): boolean {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

const QUOTATION_COLUMNS =
  "id, quotation_number, client_name, client_phone, client_place, unit, rate, description, terms, status, created_at, updated_at";

export async function getQuotationsService(): Promise<{ data: Quotation[]; error?: string }> {
  return withTimeout(
    (async () => {
      try {
        const supabase = await createClient();

        const { data, error } = await supabase
          .from("quotations")
          .select(QUOTATION_COLUMNS)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching quotations:", error.message || error);
          return { data: [], error: error.message };
        }

        return { data: (data || []) as Quotation[] };
      } catch (error) {
        console.error("Service error (getQuotations):", error);
        return { data: [], error: error instanceof Error ? error.message : "Internal server error" };
      }
    })(),
    { data: [], error: "timeout" },
    2500
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
      .select(QUOTATION_COLUMNS)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching quotation:", error);
      return { error: "Failed to fetch quotation" };
    }

    return { data: data as Quotation };
  } catch (error) {
    console.error("Service error (getQuotationById):", error);
    return { error: "Internal server error" };
  }
}

export async function createQuotationService(input: CreateQuotationDTO): Promise<{ data?: Quotation; error?: string }> {
  try {
    const supabase = await createClient();

    const quotation_number = input.quotation_number || `QTN-2026-${Math.floor(100 + Math.random() * 900)}`;

    const { data, error } = await supabase
      .from("quotations")
      .insert({
        quotation_number,
        client_name: input.client_name,
        client_phone: input.client_phone,
        client_place: input.client_place,
        unit: input.unit || "Sqft",
        rate: Number(input.rate) || 0,
        description: input.description,
        terms: input.terms,
        status: input.status || "Draft",
      })
      .select(QUOTATION_COLUMNS)
      .single();

    if (error) {
      console.error("Error creating quotation:", error.message || error);
      return { error: error.message || "Failed to create quotation" };
    }

    return { data: data as Quotation };
  } catch (error) {
    console.error("Service error (createQuotation):", error);
    return { error: "Internal server error" };
  }
}

export async function updateQuotationService(id: string, input: Partial<CreateQuotationDTO>): Promise<{ data?: Quotation; error?: string }> {
  if (!isValidUUID(id)) {
    return { error: "Invalid quotation ID format." };
  }

  try {
    const supabase = await createClient();

    const payload: Record<string, unknown> = { ...input };
    if (payload.rate !== undefined) payload.rate = Number(payload.rate);

    const { data, error } = await supabase
      .from("quotations")
      .update(payload)
      .eq("id", id)
      .select(QUOTATION_COLUMNS)
      .single();

    if (error) {
      console.error("Error updating quotation:", error);
      return { error: "Failed to update quotation" };
    }

    return { data: data as Quotation };
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
