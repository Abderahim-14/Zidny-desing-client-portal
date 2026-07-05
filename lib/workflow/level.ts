// Freelancer level badge (Junior/Mid/Senior). The portal schema has no
// dedicated "level" field -- freelancer_profiles.skills carries a per-skill
// level (e.g. [{"skill":"React","level":"senior"}]).

export type FreelancerLevel = "Junior" | "Mid" | "Senior";

export function capitalizeLevel(level: string | undefined): FreelancerLevel {
  const normalized = level?.toLowerCase();
  if (normalized === "senior") return "Senior";
  if (normalized === "mid") return "Mid";
  return "Junior";
}

// Roster-row simplification only: take the primary (first) skill's level as
// a single overall badge. The freelancer detail view shows accurate
// per-skill levels instead via capitalizeLevel() directly -- see
// lib/data/admin.ts getFreelancerDetail().
export function deriveFreelancerLevel(
  skills: { skill: string; level: string }[]
): FreelancerLevel {
  return capitalizeLevel(skills[0]?.level);
}
