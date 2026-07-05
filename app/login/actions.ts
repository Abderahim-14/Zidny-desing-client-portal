"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function login(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "Sign in failed.")}`);
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", data.user.id).maybeSingle();

  if (profile?.role === "client") {
    redirect("/client");
  }
  if (profile?.role === "freelancer") {
    redirect("/freelancer");
  }
  redirect("/admin");
}
