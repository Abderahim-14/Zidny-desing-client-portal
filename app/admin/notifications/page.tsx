import { getCurrentActor } from "@/lib/auth/current-actor";
import { listNotifications } from "@/lib/data/notifications";
import { NotificationsView } from "@/components/shared/NotificationsView";

export default async function AdminNotificationsPage() {
  const actor = await getCurrentActor();
  const notifications = await listNotifications(actor.userId);
  return <NotificationsView notifications={notifications} />;
}
