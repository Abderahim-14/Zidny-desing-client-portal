"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/current-actor";
import { upsertAdminReview } from "@/lib/workflow/reviews";

export async function upsertAdminReviewAction(
  projectId: string,
  rating: number | null,
  feedback: string | null
): Promise<void> {
  const actor = await requireAdmin();
  await upsertAdminReview(actor.userId, projectId, { rating, feedback });
  revalidatePath(`/admin/projects/${projectId}`);
}
