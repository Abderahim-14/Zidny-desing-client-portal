import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { capitalizeLevel, deriveFreelancerLevel, type FreelancerLevel } from "@/lib/workflow/level";
import type { PackageTier, ProjectTrack } from "@/lib/portal/types";
import type { DeliverableStatus, MeetingStatus, StageStatus } from "@/lib/workflow/transitions";

// Admin read layer -- uses the session-bound (RLS-respecting) client, not
// the service-role admin client. Admin's RLS policies already grant full
// SELECT, so there's no need to bypass RLS for reads; only
// lib/portal/PortalClient.ts and lib/workflow/actions.ts (the designated
// privileged boundaries) use the service-role client.

interface NameRow {
  first_name: string;
  last_name: string;
}

function fullName(row: NameRow | null | undefined): string {
  if (!row) return "";
  return `${row.first_name} ${row.last_name}`.trim();
}

// ---------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------

export interface DashboardProjectRow {
  id: string;
  clientName: string;
  projectLabel: string;
  track: ProjectTrack;
  freelancerName: string | null;
  currentStageNumber: number;
  currentStageName: string;
  currentStageStatus: StageStatus;
  deadline: string | null;
  projectStatus: "active" | "paused" | "completed";
}

interface DashboardProjectDbRow {
  id: string;
  track: ProjectTrack;
  current_stage: number;
  status: "active" | "paused" | "completed";
  portal_payload: { brief_summary?: string } | null;
  client: NameRow | null;
  freelancer: NameRow | null;
  stages: { stage_number: number; name: string; status: StageStatus; deadline: string | null }[];
}

export async function listProjectsForDashboard(): Promise<DashboardProjectRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, track, current_stage, status, portal_payload, client:users!projects_client_id_fkey(first_name,last_name), freelancer:users!projects_freelancer_id_fkey(first_name,last_name), stages(stage_number, name, status, deadline)"
    )
    .order("created_at", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as DashboardProjectDbRow[]).map((p) => {
    const currentStage = p.stages.find((s) => s.stage_number === p.current_stage);
    return {
      id: p.id,
      clientName: fullName(p.client),
      projectLabel: p.portal_payload?.brief_summary ?? `${p.track} project`,
      track: p.track,
      freelancerName: p.freelancer ? fullName(p.freelancer) : null,
      currentStageNumber: p.current_stage,
      currentStageName: currentStage?.name ?? "",
      currentStageStatus: (currentStage?.status ?? "locked") as StageStatus,
      deadline: currentStage?.deadline ?? null,
      projectStatus: p.status,
    };
  });
}

// ---------------------------------------------------------------------
// Freelancer roster
// ---------------------------------------------------------------------

export interface RosterRow {
  userId: string;
  name: string;
  headline: string | null;
  skillsSummary: string;
  level: FreelancerLevel;
  load: number;
  onTimePct: number;
  completedCount: number;
}

interface FreelancerProfileDbRow {
  id: string;
  user_id: string;
  headline: string | null;
  skills: { skill: string; level: string }[] | null;
  users: NameRow | null;
}

export async function listFreelancerRoster(): Promise<RosterRow[]> {
  const supabase = await createServerSupabaseClient();

  const [{ data: freelancers, error: fErr }, { data: quality, error: qErr }, { data: projects, error: pErr }] =
    await Promise.all([
      supabase
        .from("freelancer_profiles")
        .select("id, user_id, headline, skills, users(first_name,last_name)"),
      supabase.from("freelancer_quality_scores").select("freelancer_id, on_time_rate"),
      supabase.from("projects").select("freelancer_id, status"),
    ]);

  if (fErr) throw fErr;
  if (qErr) throw qErr;
  if (pErr) throw pErr;

  const onTimeByProfileId = new Map((quality ?? []).map((q) => [q.freelancer_id, q.on_time_rate]));

  return ((freelancers ?? []) as unknown as FreelancerProfileDbRow[]).map((f) => {
    const ownProjects = (projects ?? []).filter((p) => p.freelancer_id === f.user_id);
    const load = ownProjects.filter((p) => p.status === "active").length;
    const completedCount = ownProjects.filter((p) => p.status === "completed").length;
    const skills = f.skills ?? [];

    return {
      userId: f.user_id,
      name: fullName(f.users),
      headline: f.headline,
      skillsSummary: skills.map((s) => s.skill).join(", "),
      level: deriveFreelancerLevel(skills),
      load,
      onTimePct: Math.round((onTimeByProfileId.get(f.id) ?? 0) * 100),
      completedCount,
    };
  });
}

// ---------------------------------------------------------------------
// Project detail
// ---------------------------------------------------------------------

export interface ProjectDeliverable {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: DeliverableStatus;
  reworkNote: string | null;
}

export interface ProjectMeeting {
  id: string;
  status: MeetingStatus;
  scheduledAt: string | null;
  heldAt: string | null;
  outcome: "approved" | "sent_back" | null;
  notes: string | null;
}

export interface ProjectStage {
  id: string;
  stageNumber: number;
  name: string;
  status: StageStatus;
  deadline: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  meeting: ProjectMeeting | null;
  deliverables: ProjectDeliverable[];
}

export interface ProjectDetail {
  id: string;
  track: ProjectTrack;
  packageTier: PackageTier;
  status: "active" | "paused" | "completed";
  portalPayload: Record<string, unknown>;
  client: { userId: string; name: string };
  freelancer: { userId: string; name: string; level: FreelancerLevel } | null;
  stages: ProjectStage[];
}

interface ProjectDetailDbRow {
  id: string;
  track: ProjectTrack;
  package_tier: PackageTier;
  status: "active" | "paused" | "completed";
  portal_payload: Record<string, unknown>;
  client: (NameRow & { id: string }) | null;
  freelancer: (NameRow & { id: string }) | null;
}

interface StageDbRow {
  id: string;
  stage_number: number;
  name: string;
  status: StageStatus;
  deadline: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  deliverables: {
    id: string;
    name: string;
    description: string | null;
    type: string;
    status: DeliverableStatus;
    rework_note: string | null;
  }[];
  current_meeting:
    | {
        id: string;
        status: MeetingStatus;
        scheduled_at: string | null;
        held_at: string | null;
        outcome: "approved" | "sent_back" | null;
        notes: string | null;
      }[]
    | null;
}

export async function getProjectDetail(projectId: string): Promise<ProjectDetail | null> {
  const supabase = await createServerSupabaseClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      "id, track, package_tier, status, portal_payload, client:users!projects_client_id_fkey(id,first_name,last_name), freelancer:users!projects_freelancer_id_fkey(id,first_name,last_name)"
    )
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw error;
  if (!project) return null;

  const p = project as unknown as ProjectDetailDbRow;

  let freelancerLevel: FreelancerLevel = "Junior";
  if (p.freelancer) {
    const { data: profile } = await supabase
      .from("freelancer_profiles")
      .select("skills")
      .eq("user_id", p.freelancer.id)
      .maybeSingle();
    freelancerLevel = deriveFreelancerLevel(profile?.skills ?? []);
  }

  const { data: stages, error: stagesError } = await supabase
    .from("stages")
    .select(
      "id, stage_number, name, status, deadline, submitted_at, approved_at, deliverables(id,name,description,type,status,rework_note), current_meeting:meetings!stages_meeting_id_fkey(id,status,scheduled_at,held_at,outcome,notes)"
    )
    .eq("project_id", projectId)
    .order("stage_number", { ascending: true });

  if (stagesError) throw stagesError;

  const stageRows = (stages ?? []) as unknown as StageDbRow[];

  return {
    id: p.id,
    track: p.track,
    packageTier: p.package_tier,
    status: p.status,
    portalPayload: p.portal_payload ?? {},
    client: { userId: p.client?.id ?? "", name: fullName(p.client) },
    freelancer: p.freelancer
      ? { userId: p.freelancer.id, name: fullName(p.freelancer), level: freelancerLevel }
      : null,
    stages: stageRows.map((s) => {
      const meeting = s.current_meeting?.[0];
      return {
        id: s.id,
        stageNumber: s.stage_number,
        name: s.name,
        status: s.status,
        deadline: s.deadline,
        submittedAt: s.submitted_at,
        approvedAt: s.approved_at,
        meeting: meeting
          ? {
              id: meeting.id,
              status: meeting.status,
              scheduledAt: meeting.scheduled_at,
              heldAt: meeting.held_at,
              outcome: meeting.outcome,
              notes: meeting.notes,
            }
          : null,
        deliverables: s.deliverables.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          type: d.type,
          status: d.status,
          reworkNote: d.rework_note,
        })),
      };
    }),
  };
}

// ---------------------------------------------------------------------
// Freelancer detail (admin-only full profile -- roster row -> this page)
// ---------------------------------------------------------------------

export interface FreelancerDetail {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  headline: string | null;
  bio: string | null;
  wilaya: string | null;
  avatarUrl: string | null;
  skills: { skill: string; level: FreelancerLevel }[];
  availability: string | null;
  vettingStatus: string;
  internalScore: number;
  quality: {
    score: number;
    onTimeRate: number;
    deliveriesCount: number;
    revisionRate: number;
    clientRatingAvg: number;
  } | null;
  load: number;
  activeProjects: { id: string; track: ProjectTrack; projectLabel: string; currentStage: number }[];
  completedProjects: { id: string; track: ProjectTrack; projectLabel: string }[];
  portfolioItems: {
    id: string;
    title: string;
    description: string | null;
    fileUrl: string | null;
    linkUrl: string | null;
    mediaType: string;
  }[];
}

interface FreelancerDetailDbRow {
  id: string;
  headline: string | null;
  bio: string | null;
  wilaya: string | null;
  avatar_url: string | null;
  skills: { skill: string; level: string }[] | null;
  availability: string | null;
  vetting_status: string;
  internal_score: number;
  users: (NameRow & { email: string; phone: string | null }) | null;
}

function projectLabelOf(p: { track: ProjectTrack; portal_payload: { brief_summary?: string } | null }): string {
  return p.portal_payload?.brief_summary ?? `${p.track} project`;
}

export async function getFreelancerDetail(userId: string): Promise<FreelancerDetail | null> {
  const supabase = await createServerSupabaseClient();

  const { data: profile, error } = await supabase
    .from("freelancer_profiles")
    .select(
      "id, headline, bio, wilaya, avatar_url, skills, availability, vetting_status, internal_score, users(first_name,last_name,email,phone)"
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  const p = profile as unknown as FreelancerDetailDbRow;

  const [{ data: quality, error: qErr }, { data: projects, error: pErr }, { data: portfolio, error: fErr }] =
    await Promise.all([
      supabase
        .from("freelancer_quality_scores")
        .select("score, on_time_rate, deliveries_count, revision_rate, client_rating_avg")
        .eq("freelancer_id", p.id)
        .maybeSingle(),
      supabase
        .from("projects")
        .select("id, track, status, current_stage, portal_payload")
        .eq("freelancer_id", userId),
      supabase
        .from("portfolio_items")
        .select("id, title, description, file_url, link_url, media_type")
        .eq("freelancer_id", p.id)
        .order("order", { ascending: true }),
    ]);
  if (qErr) throw qErr;
  if (pErr) throw pErr;
  if (fErr) throw fErr;

  const active = (projects ?? []).filter((pr) => pr.status === "active");
  const completed = (projects ?? []).filter((pr) => pr.status === "completed");

  return {
    userId,
    name: fullName(p.users),
    email: p.users?.email ?? "",
    phone: p.users?.phone ?? null,
    headline: p.headline,
    bio: p.bio,
    wilaya: p.wilaya,
    avatarUrl: p.avatar_url,
    skills: (p.skills ?? []).map((s) => ({ skill: s.skill, level: capitalizeLevel(s.level) })),
    availability: p.availability,
    vettingStatus: p.vetting_status,
    internalScore: p.internal_score,
    quality: quality
      ? {
          score: quality.score,
          onTimeRate: Math.round(quality.on_time_rate * 100) / 100,
          deliveriesCount: quality.deliveries_count,
          revisionRate: Math.round(quality.revision_rate * 100) / 100,
          clientRatingAvg: quality.client_rating_avg,
        }
      : null,
    load: active.length,
    activeProjects: active.map((pr) => ({
      id: pr.id,
      track: pr.track,
      projectLabel: projectLabelOf(pr),
      currentStage: pr.current_stage,
    })),
    completedProjects: completed.map((pr) => ({
      id: pr.id,
      track: pr.track,
      projectLabel: projectLabelOf(pr),
    })),
    portfolioItems: (portfolio ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      fileUrl: item.file_url,
      linkUrl: item.link_url,
      mediaType: item.media_type,
    })),
  };
}

// ---------------------------------------------------------------------
// Post-completion reviews (admin-only visibility for both reviews)
// ---------------------------------------------------------------------

export interface ProjectReviewRow {
  reviewerId: string;
  rating: number | null;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectReviews {
  client: ProjectReviewRow | null;
  admin: ProjectReviewRow | null;
}

export async function getProjectReviews(projectId: string): Promise<ProjectReviews> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_reviews")
    .select("reviewer_id, reviewer_role, rating, feedback, created_at, updated_at")
    .eq("project_id", projectId);
  if (error) throw error;

  const mapRow = (r: { reviewer_id: string; rating: number | null; feedback: string | null; created_at: string; updated_at: string }): ProjectReviewRow => ({
    reviewerId: r.reviewer_id,
    rating: r.rating,
    feedback: r.feedback,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  });

  const clientRow = (data ?? []).find((r) => r.reviewer_role === "client");
  const adminRow = (data ?? []).find((r) => r.reviewer_role === "admin");

  return {
    client: clientRow ? mapRow(clientRow) : null,
    admin: adminRow ? mapRow(adminRow) : null,
  };
}
