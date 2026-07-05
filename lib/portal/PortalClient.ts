import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { FIRST_ACTIVE_STAGE, STAGE_DEFINITIONS } from "@/lib/constants/stages";
import type {
  PortalClientProfile,
  PortalDeliveryEvent,
  PortalFreelancer,
  PortalFreelancerQuality,
  PortalProjectHandoffPayload,
  PortalProjectHandoffResult,
} from "@/lib/portal/types";

// The ONLY module allowed to touch portal-shaped data (CLAUDE.md #2).
// Every method below reads/writes the local Supabase mirror today; each is
// documented with a // PORTAL INTEGRATION: comment describing the real call
// it becomes once the Django portal hand-off is live. Nothing else in the
// app should import freelancer_profiles, client_profiles,
// freelancer_quality_scores, or portfolio_items directly -- go through
// PortalClient so that swap is a one-file change.

interface DbUserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
}

interface DbFreelancerProfileRow {
  user_id: string;
  headline: string | null;
  bio: string | null;
  wilaya: string | null;
  avatar_url: string | null;
  skills: { skill: string; level: string }[] | null;
  daily_rate: number | null;
  availability: PortalFreelancer["availability"];
  preferred_payout: PortalFreelancer["preferredPayout"];
  vetting_status: PortalFreelancer["vettingStatus"];
  internal_score: number;
  users: DbUserRow | null;
}

function mapFreelancer(row: DbFreelancerProfileRow): PortalFreelancer | null {
  if (!row.users) return null;
  return {
    userId: row.users.id,
    email: row.users.email,
    firstName: row.users.first_name,
    lastName: row.users.last_name,
    phone: row.users.phone,
    headline: row.headline,
    bio: row.bio,
    wilaya: row.wilaya,
    avatarUrl: row.avatar_url,
    skills: row.skills ?? [],
    dailyRate: row.daily_rate,
    availability: row.availability,
    preferredPayout: row.preferred_payout,
    vettingStatus: row.vetting_status,
    internalScore: row.internal_score,
  };
}

interface DbClientProfileRow {
  user_id: string;
  company_type: string | null;
  sector: string | null;
  wilaya: string | null;
  preferred_services: string[] | null;
  budget_range_min: number | null;
  budget_range_max: number | null;
  onboarding_completed: boolean;
  users: DbUserRow | null;
}

function mapClientProfile(row: DbClientProfileRow): PortalClientProfile | null {
  if (!row.users) return null;
  return {
    userId: row.users.id,
    email: row.users.email,
    firstName: row.users.first_name,
    lastName: row.users.last_name,
    phone: row.users.phone,
    companyType: row.company_type,
    sector: row.sector,
    wilaya: row.wilaya,
    preferredServices: row.preferred_services ?? [],
    budgetRangeMin: row.budget_range_min,
    budgetRangeMax: row.budget_range_max,
    onboardingCompleted: row.onboarding_completed,
  };
}

class PortalClient {
  // PORTAL INTEGRATION: becomes GET /api/freelancers/{userId} on the portal.
  async getFreelancer(userId: string): Promise<PortalFreelancer | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("freelancer_profiles")
      .select(
        "user_id, headline, bio, wilaya, avatar_url, skills, daily_rate, availability, preferred_payout, vetting_status, internal_score, users(id, email, first_name, last_name, phone)"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapFreelancer(data as unknown as DbFreelancerProfileRow);
  }

  // PORTAL INTEGRATION: becomes GET /api/freelancers on the portal
  // (paginated there; local roster is small enough to fetch in full).
  async listFreelancers(): Promise<PortalFreelancer[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("freelancer_profiles")
      .select(
        "user_id, headline, bio, wilaya, avatar_url, skills, daily_rate, availability, preferred_payout, vetting_status, internal_score, users(id, email, first_name, last_name, phone)"
      )
      .order("user_id", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as unknown as DbFreelancerProfileRow[])
      .map(mapFreelancer)
      .filter((f): f is PortalFreelancer => f !== null);
  }

  // Admin-only data (see freelancer_quality_scores RLS + migration 0002).
  // Callers must enforce that authorization themselves -- this adapter is
  // a trust boundary, not a permission check.
  // PORTAL INTEGRATION: becomes GET /api/freelancers/{userId}/quality-score.
  async getFreelancerQuality(userId: string): Promise<PortalFreelancerQuality | null> {
    const supabase = createAdminClient();

    const { data: profile, error: profileError } = await supabase
      .from("freelancer_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return null;

    const { data, error } = await supabase
      .from("freelancer_quality_scores")
      .select("score, deliveries_count, on_time_rate, revision_rate, client_rating_avg, last_updated")
      .eq("freelancer_id", profile.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    return {
      freelancerUserId: userId,
      score: data.score,
      deliveriesCount: data.deliveries_count,
      onTimeRate: data.on_time_rate,
      revisionRate: data.revision_rate,
      clientRatingAvg: data.client_rating_avg,
      lastUpdated: data.last_updated,
    };
  }

  // PORTAL INTEGRATION: becomes GET /api/clients/{userId} on the portal.
  async getClientProfile(userId: string): Promise<PortalClientProfile | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("client_profiles")
      .select(
        "user_id, company_type, sector, wilaya, preferred_services, budget_range_min, budget_range_max, onboarding_completed, users(id, email, first_name, last_name, phone)"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapClientProfile(data as unknown as DbClientProfileRow);
  }

  // Creates a project + its 5 stage rows from a portal onboarding payload.
  // Called by the seed data today; called by the portal's hand-off webhook
  // once Stages 1-2 live there for real.
  // PORTAL INTEGRATION: becomes the handler for an inbound
  // POST /api/internal/project-handoff from the portal.
  async receiveProjectHandoff(
    payload: PortalProjectHandoffPayload
  ): Promise<PortalProjectHandoffResult> {
    const supabase = createAdminClient();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        client_id: payload.clientId,
        freelancer_id: payload.freelancerId ?? null,
        track: payload.track,
        package_tier: payload.packageTier,
        current_stage: FIRST_ACTIVE_STAGE,
        status: "active",
        portal_payload: payload.onboardingSnapshot,
      })
      .select("id")
      .single();
    if (projectError) throw projectError;

    const stageRows = STAGE_DEFINITIONS.map((def) => ({
      project_id: project.id,
      stage_number: def.stageNumber,
      name: def.name,
      status: def.stageNumber === FIRST_ACTIVE_STAGE ? "in_progress" : "locked",
    }));

    const { data: stages, error: stagesError } = await supabase
      .from("stages")
      .insert(stageRows)
      .select("id, stage_number");

    if (stagesError) {
      // supabase-js has no cross-table transaction here; don't leave an
      // orphaned project with no stage rows behind.
      await supabase.from("projects").delete().eq("id", project.id);
      throw stagesError;
    }

    const stageIds: Record<number, string> = {};
    for (const stage of stages ?? []) {
      stageIds[stage.stage_number] = stage.id;
    }

    return { projectId: project.id, stageIds };
  }

  // Recomputes and writes freelancer_quality_scores in our LOCAL mirror.
  // This is our own data to maintain until the real hand-off lands (see
  // CLAUDE.md #2), so -- unlike sendDeliveryEvent below -- this is a real
  // write, not a stub. Called by the state-machine on stage approve/
  // send_back (lib/workflow/actions.ts), once per concluded review cycle:
  // deliveries_count increments each call; on_time_rate and revision_rate
  // are running averages across cycles, not just the terminal approval.
  async recordDeliveryOutcome(
    freelancerUserId: string,
    event: PortalDeliveryEvent
  ): Promise<void> {
    const supabase = createAdminClient();

    const { data: profile, error: profileError } = await supabase
      .from("freelancer_profiles")
      .select("id")
      .eq("user_id", freelancerUserId)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return;

    const { data: existing, error: fetchError } = await supabase
      .from("freelancer_quality_scores")
      .select("deliveries_count, on_time_rate, revision_rate")
      .eq("freelancer_id", profile.id)
      .maybeSingle();
    if (fetchError) throw fetchError;

    const priorDeliveries = existing?.deliveries_count ?? 0;
    const priorOnTimeRate = existing?.on_time_rate ?? 0;
    const priorRevisionRate = existing?.revision_rate ?? 0;

    const newDeliveries = priorDeliveries + 1;
    const priorOnTimeCount = priorOnTimeRate * priorDeliveries;
    const newOnTimeRate = (priorOnTimeCount + (event.onTime ? 1 : 0)) / newDeliveries;
    const priorRevisionTotal = priorRevisionRate * priorDeliveries;
    const newRevisionRate = (priorRevisionTotal + event.revisionCount) / newDeliveries;

    const { error: upsertError } = await supabase
      .from("freelancer_quality_scores")
      .upsert(
        {
          freelancer_id: profile.id,
          deliveries_count: newDeliveries,
          on_time_rate: newOnTimeRate,
          revision_rate: newRevisionRate,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "freelancer_id" }
      );
    if (upsertError) throw upsertError;
  }

  // Recomputes freelancer_quality_scores.client_rating_avg -- another
  // local-mirror write, same basis as recordDeliveryOutcome above. Called
  // when a client submits their post-completion project_reviews row.
  //
  // Unlike on_time_rate/revision_rate, this is NOT done as an O(1)
  // incremental update: freelancer_quality_scores has no ratings-count
  // column, and deliveries_count isn't the right denominator (it increments
  // once per stage review cycle, not once per completed project, so reusing
  // it here would silently under-weight the average). Recomputing straight
  // from project_reviews is a few extra reads but is unambiguously correct
  // and self-heals if a review is ever added or corrected out of band.
  async recomputeClientRatingAverage(freelancerUserId: string): Promise<void> {
    const supabase = createAdminClient();

    const { data: profile, error: profileError } = await supabase
      .from("freelancer_profiles")
      .select("id")
      .eq("user_id", freelancerUserId)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return;

    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id")
      .eq("freelancer_id", freelancerUserId);
    if (projectsError) throw projectsError;

    const projectIds = (projects ?? []).map((p) => p.id);
    if (projectIds.length === 0) return;

    const { data: reviews, error: reviewsError } = await supabase
      .from("project_reviews")
      .select("rating")
      .eq("reviewer_role", "client")
      .in("project_id", projectIds)
      .not("rating", "is", null);
    if (reviewsError) throw reviewsError;

    const ratings = (reviews ?? []).map((r) => r.rating as number);
    const average = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

    const { error: upsertError } = await supabase
      .from("freelancer_quality_scores")
      .upsert(
        { freelancer_id: profile.id, client_rating_avg: average, last_updated: new Date().toISOString() },
        { onConflict: "freelancer_id" }
      );
    if (upsertError) throw upsertError;
  }

  // Stubbed. Its only future job is the cross-boundary write to the
  // portal's real, remote table -- our own local mirror write already
  // happened via recordDeliveryOutcome above, so this stays a genuine
  // no-op until that integration exists, not an unfinished placeholder.
  //
  // PORTAL INTEGRATION: once the real portal exists, this reports the same
  // event to it, e.g.
  //   await portalApi.post(`/freelancers/${freelancerId}/delivery-events`, {
  //     on_time: event.onTime,
  //     revision_count: event.revisionCount,
  //     stage: event.stage,
  //   });
  // which the portal then uses to recompute its own quality scores.
  async sendDeliveryEvent(
    freelancerId: string,
    event: PortalDeliveryEvent
  ): Promise<void> {
    void freelancerId;
    void event;
  }
}

export const portalClient = new PortalClient();
