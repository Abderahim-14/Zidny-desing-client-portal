"use server";

import { revalidatePath } from "next/cache";
import { requireFreelancer } from "@/lib/auth/current-actor";
import * as workflow from "@/lib/workflow/actions";

// Same lib/workflow/actions.ts functions the admin stand-in calls --
// requireFreelancer() resolves and verifies the real session actor before
// either ever runs, and the workflow functions themselves re-check that
// this actor is the project's assigned freelancer.

export async function uploadDeliverableAction(
  projectId: string,
  deliverableId: string,
  fileUrl: string
): Promise<void> {
  const actor = await requireFreelancer();
  await workflow.uploadDeliverable(actor.userId, deliverableId, { fileUrl });
  revalidatePath(`/freelancer/projects/${projectId}`);
}

export async function submitStageAction(projectId: string, stageId: string): Promise<void> {
  const actor = await requireFreelancer();
  await workflow.submitStage(actor.userId, stageId);
  revalidatePath(`/freelancer/projects/${projectId}`);
}
