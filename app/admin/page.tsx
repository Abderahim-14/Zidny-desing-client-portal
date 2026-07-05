import { listProjectsForDashboard } from "@/lib/data/admin";
import { DashboardClient } from "@/components/admin/DashboardClient";

export default async function AdminDashboardPage() {
  const projects = await listProjectsForDashboard();
  return <DashboardClient projects={projects} />;
}
