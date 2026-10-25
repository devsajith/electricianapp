export interface Labour {
  id: string;
  name: string;
  phone: string;
  place: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateLabourDTO {
  name: string;
  phone: string;
  place: string;
}

export type LabourAttendanceStatus =
  | "full_day"
  | "half_day"
  | "overtime"
  | "absent"
  | "payment_only";

export interface LabourEntry {
  id: string;
  worker_id: string;
  date: string;
  day: string;
  project_id: string;
  project_name: string;
  tach: string;
  ot: string;
  amount_paid: number;
  amount?: number;
  attendance_status?: LabourAttendanceStatus;
  created_at?: string;
}

export interface CreateLabourEntryDTO {
  worker_id: string;
  date: string;
  day?: string;
  project_id: string;
  project_name?: string;
  tach: string;
  ot: string;
  amount_paid: number;
  amount?: number;
  attendance_status?: LabourAttendanceStatus;
}

export const initialSampleLabours: Labour[] = [];

export const initialSampleLabourEntries: LabourEntry[] = [];

