import { requireAdmin } from "@/lib/auth/current-actor";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { AppShell, type AppShellNavItem } from "@/components/layout/AppShell";
import { BellIcon, GridIcon, UserIcon, UsersIcon } from "@/components/primitives/icons";

const NAV_ITEMS: AppShellNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <GridIcon stroke="currentColor" /> },
  { href: "/admin/roster", label: "Freelancer roster", icon: <UsersIcon stroke="currentColor" /> },
  { href: "/admin/profile", label: "Mon profil", icon: <UserIcon stroke="currentColor" /> },
  { href: "/admin/notifications", label: "Notifications", icon: <BellIcon stroke="currentColor" /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Every admin route resolves and verifies the actor here, first, before
  // any page or server action underneath runs.
  const actor = await requireAdmin();
  const unreadCount = await getUnreadNotificationCount(actor.userId);

  return (
    <AppShell
      actorName={actor.name}
      actorEmail={actor.email}
      roleLabel="ADMIN"
      unreadCount={unreadCount}
      navItems={NAV_ITEMS}
      profileHref="/admin/profile"
      notificationsHref="/admin/notifications"
    >
      {children}
    </AppShell>
  );
}
