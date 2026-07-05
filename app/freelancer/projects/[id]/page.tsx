import { notFound } from "next/navigation";
import { getFreelancerProjectDetail } from "@/lib/data/freelancer";
import { FreelancerProjectDetailClient } from "@/components/freelancer/FreelancerProjectDetailClient";

export default async function FreelancerProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getFreelancerProjectDetail(id);
  if (!project) notFound();
  return <FreelancerProjectDetailClient project={project} />;
}
