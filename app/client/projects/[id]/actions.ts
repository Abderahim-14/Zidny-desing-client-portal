"use server";

import { revalidatePath } from "next/cache";
import { requireClient } from "@/lib/auth/current-actor";
import { submitClientReview } from "@/lib/workflow/reviews";

export async function submitClientReviewAction(
  projectId: string,
  rating: number,
  feedback: string | null
): Promise<void> {
  const actor = await requireClient();
  await submitClientReview(actor.userId, projectId, { rating, feedback });
  revalidatePath(`/client/projects/${projectId}`);
}
