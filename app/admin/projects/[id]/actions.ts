"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/current-actor";
import * as workflow from "@/lib/workflow/actions";

// Every action below starts by resolving and verifying the actor from the
// session (requireAdmin) before calling into lib/workflow/actions.ts --
// no workflow mutation here ever runs with an unverified or client-supplied
// actor id.

export async function scheduleMeetingAction(
  projectId: string,
  stageId: string,
  scheduledAt: string
): Promise<void> {
  const actor = await requireAdmin();
  await workflow.scheduleMeeting(actor.userId, stageId, scheduledAt);
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function markMeetingHeldAction(projectId: string, stageId: string): Promise<void> {
  const actor = await requireAdmin();
  await workflow.markMeetingHeld(actor.userId, stageId);
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function approveStageAction(projectId: string, stageId: string): Promise<void> {
  const actor = await requireAdmin();
  await workflow.approveStage(actor.userId, stageId);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin");
}

export async function sendBackStageAction(
  projectId: string,
  stageId: string,
  flagged: { deliverableId: string; note: string }[]
): Promise<void> {
  const actor = await requireAdmin();
  await workflow.sendBackStage(actor.userId, stageId, flagged);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin");
}

export async function setStageDeadlineAction(
  projectId: string,
  stageId: string,
  deadline: string
): Promise<void> {
  const actor = await requireAdmin();
  await workflow.setStageDeadline(actor.userId, stageId, deadline);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin");
}

// Admin stand-in (build prompt "Feature 1"): the assigned freelancer's own
// actions, callable by an admin too. Same lib/workflow/actions.ts functions
// the freelancer view will call later -- the widened role check and the
// workflow_actions_log audit row (acted_as_role / on_behalf_of) both live
// there, not here.

export async function uploadDeliverableAction(
  projectId: string,
  deliverableId: string,
  fileUrl: string
): Promise<void> {
  const actor = await requireAdmin();
  await workflow.uploadDeliverable(actor.userId, deliverableId, { fileUrl });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function submitStageAction(projectId: string, stageId: string): Promise<void> {
  const actor = await requireAdmin();
  await workflow.submitStage(actor.userId, stageId);
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function setStageDeliverablesAction(
  projectId: string,
  stageId: string,
  items: { name: string; description?: string | null }[]
): Promise<void> {
  const actor = await requireAdmin();
  await workflow.setStageDeliverables(actor.userId, stageId, items);
  revalidatePath(`/admin/projects/${projectId}`);
}
