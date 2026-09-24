import { createClient } from "@/lib/supabase/server";
import { getProjectsAction } from "./projects/actions";
import { getPaymentsAction } from "./payments/actions";
import { getExpensesAction } from "./expenses/actions";
import { getEstimatesAction } from "./estimates/actions";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [projectsRes, paymentsRes, expensesRes, estimatesRes] = await Promise.all([
    getProjectsAction(),
    getPaymentsAction(),
    getExpensesAction(),
    getEstimatesAction(),
  ]);

  const projects =
    projectsRes && projectsRes.length > 0
      ? projectsRes
      : [
          {
            id: "sample-1",
            project_number: "PRJ-918234",
            customer_name: "Apex Retail Plaza",
            customer_phone: "+91 98450 11223",
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
            customer_phone: "+91 97412 88392",
            address: "1849 Maple Street, Austin TX",
            project_type: "Residential Wiring & Plumbing",
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
            customer_phone: "+91 94480 33441",
            address: "305 Innovation Way, Building B",
            project_type: "Emergency Repair",
            work_description: "Urgent main breaker trip investigation and emergency repair.",
            start_date: "2026-09-14",
            expected_completion_date: "2026-09-15",
            status: "Scheduled",
            notes: "Emergency dispatch technician assigned.",
          },
        ];

  return (
    <DashboardClient
      initialProjects={projects}
      initialPayments={paymentsRes.data || []}
      initialExpenses={expensesRes.data || []}
      initialEstimates={estimatesRes || []}
      userEmail={user?.email}
    />
  );
}
