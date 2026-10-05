import { createClient } from "@/lib/supabase/server";
import { getProjectsAction } from "./projects/actions";
import { getPaymentsAction } from "./payments/actions";
import { getExpensesAction } from "./expenses/actions";
import { DashboardClient } from "./dashboard-client";
import { withTimeout } from "@/lib/timeout";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Parallelize auth user verification with data retrieval
  const userPromise = withTimeout(
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        return data?.user || null;
      } catch {
        return null;
      }
    })(),
    null,
    2000
  );

  const dataPromise = withTimeout(
    Promise.all([
      getProjectsAction(),
      getPaymentsAction(),
      getExpensesAction(),
    ]),
    [[], { data: [] }, { data: [] }],
    2500
  );

  const [user, [projectsRes, paymentsRes, expensesRes]] = await Promise.all([
    userPromise,
    dataPromise,
  ]);

  const projects = projectsRes && projectsRes.length > 0 ? projectsRes : [];

  return (
    <DashboardClient
      initialProjects={projects}
      initialPayments={paymentsRes.data || []}
      initialExpenses={expensesRes.data || []}
      userEmail={user?.email}
    />
  );
}
