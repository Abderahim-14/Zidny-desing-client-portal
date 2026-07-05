import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProjectDetail } from "@/lib/data/admin";
import type { ProjectTrack } from "@/lib/portal/types";
import type { StageStatus } from "@/lib/workflow/transitions";

// Freelancer read layer -- session-bound (RLS-respecting) client only.
// Row visibility is enforced by the freelancer_id = auth.uid() policies on
// projects/stages/deliverables/meetings (migration 0001) -- these queries
// don't add their own role checks, RLS is the actual boundary.

interface NameRow {
  first_name: string;
  last_name: string;
}

function projectLabelOf(p: { track: ProjectTrack; portal_payload: { brief_summary?: string } | null }): string {
  return p.portal_payload?.brief_summary ?? `${p.track} project`;
}

export interface FreelancerProjectRow {
  id: string;
  clientName: string;
  projectLabel: string;
  track: ProjectTrack;
  status: "active" | "paused" | "completed";
  currentStageNumber: number;
  currentStageName: string;
  currentStageStatus: StageStatus;
  deadline: string | null;
}

interface FreelancerProjectDbRow {
  id: string;
  track: ProjectTrack;
  current_stage: number;
  status: "active" | "paused" | "completed";
  portal_payload: { brief_summary?: string } | null;
  client: NameRow | null;
  stages: { stage_number: number; name: string; status: StageStatus; deadline: string | null }[];
}

export async function listFreelancerProjects(freelancerUserId: string): Promise<FreelancerProjectRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, track, current_stage, status, portal_payload, client:users!projects_client_id_fkey(first_name,last_name), stages(stage_number, name, status, deadline)"
    )
    .eq("freelancer_id", freelancerUserId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return ((data ?? []) as unknown as FreelancerProjectDbRow[]).map((p) => {
    const currentStage = p.stages.find((s) => s.stage_number === p.current_stage);
    return {
      id: p.id,
      clientName: `${p.client?.first_name ?? ""} ${p.client?.last_name ?? ""}`.trim(),
      projectLabel: projectLabelOf(p),
      track: p.track,
      status: p.status,
      currentStageNumber: p.current_stage,
      currentStageName: currentStage?.name ?? "",
      currentStageStatus: (currentStage?.status ?? "locked") as StageStatus,
      deadline: currentStage?.deadline ?? null,
    };
  });
}

// Project detail: identical RLS-scoped query as the admin view
// (lib/data/admin.ts getProjectDetail already uses the session-bound
// client), so a freelancer's own session naturally gets back only what
// stages_select_freelancer / deliverables_select_freelancer / etc. allow --
// re-exported under a freelancer-facing name rather than duplicating the
// query.
export const getFreelancerProjectDetail = getProjectDetail;

export interface FreelancerOnTimeHistory {
  deliveriesCount: number;
  onTimeRate: number;
  lastUpdated: string | null;
}

// Calls the freelancer_own_on_time_history() SECURITY DEFINER function
// (migration 0002), which internally scopes to auth.uid() -- this must be
// called with the session-bound client for that to mean anything; it
// returns nothing for a service-role caller. Deliberately exposes only
// deliveries_count/on_time_rate/last_updated -- never score, revision_rate,
// or client_rating_avg (those stay admin-only per freelancer_quality_scores
// RLS, and the function itself doesn't expose them either).
export async function getFreelancerOwnOnTimeHistory(): Promise<FreelancerOnTimeHistory | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("freelancer_own_on_time_history");
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return {
    deliveriesCount: row.deliveries_count,
    onTimeRate: row.on_time_rate,
    lastUpdated: row.last_updated,
  };
}
