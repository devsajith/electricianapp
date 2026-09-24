import { getReportsDataAction } from "./actions";
import { ReportsClient } from "./reports-client";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const data = await getReportsDataAction();

  return (
    <ReportsClient
      initialPayments={data.payments}
      initialProjects={data.projects}
      initialExpenses={data.expenses}
      initialEstimates={data.estimates}
    />
  );
}
