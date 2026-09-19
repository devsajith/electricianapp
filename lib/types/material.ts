export type MaterialCategory =
  | "Wiring & Cable"
  | "Panels & Breakers"
  | "Switches & Outlets"
  | "Lighting"
  | "Conduit & Fittings"
  | "Tools & Accessories";

export type MaterialUnit = "meter" | "nos" | "box" | "roll" | "set" | "kg" | "sqft";

export interface Material {
  id: string;
  item_name: string;
  category: MaterialCategory | string;
  brand?: string | null;
  unit: string;
  default_price: number; // numeric in ₹
  supplier?: string | null;
  notes?: string | null;
  is_active: boolean; // boolean status
  created_at?: string;
  updated_at?: string;
}

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  "Wiring & Cable",
  "Panels & Breakers",
  "Switches & Outlets",
  "Lighting",
  "Conduit & Fittings",
  "Tools & Accessories",
];

export const MATERIAL_UNITS: MaterialUnit[] = [
  "meter",
  "nos",
  "box",
  "roll",
  "set",
  "kg",
  "sqft",
];

export const initialSampleMaterials: Material[] = [
  {
    id: "mat-101",
    item_name: "2.5 sq mm Copper Armoured Wire (90m Roll)",
    category: "Wiring & Cable",
    brand: "Polycab",
    unit: "roll",
    default_price: 3450,
    supplier: "Polycab Wires Ltd.",
    notes: "Multi-strand FR copper insulated electrical wire suitable for domestic & commercial wiring.",
    is_active: true,
    created_at: "2026-09-01T08:00:00Z",
  },
  {
    id: "mat-102",
    item_name: "200A 3-Phase Main Distribution Panel",
    category: "Panels & Breakers",
    brand: "Havells",
    unit: "nos",
    default_price: 18500,
    supplier: "Havells India Ltd.",
    notes: "IP54 rated heavy duty metallic distribution enclosure with neutral link.",
    is_active: true,
    created_at: "2026-09-02T10:30:00Z",
  },
  {
    id: "mat-103",
    item_name: "20A Single Pole MCB C-Curve",
    category: "Panels & Breakers",
    brand: "Schneider",
    unit: "nos",
    default_price: 240,
    supplier: "Schneider Electric",
    notes: "Miniature circuit breaker 10kA breaking capacity for overcurrent protection.",
    is_active: true,
    created_at: "2026-09-03T11:15:00Z",
  },
  {
    id: "mat-104",
    item_name: "16A Modular Socket with Switch & Indicator",
    category: "Switches & Outlets",
    brand: "Anchor",
    unit: "nos",
    default_price: 320,
    supplier: "Anchor by Panasonic",
    notes: "Flame retardant polycarbonate modular heavy-duty socket combo.",
    is_active: true,
    created_at: "2026-09-04T09:00:00Z",
  },
  {
    id: "mat-105",
    item_name: "18W LED Surface Panel Light (Cool White)",
    category: "Lighting",
    brand: "Philips",
    unit: "nos",
    default_price: 650,
    supplier: "Philips Lighting",
    notes: "Slim round LED ceiling panel light with integrated driver, 6500K color temp.",
    is_active: true,
    created_at: "2026-09-05T14:20:00Z",
  },
  {
    id: "mat-106",
    item_name: "25mm Heavy Duty Rigid PVC Conduit Pipe (3m)",
    category: "Conduit & Fittings",
    brand: "Finolex",
    unit: "nos",
    default_price: 110,
    supplier: "Finolex Cables",
    notes: "High impact unplasticized PVC electrical conduit pipe for surface or concealed wiring.",
    is_active: false,
    created_at: "2026-09-06T16:00:00Z",
  },
];
