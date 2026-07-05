import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PackageTier, ProjectTrack } from "@/lib/portal/types";
import type { StageStatus } from "@/lib/workflow/transitions";

// Client read layer. Deliberately never selects freelancer_id or joins any
// freelancer-shaped table -- the client must never see freelancer identity
// (CLAUDE.md #4), and the simplest way to guarantee that is to not touch
// those tables here at all rather than rely on RLS to silently null out an
// embedded join.

function projectLabelOf(p: { track: ProjectTrack; portal_payload: { brief_summary?: string } | null }): string {
  return p.portal_payload?.brief_summary ?? `${p.track} project`;
}

export interface ClientProjectSummary {
  id: string;
  track: ProjectTrack;
  projectLabel: string;
  status: "active" | "paused" | "completed";
}

export async function listClientProjects(clientUserId: string): Promise<ClientProjectSummary[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, track, status, portal_payload")
    .eq("client_id", clientUserId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    track: p.track,
    status: p.status,
    projectLabel: projectLabelOf(p),
  }));
}

export interface ClientProjectDetail {
  id: string;
  track: ProjectTrack;
  packageTier: PackageTier;
  status: "active" | "paused" | "completed";
  projectLabel: string;
  portalPayload: Record<string, unknown>;
}

export async function getClientProject(
  projectId: string,
  clientUserId: string
): Promise<ClientProjectDetail | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, track, package_tier, status, portal_payload")
    .eq("id", projectId)
    .eq("client_id", clientUserId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    track: data.track,
    packageTier: data.package_tier,
    status: data.status,
    projectLabel: projectLabelOf(data),
    portalPayload: data.portal_payload ?? {},
  };
}

export interface ClientStageDeliverable {
  id: string;
  name: string;
  description: string | null;
  type: string;
}

export interface ClientStage {
  stageNumber: number;
  name: string;
  status: StageStatus;
  // Only ever populated with rows the client's own session can see --
  // deliverables_select_client RLS restricts that to status = 'approved'
  // on the client's own project, so no extra filter is needed here.
  approvedDeliverables: ClientStageDeliverable[];
}

interface ClientStageDbRow {
  stage_number: number;
  name: string;
  status: StageStatus;
  deliverables: { id: string; name: string; description: string | null; type: string }[];
}

export async function getClientProjectStages(projectId: string): Promise<ClientStage[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("stages")
    .select("stage_number, name, status, deliverables(id, name, description, type)")
    .eq("project_id", projectId)
    .order("stage_number", { ascending: true });
  if (error) throw error;

  return ((data ?? []) as unknown as ClientStageDbRow[]).map((s) => ({
    stageNumber: s.stage_number,
    name: s.name,
    status: s.status,
    approvedDeliverables: s.deliverables,
  }));
}

export interface OwnClientReview {
  rating: number;
  feedback: string | null;
  createdAt: string;
}

export async function getOwnClientReview(
  projectId: string,
  clientUserId: string
): Promise<OwnClientReview | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_reviews")
    .select("rating, feedback, created_at")
    .eq("project_id", projectId)
    .eq("reviewer_role", "client")
    .eq("reviewer_id", clientUserId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { rating: data.rating as number, feedback: data.feedback, createdAt: data.created_at };
}
