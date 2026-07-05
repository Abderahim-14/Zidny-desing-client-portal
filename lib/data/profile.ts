import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { capitalizeLevel, type FreelancerLevel } from "@/lib/workflow/level";

// Own-profile reads, session-bound client only. Distinct from
// lib/data/admin.ts getFreelancerDetail(), which is an ADMIN viewing
// someone else's full record -- these functions only ever return the
// calling user's own row, enforced by RLS (freelancer_profiles_select_own /
// client_profiles_select_own), not by an explicit ownership check here.

export interface OwnFreelancerProfile {
  headline: string | null;
  bio: string | null;
  wilaya: string | null;
  avatarUrl: string | null;
  skills: { skill: string; level: FreelancerLevel }[];
}

export async function getOwnFreelancerProfile(userId: string): Promise<OwnFreelancerProfile | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("freelancer_profiles")
    .select("headline, bio, wilaya, avatar_url, skills")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const skills = (data.skills ?? []) as { skill: string; level: string }[];
  return {
    headline: data.headline,
    bio: data.bio,
    wilaya: data.wilaya,
    avatarUrl: data.avatar_url,
    skills: skills.map((s) => ({ skill: s.skill, level: capitalizeLevel(s.level) })),
  };
}

export interface OwnClientProfile {
  companyType: string | null;
  sector: string | null;
  wilaya: string | null;
  preferredServices: string[];
}

export async function getOwnClientProfile(userId: string): Promise<OwnClientProfile | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("client_profiles")
    .select("company_type, sector, wilaya, preferred_services")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    companyType: data.company_type,
    sector: data.sector,
    wilaya: data.wilaya,
    preferredServices: data.preferred_services ?? [],
  };
}
