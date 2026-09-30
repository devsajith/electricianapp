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

export interface LabourEntry {
  id: string;
  worker_id: string;
  date: string;
  day: string;
  project_id: string;
  project_name: string;
  tach: string;
  ot: string;
  amount: number;
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
  amount: number;
}

export const initialSampleLabours: Labour[] = [
  {
    id: "lab-1",
    name: "Robert Miller",
    phone: "9876543210",
    place: "Kochi",
    created_at: new Date().toISOString(),
  },
  {
    id: "lab-2",
    name: "James Carter",
    phone: "9845123456",
    place: "Aluva",
    created_at: new Date().toISOString(),
  },
  {
    id: "lab-3",
    name: "Alex Rivera",
    phone: "9745678901",
    place: "Angamaly",
    created_at: new Date().toISOString(),
  },
];

export const initialSampleLabourEntries: LabourEntry[] = [
  {
    id: "ent-1",
    worker_id: "lab-1",
    date: "2026-09-28",
    day: "Monday",
    project_id: "proj-1",
    project_name: "Apex Commercial Plaza",
    tach: "1",
    ot: "2 hrs",
    amount: 950,
    created_at: new Date().toISOString(),
  },
  {
    id: "ent-2",
    worker_id: "lab-1",
    date: "2026-09-29",
    day: "Tuesday",
    project_id: "proj-2",
    project_name: "Green Valley Villa",
    tach: "1",
    ot: "0",
    amount: 750,
    created_at: new Date().toISOString(),
  },
  {
    id: "ent-3",
    worker_id: "lab-1",
    date: "2026-09-30",
    day: "Wednesday",
    project_id: "proj-1",
    project_name: "Apex Commercial Plaza",
    tach: "1",
    ot: "1 hr",
    amount: 850,
    created_at: new Date().toISOString(),
  },
];
