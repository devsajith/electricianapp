export type QuotationStatus = "Draft" | "Sent" | "Approved" | "Rejected";
export type QuotationProjectType = "Wiring" | "Plumbing" | "Wiring and Plumbing";

export interface QuotationItem {
  id: string;
  description: string;
  unit: string;
  rate: number;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  quotation_date?: string | null;
  client_name: string;
  client_address?: string | null;
  client_phone?: string | null;
  client_place?: string | null;
  project_type?: QuotationProjectType | string | null;
  subject?: string | null;
  intro_text?: string | null;
  items: QuotationItem[];
  unit?: string;
  rate?: number;
  description?: string | null;
  terms?: string | null;
  status: QuotationStatus;
  created_at: string;
  updated_at?: string;
}

export interface CreateQuotationDTO {
  quotation_number?: string;
  quotation_date?: string;
  client_name: string;
  client_address?: string | null;
  client_phone?: string | null;
  client_place?: string | null;
  project_type?: QuotationProjectType | string | null;
  subject?: string;
  intro_text?: string;
  items: QuotationItem[];
  unit?: string;
  rate?: number;
  description?: string | null;
  terms?: string | null;
  status?: string;
}

export const DEFAULT_QUOTATION_SUBJECT =
  "Quotation for electrical wiring and fixture installation, common areas, Block A.";

export const DEFAULT_QUOTATION_INTRO =
  "With reference to our site visit, we are pleased to submit our quotation for the supply and installation of the items listed below. Rates are inclusive of labour and exclusive of GST.";

export const DEFAULT_QUOTATION_TERMS = `1. Quotation valid for 30 days from the date above.
2. 50% advance on order confirmation; balance on completion.
3. Work to be completed within 15 working days of advance payment.`;

export const REFERENCE_SAMPLE_ITEMS: QuotationItem[] = [
  {
    id: "1",
    description: "Supply & fixing of 18W LED panel light (2x2 ft)",
    unit: "Nos",
    rate: 850.0,
  },
  {
    id: "2",
    description: "Copper wiring, 1.5 sq.mm FR PVC cable (Havells or equivalent)",
    unit: "Meter",
    rate: 28.0,
  },
  {
    id: "3",
    description: "Copper wiring, 2.5 sq.mm FR PVC cable (Havells or equivalent)",
    unit: "Meter",
    rate: 42.0,
  },
  {
    id: "4",
    description: "Modular switch & socket (6A / 16A) with cover plate",
    unit: "Nos",
    rate: 180.0,
  },
  {
    id: "5",
    description: "MCB distribution board, 8-way, with 32A MCBs",
    unit: "Set",
    rate: 6500.0,
  },
  {
    id: "6",
    description: "Ceiling fan installation, including wiring and regulator",
    unit: "Nos",
    rate: 450.0,
  },
  {
    id: "7",
    description: "Earthing pit with GI plate, complete",
    unit: "Nos",
    rate: 4200.0,
  },
  {
    id: "8",
    description: "Labour for conduit laying and concealed wiring",
    unit: "Point",
    rate: 320.0,
  },
];

export const initialSampleQuotations: Quotation[] = [];
