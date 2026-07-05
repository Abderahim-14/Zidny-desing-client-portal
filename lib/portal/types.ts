// Shapes returned by lib/portal/PortalClient.ts. These mirror the portal's
// conventions (UUID ids, portal enum values verbatim) per CLAUDE.md -- when
// PortalClient's methods start hitting the real portal instead of the local
// mirror, these types should not need to change.

export type UserRole = "client" | "freelancer" | "admin";
export type VettingStatus = "pending" | "approved" | "rejected";
export type Availability = "full" | "part" | "weekend";
export type PayoutMethod = "baridi" | "bank";

export type ProjectTrack = "brand" | "uiux" | "campaign";
export type PackageTier = "starter" | "premium" | "everything" | "rush";

export interface PortalFreelancer {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  headline: string | null;
  bio: string | null;
  wilaya: string | null;
  avatarUrl: string | null;
  skills: { skill: string; level: string }[];
  dailyRate: number | null;
  availability: Availability | null;
  preferredPayout: PayoutMethod;
  vettingStatus: VettingStatus;
  internalScore: number;
}

// Internal-only (see freelancer_quality_scores RLS + migration 0002).
// getFreelancerQuality() is for admin call sites; the freelancer's own
// on-time slice is served separately, not through this shape.
export interface PortalFreelancerQuality {
  freelancerUserId: string;
  score: number;
  deliveriesCount: number;
  onTimeRate: number;
  revisionRate: number;
  clientRatingAvg: number;
  lastUpdated: string;
}

export interface PortalClientProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  companyType: string | null;
  sector: string | null;
  wilaya: string | null;
  preferredServices: string[];
  budgetRangeMin: number | null;
  budgetRangeMax: number | null;
  onboardingCompleted: boolean;
}

export interface PortalProjectHandoffPayload {
  clientId: string;
  freelancerId?: string | null;
  track: ProjectTrack;
  packageTier: PackageTier;
  // Frozen onboarding snapshot from Stages 1-2; stored verbatim on
  // projects.portal_payload for the read-only portal-context block.
  onboardingSnapshot: Record<string, unknown>;
}

export interface PortalProjectHandoffResult {
  projectId: string;
  stageIds: Record<number, string>;
}

// Shared by recordDeliveryOutcome (local mirror write) and sendDeliveryEvent
// (future cross-boundary write to the real portal) -- same event, two
// destinations.
export interface PortalDeliveryEvent {
  onTime: boolean;
  revisionCount: number;
  stage: number;
}
