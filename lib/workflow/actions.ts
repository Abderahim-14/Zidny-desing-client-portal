import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { portalClient } from "@/lib/portal/PortalClient";
import {
  WorkflowError,
  assertCanApproveStage,
  assertCanMarkMeetingHeld,
  assertCanScheduleMeeting,
  assertCanSendBackStage,
  assertCanSetStageDeliverables,
  assertCanSkipMeeting,
  assertCanSubmitStage,
  assertCanUploadDeliverable,
  nextStageNumber,
  wasSubmittedOnTime,
  type ActorRole,
  type DeliverableStatus,
  type MeetingStatus,
  type StageStatus,
  type WorkflowActionType,
} from "@/lib/workflow/transitions";

// Backend enforcement point for the state machine (CLAUDE.md #3: "Enforce
// it in the backend, never UI-only"). Every function here re-derives the
// caller's role from the DB rather than trusting a role passed in, and
// re-checks the legal-transition rules from lib/workflow/transitions.ts
// before writing anything -- callers (server actions resolving the
// Supabase session via lib/auth/current-actor.ts) only need to pass the
// acting user's id.
//
// Admin stand-in (build prompt "Feature 1"): admin is a permission superset
// of the assigned freelancer for uploadDeliverable/submitStage -- every
// existing assertion (all deliverables uploaded to submit, meeting held to
// approve/send-back, etc.) still applies unchanged; this only widens *who*
// may call the freelancer-shaped actions, never *what* is legal. Every
// action below logs to workflow_actions_log so "freelancer did this" vs
// "admin did this on the freelancer's behalf" is never lost.
//
// Notifications: created inline in the same code path as each mutation
// (not a DB trigger) so a single function is the source of truth for both
// the audit log and who gets notified. Matrix: upload -> admin + client;
// submit -> admin; approve -> freelancer + client; rework -> freelancer.

type NotificationType = "upload" | "submit" | "approve" | "rework" | "deliverables_defined";

async function getActorRole(
  supabase: ReturnType<typeof createAdminClient>,
  actorUserId: string
): Promise<ActorRole> {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", actorUserId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new WorkflowError("Actor not found.");
  return data.role as ActorRole;
}

async function logAction(
  supabase: ReturnType<typeof createAdminClient>,
  params: {
    projectId: string;
    stageId?: string | null;
    deliverableId?: string | null;
    action: WorkflowActionType;
    actedBy: string;
    actedAsRole: ActorRole;
    onBehalfOf?: string | null;
    detail?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await supabase.from("workflow_actions_log").insert({
    project_id: params.projectId,
    stage_id: params.stageId ?? null,
    deliverable_id: params.deliverableId ?? null,
    action: params.action,
    acted_by: params.actedBy,
    acted_as_role: params.actedAsRole,
    on_behalf_of: params.onBehalfOf ?? null,
    detail: params.detail ?? {},
  });
  if (error) throw error;
}

async function getAdminUserIds(supabase: ReturnType<typeof createAdminClient>): Promise<string[]> {
  const { data, error } = await supabase.from("users").select("id").eq("role", "admin");
  if (error) throw error;
  return (data ?? []).map((u) => u.id);
}

async function notifyMany(
  supabase: ReturnType<typeof createAdminClient>,
  recipientIds: (string | null | undefined)[],
  params: { type: NotificationType; projectId: string; stageId?: string | null; message: string }
): Promise<void> {
  const uniqueIds = Array.from(new Set(recipientIds.filter((id): id is string => Boolean(id))));
  if (uniqueIds.length === 0) return;

  const { error } = await supabase.from("notifications").insert(
    uniqueIds.map((recipientId) => ({
      recipient_id: recipientId,
      type: params.type,
      project_id: params.projectId,
      stage_id: params.stageId ?? null,
      message: params.message,
    }))
  );
  if (error) throw error;
}

interface StageWithProject {
  id: string;
  project_id: string;
  stage_number: number;
  status: StageStatus;
  deadline: string | null;
  submitted_at: string | null;
  meeting_id: string | null;
  projects: { freelancer_id: string | null; client_id: string } | null;
}

async function loadStageWithProject(
  supabase: ReturnType<typeof createAdminClient>,
  stageId: string
): Promise<StageWithProject> {
  const { data, error } = await supabase
    .from("stages")
    .select(
      "id, project_id, stage_number, status, deadline, submitted_at, meeting_id, projects(freelancer_id, client_id)"
    )
    .eq("id", stageId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new WorkflowError("Stage not found.");
  return data as unknown as StageWithProject;
}

async function loadMeetingStatus(
  supabase: ReturnType<typeof createAdminClient>,
  meetingId: string | null
): Promise<MeetingStatus | null> {
  if (!meetingId) return null;
  const { data, error } = await supabase
    .from("meetings")
    .select("status")
    .eq("id", meetingId)
    .maybeSingle();
  if (error) throw error;
  return (data?.status as MeetingStatus) ?? null;
}

export async function uploadDeliverable(
  actorUserId: string,
  deliverableId: string,
  file: { fileUrl?: string | null; linkUrl?: string | null }
): Promise<void> {
  const supabase = createAdminClient();
  const role = await getActorRole(supabase, actorUserId);

  const { data: deliverable, error } = await supabase
    .from("deliverables")
    .select("id, name, stage_id, stages(stage_number, status, project_id, projects(freelancer_id, client_id))")
    .eq("id", deliverableId)
    .maybeSingle();
  if (error) throw error;
  if (!deliverable) throw new WorkflowError("Deliverable not found.");

  const stage = (
    deliverable as unknown as {
      stages: {
        stage_number: number;
        status: StageStatus;
        project_id: string;
        projects: { freelancer_id: string | null; client_id: string } | null;
      };
    }
  ).stages;

  const assignedFreelancerId = stage.projects?.freelancer_id ?? null;
  const isAssignedFreelancer = role === "freelancer" && assignedFreelancerId === actorUserId;
  const isAdminStandIn = role === "admin";
  if (!isAssignedFreelancer && !isAdminStandIn) {
    throw new WorkflowError("Only the assigned freelancer or an admin can upload this deliverable.");
  }

  assertCanUploadDeliverable({ stageStatus: stage.status, stageNumber: stage.stage_number });

  const { error: updateError } = await supabase
    .from("deliverables")
    .update({
      file_url: file.fileUrl ?? null,
      link_url: file.linkUrl ?? null,
      status: "uploaded",
      rework_note: null,
    })
    .eq("id", deliverableId);
  if (updateError) throw updateError;

  await logAction(supabase, {
    projectId: stage.project_id,
    stageId: deliverable.stage_id,
    deliverableId,
    action: "upload_deliverable",
    actedBy: actorUserId,
    actedAsRole: role,
    onBehalfOf: isAdminStandIn ? assignedFreelancerId : null,
  });

  const adminIds = await getAdminUserIds(supabase);
  await notifyMany(supabase, [...adminIds, stage.projects?.client_id], {
    type: "upload",
    projectId: stage.project_id,
    stageId: deliverable.stage_id,
    message: `"${deliverable.name}" was uploaded on stage ${stage.stage_number}.`,
  });
}

export async function submitStage(actorUserId: string, stageId: string): Promise<void> {
  const supabase = createAdminClient();
  const role = await getActorRole(supabase, actorUserId);
  const stage = await loadStageWithProject(supabase, stageId);

  const assignedFreelancerId = stage.projects?.freelancer_id ?? null;
  const isAssignedFreelancer = role === "freelancer" && assignedFreelancerId === actorUserId;
  const isAdminStandIn = role === "admin";
  if (!isAssignedFreelancer && !isAdminStandIn) {
    throw new WorkflowError("Only the assigned freelancer or an admin can submit this stage.");
  }

  const { data: deliverables, error: delivError } = await supabase
    .from("deliverables")
    .select("status")
    .eq("stage_id", stageId);
  if (delivError) throw delivError;

  assertCanSubmitStage({
    actorRole: role,
    stageStatus: stage.status,
    stageNumber: stage.stage_number,
    deliverableStatuses: (deliverables ?? []).map((d) => d.status as DeliverableStatus),
  });

  const now = new Date().toISOString();

  const { error: updateDeliverablesError } = await supabase
    .from("deliverables")
    .update({ status: "awaiting_review" })
    .eq("stage_id", stageId)
    .eq("status", "uploaded");
  if (updateDeliverablesError) throw updateDeliverablesError;

  const { error: updateStageError } = await supabase
    .from("stages")
    .update({ status: "submitted", submitted_at: now })
    .eq("id", stageId);
  if (updateStageError) throw updateStageError;

  await logAction(supabase, {
    projectId: stage.project_id,
    stageId,
    action: "submit_stage",
    actedBy: actorUserId,
    actedAsRole: role,
    onBehalfOf: isAdminStandIn ? assignedFreelancerId : null,
  });

  const adminIds = await getAdminUserIds(supabase);
  await notifyMany(supabase, adminIds, {
    type: "submit",
    projectId: stage.project_id,
    stageId,
    message: `Stage ${stage.stage_number} was submitted for review.`,
  });
}

export async function scheduleMeeting(
  actorUserId: string,
  stageId: string,
  scheduledAt: string
): Promise<void> {
  const supabase = createAdminClient();
  const role = await getActorRole(supabase, actorUserId);
  const stage = await loadStageWithProject(supabase, stageId);

  assertCanScheduleMeeting({ actorRole: role, stageStatus: stage.status });

  let meetingId = stage.meeting_id;
  let openNewMeeting = !meetingId;

  if (meetingId) {
    const { data: prevMeeting, error: prevError } = await supabase
      .from("meetings")
      .select("outcome")
      .eq("id", meetingId)
      .maybeSingle();
    if (prevError) throw prevError;
    // A previous cycle already concluded (has an outcome) -- this is a new
    // review cycle after a sent_back, so open a fresh meeting row instead
    // of overwriting history.
    openNewMeeting = Boolean(prevMeeting?.outcome);
  }

  if (openNewMeeting) {
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .insert({ stage_id: stageId, status: "scheduled", scheduled_at: scheduledAt })
      .select("id")
      .single();
    if (meetingError) throw meetingError;
    meetingId = meeting.id;
  } else if (meetingId) {
    const { error: rescheduleError } = await supabase
      .from("meetings")
      .update({ status: "scheduled", scheduled_at: scheduledAt })
      .eq("id", meetingId);
    if (rescheduleError) throw rescheduleError;
  }

  const { error: linkError } = await supabase
    .from("stages")
    .update({ meeting_id: meetingId, status: "in_review" })
    .eq("id", stageId);
  if (linkError) throw linkError;

  await logAction(supabase, {
    projectId: stage.project_id,
    stageId,
    action: "schedule_meeting",
    actedBy: actorUserId,
    actedAsRole: role,
    detail: { scheduledAt },
  });
}

export async function markMeetingHeld(actorUserId: string, stageId: string): Promise<void> {
  const supabase = createAdminClient();
  const role = await getActorRole(supabase, actorUserId);
  const stage = await loadStageWithProject(supabase, stageId);

  if (role !== "admin") {
    throw new WorkflowError("Only an admin can mark a meeting as held.");
  }
  if (!stage.meeting_id) {
    throw new WorkflowError("Stage has no scheduled meeting yet.");
  }

  const meetingStatus = await loadMeetingStatus(supabase, stage.meeting_id);
  assertCanMarkMeetingHeld({ actorRole: role, meetingStatus: meetingStatus ?? "not_scheduled" });

  const { error: updateError } = await supabase
    .from("meetings")
    .update({ status: "held", held_at: new Date().toISOString() })
    .eq("id", stage.meeting_id);
  if (updateError) throw updateError;

  await logAction(supabase, {
    projectId: stage.project_id,
    stageId,
    action: "mark_meeting_held",
    actedBy: actorUserId,
    actedAsRole: role,
  });
}

// Deliberate, logged bypass of the meeting-held gate -- not its removal.
// approve/send-back still refuse to run unless meetingGateSatisfied()
// (held OR skipped) in transitions.ts; this is the only way to reach
// 'skipped', and it always leaves skipped_at/skipped_by + a
// workflow_actions_log row distinguishing it from a genuinely held meeting.
export async function skipMeeting(actorUserId: string, stageId: string): Promise<void> {
  const supabase = createAdminClient();
  const role = await getActorRole(supabase, actorUserId);
  const stage = await loadStageWithProject(supabase, stageId);

  assertCanSkipMeeting({ actorRole: role, stageStatus: stage.status });

  const now = new Date().toISOString();
  let meetingId = stage.meeting_id;
  let openNewMeeting = !meetingId;

  if (meetingId) {
    const { data: prevMeeting, error: prevError } = await supabase
      .from("meetings")
      .select("outcome")
      .eq("id", meetingId)
      .maybeSingle();
    if (prevError) throw prevError;
    openNewMeeting = Boolean(prevMeeting?.outcome);
  }

  if (openNewMeeting) {
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .insert({ stage_id: stageId, status: "skipped", skipped_at: now, skipped_by: actorUserId })
      .select("id")
      .single();
    if (meetingError) throw meetingError;
    meetingId = meeting.id;
  } else if (meetingId) {
    const { error: updateError } = await supabase
      .from("meetings")
      .update({ status: "skipped", skipped_at: now, skipped_by: actorUserId })
      .eq("id", meetingId);
    if (updateError) throw updateError;
  }

  const { error: linkError } = await supabase
    .from("stages")
    .update({ meeting_id: meetingId, status: "in_review" })
    .eq("id", stageId);
  if (linkError) throw linkError;

  await logAction(supabase, {
    projectId: stage.project_id,
    stageId,
    action: "skip_meeting",
    actedBy: actorUserId,
    actedAsRole: role,
  });
}

export async function approveStage(actorUserId: string, stageId: string): Promise<void> {
  const supabase = createAdminClient();
  const role = await getActorRole(supabase, actorUserId);
  const stage = await loadStageWithProject(supabase, stageId);
  const meetingStatus = await loadMeetingStatus(supabase, stage.meeting_id);

  assertCanApproveStage({
    actorRole: role,
    stageStatus: stage.status,
    meetingStatus,
    stageNumber: stage.stage_number,
  });

  const now = new Date().toISOString();

  const { error: deliverablesError } = await supabase
    .from("deliverables")
    .update({ status: "approved" })
    .eq("stage_id", stageId)
    .eq("status", "awaiting_review");
  if (deliverablesError) throw deliverablesError;

  const { error: stageError } = await supabase
    .from("stages")
    .update({ status: "approved", approved_at: now })
    .eq("id", stageId);
  if (stageError) throw stageError;

  if (stage.meeting_id) {
    const { error: meetingError } = await supabase
      .from("meetings")
      .update({ outcome: "approved" })
      .eq("id", stage.meeting_id);
    if (meetingError) throw meetingError;
  }

  const next = nextStageNumber(stage.stage_number);
  if (next) {
    const { error: unlockError } = await supabase
      .from("stages")
      .update({ status: "in_progress" })
      .eq("project_id", stage.project_id)
      .eq("stage_number", next)
      .eq("status", "locked");
    if (unlockError) throw unlockError;

    const { error: projectError } = await supabase
      .from("projects")
      .update({ current_stage: next })
      .eq("id", stage.project_id);
    if (projectError) throw projectError;
  } else {
    const { error: projectError } = await supabase
      .from("projects")
      .update({ status: "completed" })
      .eq("id", stage.project_id);
    if (projectError) throw projectError;
  }

  if (stage.projects?.freelancer_id) {
    await portalClient.recordDeliveryOutcome(stage.projects.freelancer_id, {
      onTime: wasSubmittedOnTime(stage.deadline, stage.submitted_at),
      revisionCount: 0,
      stage: stage.stage_number,
    });
  }

  await logAction(supabase, {
    projectId: stage.project_id,
    stageId,
    action: "approve_stage",
    actedBy: actorUserId,
    actedAsRole: role,
    detail: { unlockedStage: next },
  });

  await notifyMany(supabase, [stage.projects?.freelancer_id, stage.projects?.client_id], {
    type: "approve",
    projectId: stage.project_id,
    stageId,
    message: `Stage ${stage.stage_number} was approved.`,
  });
}

export async function sendBackStage(
  actorUserId: string,
  stageId: string,
  flagged: { deliverableId: string; note: string }[]
): Promise<void> {
  const supabase = createAdminClient();
  const role = await getActorRole(supabase, actorUserId);
  const stage = await loadStageWithProject(supabase, stageId);
  const meetingStatus = await loadMeetingStatus(supabase, stage.meeting_id);

  assertCanSendBackStage({
    actorRole: role,
    stageStatus: stage.status,
    meetingStatus,
    stageNumber: stage.stage_number,
    flaggedDeliverableIds: flagged.map((f) => f.deliverableId),
  });

  for (const flag of flagged) {
    const { error: flagError } = await supabase
      .from("deliverables")
      .update({ status: "needs_rework", rework_note: flag.note })
      .eq("id", flag.deliverableId)
      .eq("stage_id", stageId);
    if (flagError) throw flagError;
  }

  // Unflagged deliverables that were locked in at submit time go back to
  // 'uploaded' so the freelancer can resubmit the stage as a whole once the
  // flagged items are fixed.
  const { data: stageDeliverables, error: stageDeliverablesError } = await supabase
    .from("deliverables")
    .select("id, status")
    .eq("stage_id", stageId);
  if (stageDeliverablesError) throw stageDeliverablesError;

  const flaggedIds = new Set(flagged.map((f) => f.deliverableId));
  const revertIds = (stageDeliverables ?? [])
    .filter((d) => d.status === "awaiting_review" && !flaggedIds.has(d.id))
    .map((d) => d.id);

  if (revertIds.length > 0) {
    const { error: revertError } = await supabase
      .from("deliverables")
      .update({ status: "uploaded" })
      .in("id", revertIds);
    if (revertError) throw revertError;
  }

  const { error: stageError } = await supabase
    .from("stages")
    .update({ status: "in_progress", submitted_at: null })
    .eq("id", stageId);
  if (stageError) throw stageError;

  if (stage.meeting_id) {
    const { error: meetingError } = await supabase
      .from("meetings")
      .update({ outcome: "sent_back" })
      .eq("id", stage.meeting_id);
    if (meetingError) throw meetingError;
  }

  if (stage.projects?.freelancer_id) {
    await portalClient.recordDeliveryOutcome(stage.projects.freelancer_id, {
      onTime: wasSubmittedOnTime(stage.deadline, stage.submitted_at),
      revisionCount: flagged.length,
      stage: stage.stage_number,
    });
  }

  await logAction(supabase, {
    projectId: stage.project_id,
    stageId,
    action: "send_back_stage",
    actedBy: actorUserId,
    actedAsRole: role,
    detail: { flaggedDeliverableIds: Array.from(flaggedIds) },
  });

  await notifyMany(supabase, [stage.projects?.freelancer_id], {
    type: "rework",
    projectId: stage.project_id,
    stageId,
    message: `Stage ${stage.stage_number} was sent back for rework.`,
  });
}

export async function setStageDeadline(
  actorUserId: string,
  stageId: string,
  deadline: string
): Promise<void> {
  const supabase = createAdminClient();
  const role = await getActorRole(supabase, actorUserId);
  if (role !== "admin") {
    throw new WorkflowError("Only an admin can set a stage deadline.");
  }

  const stage = await loadStageWithProject(supabase, stageId);
  if (stage.status === "locked" || stage.status === "approved") {
    throw new WorkflowError(`Cannot set a deadline on a stage that is '${stage.status}'.`);
  }

  const { error } = await supabase.from("stages").update({ deadline }).eq("id", stageId);
  if (error) throw error;

  await logAction(supabase, {
    projectId: stage.project_id,
    stageId,
    action: "set_stage_deadline",
    actedBy: actorUserId,
    actedAsRole: role,
    detail: { deadline },
  });
}

// Fills the gap the build prompt calls out: nothing previously defined
// WHAT a stage requires, so "submit requires all deliverables uploaded"
// had no real meaning for a stage with zero deliverables rows.
// setStageDeliverables() is how the admin's template picker turns a chosen
// set of items into real deliverables rows for one stage -- reconciled by
// name against whatever already exists: new names are inserted (status
// 'pending', carrying the template's description per migration 0009 so the
// freelancer sees the same context the admin picked from), names no longer
// present are deleted, and names that already exist are left untouched (so
// an already-uploaded file/status isn't clobbered just because the admin
// re-saved the same picker selection).
export async function setStageDeliverables(
  actorUserId: string,
  stageId: string,
  items: { name: string; description?: string | null }[]
): Promise<void> {
  const supabase = createAdminClient();
  const role = await getActorRole(supabase, actorUserId);
  const stage = await loadStageWithProject(supabase, stageId);

  const seen = new Set<string>();
  const uniqueItems = items
    .map((item) => ({ name: item.name.trim(), description: item.description?.trim() || null }))
    .filter((item) => {
      if (!item.name || seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    });
  const uniqueNames = uniqueItems.map((item) => item.name);

  assertCanSetStageDeliverables({
    actorRole: role,
    stageStatus: stage.status,
    stageNumber: stage.stage_number,
    names: uniqueNames,
  });

  const { data: existing, error: existingError } = await supabase
    .from("deliverables")
    .select("id, name")
    .eq("stage_id", stageId);
  if (existingError) throw existingError;

  const existingNames = new Set((existing ?? []).map((d) => d.name));
  const toDeleteIds = (existing ?? []).filter((d) => !uniqueNames.includes(d.name)).map((d) => d.id);
  const toInsert = uniqueItems.filter((item) => !existingNames.has(item.name));

  if (toDeleteIds.length > 0) {
    const { error } = await supabase.from("deliverables").delete().in("id", toDeleteIds);
    if (error) throw error;
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("deliverables").insert(
      toInsert.map((item) => ({
        stage_id: stageId,
        name: item.name,
        description: item.description,
        type: "deliverable",
        status: "pending",
      }))
    );
    if (error) throw error;
  }

  await logAction(supabase, {
    projectId: stage.project_id,
    stageId,
    action: "set_stage_deliverables",
    actedBy: actorUserId,
    actedAsRole: role,
    detail: { names: uniqueNames },
  });

  if (stage.projects?.freelancer_id) {
    await notifyMany(supabase, [stage.projects.freelancer_id], {
      type: "deliverables_defined",
      projectId: stage.project_id,
      stageId,
      message: `Required deliverables were set for stage ${stage.stage_number} -- you can start uploading.`,
    });
  }
}
