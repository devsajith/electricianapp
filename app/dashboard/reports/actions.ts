"use server";

import { getPaymentsService } from "@/services/payment.service";
import { getProjectsService } from "@/services/project.service";
import { getExpensesService } from "@/services/expense.service";
import { Payment, initialSamplePayments } from "@/lib/types/payment";
import { Expense, initialSampleExpenses } from "@/lib/types/expense";
import { Project } from "@/services/project.service";
import { withTimeout } from "@/lib/timeout";
import { getQuotationsService } from "@/services/quotation.service";
import { Quotation } from "@/lib/types/quotation";

const sampleProjectsFallback: Project[] = [
  {
    id: "sample-1",
    project_number: "PRJ-918234",
    name: "Apex Retail Plaza",
    phone: "(555) 234-5678",
    place: "742 Commercial Blvd, Suite 100",
    type: "Commercial Wiring",
    description: "Routine quarterly panel check and emergency lighting battery tests.",
    start_date: "2026-09-10",
    end_date: "2026-09-22",
    status: "Ongoing",
  },
  {
    id: "sample-2",
    project_number: "PRJ-482019",
    name: "Sarah Jenkins",
    phone: "(555) 876-5432",
    place: "1849 Maple Street, Austin TX",
    type: "Residential Wiring",
    description: "Kitchen rewiring and water heater electrical/pipe hookup.",
    start_date: "2026-09-01",
    end_date: "2026-09-12",
    status: "Completed",
  },
  {
    id: "sample-3",
    project_number: "PRJ-631940",
    name: "Marcus Vance",
    phone: "(555) 345-6789",
    place: "305 Innovation Way, Building B",
    type: "Emergency Repair",
    description: "Urgent main breaker trip investigation and emergency repair.",
    start_date: "2026-09-14",
    end_date: "2026-09-15",
    status: "Ongoing",
  },
];

export interface ReportsData {
  payments: Payment[];
  projects: Project[];
  expenses: Expense[];
  estimates: Quotation[];
}

export async function getReportsDataAction(): Promise<ReportsData> {
  try {
    const [payRes, projRes, expRes, estRes] = await withTimeout(
      Promise.all([
        getPaymentsService(),
        getProjectsService(),
        getExpensesService(),
        getQuotationsService(),
      ]),
      [
        { data: initialSamplePayments },
        { data: sampleProjectsFallback },
        { data: initialSampleExpenses },
        { data: [] },
      ],
      2500
    );

    const payments =
      payRes.data && payRes.data.length > 0
        ? payRes.data
        : initialSamplePayments;

    const projects =
      projRes.data && projRes.data.length > 0
        ? projRes.data
        : sampleProjectsFallback;

    const expenses =
      expRes.data && expRes.data.length > 0
        ? expRes.data
        : initialSampleExpenses;

    const estimates =
      estRes.data && estRes.data.length > 0
        ? estRes.data
        : [];

    return {
      payments,
      projects,
      expenses,
      estimates,
    };
  } catch (error) {
    console.error("Error in getReportsDataAction:", error);
    return {
      payments: initialSamplePayments,
      projects: sampleProjectsFallback,
      expenses: initialSampleExpenses,
      estimates: [],
    };
  }
}
