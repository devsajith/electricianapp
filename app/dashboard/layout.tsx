import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { redirect } from "next/navigation";
import { withTimeout } from "@/lib/timeout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const user = await withTimeout(
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        return data?.user || null;
      } catch {
        return null;
      }
    })(),
    null,
    2500
  );

  // If user is not authenticated, redirect to login page
  if (!user) {
    redirect("/login");
  }

  return <DashboardShell userEmail={user.email}>{children}</DashboardShell>;
}
