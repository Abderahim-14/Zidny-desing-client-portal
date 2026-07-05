// The stage state machine (CLAUDE.md #3) -- pure rule engine, no I/O.
//
//   locked -> in_progress -> submitted -> in_review -> approved | sent_back
//
// Hard rules enforced here:
//   - A freelancer can never advance a stage; only an admin approves.
//   - approve / send_back are legal only when the stage's meeting is held
//     OR the admin has explicitly, auditably skipped it (skipMeeting()) --
//     the gate itself is never removed, only satisfied a second way.
//   - send_back returns the stage to in_progress on the SAME stage.
//   - Stages 1-2 are always locked and read-only.
//   - No late fees anywhere -- on-time/late is a metric only.
//
// lib/workflow/actions.ts is the thin Supabase-backed layer that fetches
// state, calls these assertions, and performs the writes. Keeping the
// rules here as pure functions makes them directly unit-testable.

export type StageStatus =
  | "locked"
  | "in_progress"
  | "submitted"
  | "in_review"
  | "approved"
  | "sent_back";

export type DeliverableStatus =
  | "pending"
  | "uploaded"
  | "awaiting_review"
  | "approved"
  | "needs_rework";

export type MeetingStatus = "not_scheduled" | "scheduled" | "held" | "skipped";

export type ActorRole = "admin" | "freelancer" | "client";

// Mirrors the workflow_action_type Postgres enum (migrations 0004, 0007,
// 0008) -- every workflow action writes one workflow_actions_log row under
// this action name.
export type WorkflowActionType =
  | "upload_deliverable"
  | "submit_stage"
  | "schedule_meeting"
  | "mark_meeting_held"
  | "approve_stage"
  | "send_back_stage"
  | "set_stage_deadline"
  | "skip_meeting"
  | "set_stage_deliverables";

// held or skipped both satisfy the "meeting gate" -- skipped is a distinct,
// logged, admin-only bypass, never a default/silent state.
function meetingGateSatisfied(meetingStatus: MeetingStatus | null): boolean {
  return meetingStatus === "held" || meetingStatus === "skipped";
}

export class WorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowError";
  }
}

function assertNotPortalStage(stageNumber: number): void {
  if (stageNumber <= 2) {
    throw new WorkflowError(
      "Stages 1-2 are portal context and are always locked/read-only."
    );
  }
}

// Defining/editing a stage's required deliverables is allowed while the
// admin can still shape the checklist -- before the stage is even active
// (locked, e.g. setting deliverables up-front at project creation) or
// while the freelancer is still working (in_progress). Once submitted, the
// checklist is locked in along with the deliverables themselves.
export function assertCanSetStageDeliverables(params: {
  actorRole: ActorRole;
  stageStatus: StageStatus;
  stageNumber: number;
  names: string[];
}): void {
  if (params.actorRole !== "admin") {
    throw new WorkflowError("Only an admin can define a stage's required deliverables.");
  }
  assertNotPortalStage(params.stageNumber);
  if (params.stageStatus !== "locked" && params.stageStatus !== "in_progress") {
    throw new WorkflowError(
      `Cannot change required deliverables for a stage that is '${params.stageStatus}'.`
    );
  }
  if (params.names.length === 0) {
    throw new WorkflowError("A stage needs at least one required deliverable.");
  }
}

export function assertCanUploadDeliverable(params: {
  stageStatus: StageStatus;
  stageNumber: number;
}): void {
  assertNotPortalStage(params.stageNumber);
  if (params.stageStatus !== "in_progress") {
    throw new WorkflowError(
      `Cannot upload a deliverable while the stage is '${params.stageStatus}'.`
    );
  }
}

export function assertCanSubmitStage(params: {
  actorRole: ActorRole;
  stageStatus: StageStatus;
  stageNumber: number;
  deliverableStatuses: DeliverableStatus[];
}): void {
  // Admin is a permission superset of the assigned freelancer here (stand-in
  // for freelancer actions) -- a widening, not a rule bypass: every check
  // below still applies identically regardless of which of the two it is.
  // actions.ts additionally restricts the freelancer branch to the actual
  // assigned freelancer; that assignment check has no meaning for admin.
  if (params.actorRole !== "freelancer" && params.actorRole !== "admin") {
    throw new WorkflowError("Only the assigned freelancer or an admin can submit a stage.");
  }
  assertNotPortalStage(params.stageNumber);
  if (params.stageStatus !== "in_progress") {
    throw new WorkflowError(`Cannot submit a stage that is '${params.stageStatus}'.`);
  }
  if (params.deliverableStatuses.length === 0) {
    throw new WorkflowError("Stage has no deliverables to submit.");
  }
  if (params.deliverableStatuses.some((s) => s !== "uploaded")) {
    throw new WorkflowError(
      "All deliverables must be uploaded before the stage can be submitted."
    );
  }
}

export function assertCanScheduleMeeting(params: {
  actorRole: ActorRole;
  stageStatus: StageStatus;
}): void {
  if (params.actorRole !== "admin") {
    throw new WorkflowError("Only an admin can schedule a review meeting.");
  }
  if (params.stageStatus !== "submitted" && params.stageStatus !== "in_review") {
    throw new WorkflowError(
      `Cannot schedule a meeting for a stage that is '${params.stageStatus}'.`
    );
  }
}

export function assertCanMarkMeetingHeld(params: {
  actorRole: ActorRole;
  meetingStatus: MeetingStatus;
}): void {
  if (params.actorRole !== "admin") {
    throw new WorkflowError("Only an admin can mark a meeting as held.");
  }
  if (params.meetingStatus !== "scheduled") {
    throw new WorkflowError(
      `Cannot mark a meeting held from status '${params.meetingStatus}'.`
    );
  }
}

export function assertCanSkipMeeting(params: {
  actorRole: ActorRole;
  stageStatus: StageStatus;
}): void {
  if (params.actorRole !== "admin") {
    throw new WorkflowError("Only an admin can skip the validation meeting.");
  }
  if (params.stageStatus !== "submitted" && params.stageStatus !== "in_review") {
    throw new WorkflowError(
      `Cannot skip a meeting for a stage that is '${params.stageStatus}'.`
    );
  }
}

export function assertCanApproveStage(params: {
  actorRole: ActorRole;
  stageStatus: StageStatus;
  meetingStatus: MeetingStatus | null;
  stageNumber: number;
}): void {
  if (params.actorRole !== "admin") {
    throw new WorkflowError(
      "Only an admin can approve a stage. A freelancer can never advance a stage."
    );
  }
  assertNotPortalStage(params.stageNumber);
  if (params.stageStatus !== "in_review") {
    throw new WorkflowError(`Cannot approve a stage that is '${params.stageStatus}'.`);
  }
  if (!meetingGateSatisfied(params.meetingStatus)) {
    throw new WorkflowError(
      "Approve is only legal once the stage's meeting has been held or explicitly skipped."
    );
  }
}

export function assertCanSendBackStage(params: {
  actorRole: ActorRole;
  stageStatus: StageStatus;
  meetingStatus: MeetingStatus | null;
  stageNumber: number;
  flaggedDeliverableIds: string[];
}): void {
  if (params.actorRole !== "admin") {
    throw new WorkflowError(
      "Only an admin can send a stage back. A freelancer can never advance a stage."
    );
  }
  assertNotPortalStage(params.stageNumber);
  if (params.stageStatus !== "in_review") {
    throw new WorkflowError(`Cannot send back a stage that is '${params.stageStatus}'.`);
  }
  if (!meetingGateSatisfied(params.meetingStatus)) {
    throw new WorkflowError(
      "Send-back is only legal once the stage's meeting has been held or explicitly skipped."
    );
  }
  if (params.flaggedDeliverableIds.length === 0) {
    throw new WorkflowError("Send-back requires at least one flagged deliverable.");
  }
}

// On-time is a metric only (feeds quality scores) -- never a fee/charge.
export function wasSubmittedOnTime(
  deadline: string | null,
  submittedAt: string | null
): boolean {
  if (!deadline || !submittedAt) return true;
  const deadlineEndOfDay = new Date(`${deadline}T23:59:59`);
  return new Date(submittedAt).getTime() <= deadlineEndOfDay.getTime();
}

export function nextStageNumber(current: number): number | null {
  return current < 5 ? current + 1 : null;
}
