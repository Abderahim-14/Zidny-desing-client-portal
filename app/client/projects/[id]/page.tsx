import { notFound } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { getClientProject, getClientProjectStages, getOwnClientReview } from "@/lib/data/client";
import { ClientProjectView } from "@/components/client/ClientProjectView";

export default async function ClientProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getCurrentActor();
  const project = await getClientProject(id, actor.userId);
  if (!project) notFound();

  const [stages, existingReview] = await Promise.all([
    getClientProjectStages(id),
    project.status === "completed" ? getOwnClientReview(id, actor.userId) : Promise.resolve(null),
  ]);

  return <ClientProjectView project={project} stages={stages} existingReview={existingReview} />;
}
