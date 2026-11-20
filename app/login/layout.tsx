import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { withTimeout } from "@/lib/timeout";

export default async function LoginLayout({
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
    8000
  );

  if (user) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
