import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/portal/types";

export interface CurrentActor {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

// The ONLY sanctioned way to learn "who is calling". Resolves the real
// Supabase Auth session (auth.uid()) and looks up its role from public.users
// via the session-bound client -- never trusts a role/id handed in by the
// caller. Every server action that ends up calling lib/workflow/actions.ts
// or lib/portal/PortalClient.ts must start here, so no workflow action ever
// runs with an unverified actor.
export async function getCurrentActor(): Promise<CurrentActor> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, email, role, first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    redirect("/login");
  }

  return {
    userId: profile.id,
    email: profile.email,
    role: profile.role as UserRole,
    name: `${profile.first_name} ${profile.last_name}`.trim(),
  };
}

export async function requireAdmin(): Promise<CurrentActor> {
  const actor = await getCurrentActor();
  if (actor.role !== "admin") {
    redirect("/login?error=Admin%20access%20only");
  }
  return actor;
}

export async function requireClient(): Promise<CurrentActor> {
  const actor = await getCurrentActor();
  if (actor.role !== "client") {
    redirect("/login?error=Client%20access%20only");
  }
  return actor;
}

export async function requireFreelancer(): Promise<CurrentActor> {
  const actor = await getCurrentActor();
  if (actor.role !== "freelancer") {
    redirect("/login?error=Freelancer%20access%20only");
  }
  return actor;
}
