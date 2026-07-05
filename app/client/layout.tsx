import { requireClient } from "@/lib/auth/current-actor";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { AppShell, type AppShellNavItem } from "@/components/layout/AppShell";
import { BellIcon, FolderIcon, UserIcon } from "@/components/primitives/icons";

const NAV_ITEMS: AppShellNavItem[] = [
  { href: "/client", label: "Mes projets", icon: <FolderIcon stroke="currentColor" /> },
  { href: "/client/profile", label: "Mon profil", icon: <UserIcon stroke="currentColor" /> },
  { href: "/client/notifications", label: "Notifications", icon: <BellIcon stroke="currentColor" /> },
];

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireClient();
  const unreadCount = await getUnreadNotificationCount(actor.userId);

  return (
    <AppShell
      actorName={actor.name}
      actorEmail={actor.email}
      roleLabel="CLIENT"
      unreadCount={unreadCount}
      navItems={NAV_ITEMS}
      profileHref="/client/profile"
      notificationsHref="/client/notifications"
    >
      {children}
    </AppShell>
  );
}
