import { requireFreelancer } from "@/lib/auth/current-actor";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { AppShell, type AppShellNavItem } from "@/components/layout/AppShell";
import { BellIcon, FolderIcon, UserIcon } from "@/components/primitives/icons";

const NAV_ITEMS: AppShellNavItem[] = [
  { href: "/freelancer", label: "Mes projets", icon: <FolderIcon stroke="currentColor" /> },
  { href: "/freelancer/profile", label: "Mon profil", icon: <UserIcon stroke="currentColor" /> },
  { href: "/freelancer/notifications", label: "Notifications", icon: <BellIcon stroke="currentColor" /> },
];

export default async function FreelancerLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireFreelancer();
  const unreadCount = await getUnreadNotificationCount(actor.userId);

  return (
    <AppShell
      actorName={actor.name}
      actorEmail={actor.email}
      roleLabel="FREELANCER"
      unreadCount={unreadCount}
      navItems={NAV_ITEMS}
      profileHref="/freelancer/profile"
      notificationsHref="/freelancer/notifications"
    >
      {children}
    </AppShell>
  );
}
