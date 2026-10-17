export type MaterialUnit =
  | "Meter"
  | "No"
  | "Bottle"
  | "Length"
  | "Kg"
  | "Pkt";

export interface Material {
  id: string;
  name: string;
  brand?: string | null;
  unit: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateMaterialDTO {
  name: string;
  brand?: string | null;
  unit?: string;
}

export const MATERIAL_UNITS: MaterialUnit[] = [
  "Meter",
  "No",
  "Bottle",
  "Length",
  "Kg",
  "Pkt",
];

export interface MaterialList {
  id: string;
  project_id?: string | null;
  project_number?: string;
  project_name?: string;
  title: string;
  status?: string;
  notes?: string | null;
  item_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface MaterialListItem {
  id: string;
  list_id: string;
  material_id?: string | null;
  name: string;
  brand?: string | null;
  unit: string;
  qty: number;
  is_purchased?: boolean;
  created_at?: string;
}

export interface CreateMaterialListItemDTO {
  material_id?: string | null;
  name: string;
  brand?: string | null;
  unit: string;
  qty: number;
}

export interface CreateMaterialListDTO {
  project_id?: string | null;
  title: string;
  notes?: string | null;
  items: CreateMaterialListItemDTO[];
}

export const initialSampleMaterials: Material[] = [
  { id: "mat-w1", name: "1.0 sq mm FR Copper Wire (90m Roll)", brand: "Polycab", unit: "roll" },
  { id: "mat-w2", name: "1.5 sq mm FR Copper Wire (90m Roll)", brand: "Polycab", unit: "roll" },
  { id: "mat-w3", name: "2.5 sq mm FR Copper Wire (90m Roll)", brand: "Polycab", unit: "roll" },
  { id: "mat-w4", name: "4.0 sq mm FR Copper Wire (90m Roll)", brand: "Finolex", unit: "roll" },
  { id: "mat-w5", name: "6.0 sq mm FR Copper Wire (90m Roll)", brand: "Finolex", unit: "roll" },
  { id: "mat-w6", name: "10 sq mm 4-Core Copper Armoured Cable", brand: "Havells", unit: "meter" },
  { id: "mat-c1", name: "20mm Rigid PVC Conduit Pipe (Heavy 3m)", brand: "Precision", unit: "length" },
  { id: "mat-c2", name: "25mm Rigid PVC Conduit Pipe (Heavy 3m)", brand: "Precision", unit: "length" },
  { id: "mat-c3", name: "20mm PVC Circular Junction Box (4-Way)", brand: "Precision", unit: "nos" },
  { id: "mat-s1", name: "6A 1-Way Modular Switch", brand: "Anchor Roma", unit: "nos" },
  { id: "mat-s2", name: "6A 2-Way Modular Switch", brand: "Anchor Roma", unit: "nos" },
  { id: "mat-s3", name: "16A 1-Way Power Switch", brand: "Anchor Roma", unit: "nos" },
  { id: "mat-s4", name: "6A 3-Pin Modular Socket", brand: "Anchor Roma", unit: "nos" },
  { id: "mat-b1", name: "10A Single Pole MCB C-Curve", brand: "Schneider", unit: "nos" },
  { id: "mat-b2", name: "16A Single Pole MCB C-Curve", brand: "Schneider", unit: "nos" },
  { id: "mat-b7", name: "40A 30mA 2-Pole RCCB / ELCB", brand: "Schneider", unit: "nos" },
  { id: "mat-b8", name: "8-Way SPN Distribution Board (Double Door)", brand: "Havells", unit: "nos" },
  { id: "mat-l1", name: "12W Round LED Concealed Downlight (Cool White)", brand: "Philips", unit: "nos" },
  { id: "mat-l3", name: "9W LED Bulb B22", brand: "Havells", unit: "nos" },
  { id: "mat-l4", name: "20W LED Batten Tube Light 4ft", brand: "Wipro", unit: "nos" },
  { id: "mat-a1", name: "Pure Copper Earth Rod (3m, 14mm dia)", brand: "Standard", unit: "nos" },
  { id: "mat-a4", name: "PVC Electrical Insulation Tape (Pack of 5)", brand: "Steelgrip", unit: "pkt" },
];
