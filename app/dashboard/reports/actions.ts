"use server";

import { getPaymentsService } from "@/services/payment.service";
import { getProjectsService } from "@/services/project.service";
import { getExpensesService } from "@/services/expense.service";
import { getEstimatesService } from "@/services/estimate.service";
import { Payment, initialSamplePayments } from "@/lib/types/payment";
import { Expense, initialSampleExpenses } from "@/lib/types/expense";
import { Project } from "@/services/project.service";
import { Estimate, initialSampleEstimates } from "@/lib/types/estimate";

const sampleProjectsFallback: Project[] = [
  {
    id: "sample-1",
    project_number: "PRJ-918234",
    customer_name: "Apex Retail Plaza",
    customer_phone: "(555) 234-5678",
    address: "742 Commercial Blvd, Suite 100",
    project_type: "Commercial Wiring",
    work_description: "Routine quarterly panel check and emergency lighting battery tests.",
    start_date: "2026-09-10",
    expected_completion_date: "2026-09-22",
    status: "In Progress",
    notes: "Permit #EL-2026-894 approved. Keycard at security desk.",
  },
  {
    id: "sample-2",
    project_number: "PRJ-482019",
    customer_name: "Sarah Jenkins",
    customer_phone: "(555) 876-5432",
    address: "1849 Maple Street, Austin TX",
    project_type: "Residential Wiring",
    work_description: "Kitchen rewiring and water heater electrical/pipe hookup.",
    start_date: "2026-09-01",
    expected_completion_date: "2026-09-12",
    status: "Completed",
    notes: "Client signed off on final walkthrough.",
  },
  {
    id: "sample-3",
    project_number: "PRJ-631940",
    customer_name: "Marcus Vance",
    customer_phone: "(555) 345-6789",
    address: "305 Innovation Way, Building B",
    project_type: "Emergency Repair",
    work_description: "Urgent main breaker trip investigation and emergency repair.",
    start_date: "2026-09-14",
    expected_completion_date: "2026-09-15",
    status: "Scheduled",
    notes: "Emergency dispatch technician assigned.",
  },
];

export interface ReportsData {
  payments: Payment[];
  projects: Project[];
  expenses: Expense[];
  estimates: Estimate[];
}

export async function getReportsDataAction(): Promise<ReportsData> {
  try {
    const [payRes, projRes, expRes, estRes] = await Promise.all([
      getPaymentsService(),
      getProjectsService(),
      getExpensesService(),
      getEstimatesService(),
    ]);

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
        : initialSampleEstimates;

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
      estimates: initialSampleEstimates,
    };
  }
}
