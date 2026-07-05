import { listFreelancerRoster } from "@/lib/data/admin";
import { RosterClient } from "@/components/admin/RosterClient";

export default async function AdminRosterPage() {
  const roster = await listFreelancerRoster();
  return <RosterClient roster={roster} />;
}
