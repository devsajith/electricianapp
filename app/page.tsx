import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pandali Electrical and Plumbing Solutions | Professional Services",
  description:
    "Certified licensed contractor delivering residential wiring, sanitary plumbing, 3-phase commercial switchgear, and 24/7 emergency repair solutions.",
};

export default async function Home() {
  let user = null;

  try {
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (currentUser) {
      user = { email: currentUser.email };
    }
  } catch {
    user = null;
  }

  return <LandingPage user={user} />;
}
