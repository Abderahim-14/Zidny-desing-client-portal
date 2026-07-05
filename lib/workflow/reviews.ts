import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { portalClient } from "@/lib/portal/PortalClient";
import { WorkflowError } from "@/lib/workflow/transitions";

// Post-completion reviews (build prompt "Feature 3"). Reviews only exist
// once a project is completed -- enforced here (backend, not UI-only) in
// addition to the project_reviews RLS policies (migration 0003), same
// belt-and-suspenders pattern as the stage state machine.

export async function submitClientReview(
  actorUserId: string,
  projectId: string,
  input: { rating: number; feedback: string | null }
): Promise<void> {
  if (input.rating < 1 || input.rating > 5) {
    throw new WorkflowError("Rating must be between 1 and 5.");
  }

  const supabase = createAdminClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, client_id, freelancer_id, status")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError) throw projectError;
  if (!project || project.client_id !== actorUserId) {
    throw new WorkflowError("Project not found.");
  }
  if (project.status !== "completed") {
    throw new WorkflowError("Reviews can only be left on completed projects.");
  }

  const { error: insertError } = await supabase.from("project_reviews").insert({
    project_id: projectId,
    reviewer_id: actorUserId,
    reviewer_role: "client",
    rating: input.rating,
    feedback: input.feedback,
  });
  if (insertError) throw insertError;

  // Local-mirror write -- allowed per CLAUDE.md #2. Admin-only data; the
  // freelancer never sees client_rating_avg regardless of who fed it.
  if (project.freelancer_id) {
    await portalClient.recomputeClientRatingAverage(project.freelancer_id);
  }
}

export async function upsertAdminReview(
  actorUserId: string,
  projectId: string,
  input: { rating: number | null; feedback: string | null }
): Promise<void> {
  const supabase = createAdminClient();

  const { data: actorRow, error: actorError } = await supabase
    .from("users")
    .select("role")
    .eq("id", actorUserId)
    .maybeSingle();
  if (actorError) throw actorError;
  if (actorRow?.role !== "admin") {
    throw new WorkflowError("Only an admin can write the admin review.");
  }

  if (input.rating !== null && (input.rating < 1 || input.rating > 5)) {
    throw new WorkflowError("Rating must be between 1 and 5.");
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, status")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError) throw projectError;
  if (!project) throw new WorkflowError("Project not found.");
  if (project.status !== "completed") {
    throw new WorkflowError("Reviews can only be left on completed projects.");
  }

  const { error: upsertError } = await supabase.from("project_reviews").upsert(
    {
      project_id: projectId,
      reviewer_id: actorUserId,
      reviewer_role: "admin",
      rating: input.rating,
      feedback: input.feedback,
    },
    { onConflict: "project_id,reviewer_role" }
  );
  if (upsertError) throw upsertError;
}
