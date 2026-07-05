import { notFound } from "next/navigation";
import { getProjectDetail, getProjectReviews } from "@/lib/data/admin";
import { getDeliverableTemplates, type DeliverableTemplate } from "@/lib/data/templates";
import { ProjectDetailClient } from "@/components/admin/ProjectDetailClient";

export default async function AdminProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectDetail(id);
  if (!project) notFound();

  const [reviews, templates3, templates4, templates5] = await Promise.all([
    project.status === "completed" ? getProjectReviews(id) : Promise.resolve(null),
    getDeliverableTemplates(project.track, 3),
    getDeliverableTemplates(project.track, 4),
    getDeliverableTemplates(project.track, 5),
  ]);

  const templatesByStage: Record<number, DeliverableTemplate[]> = {
    3: templates3,
    4: templates4,
    5: templates5,
  };

  return <ProjectDetailClient project={project} reviews={reviews} templatesByStage={templatesByStage} />;
}
