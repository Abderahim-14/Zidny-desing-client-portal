"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon, ChevronDownIcon, LogOutIcon, SearchIcon, UserIcon } from "@/components/primitives/icons";
import { signOut } from "@/app/login/signout-action";

// Shared shell for all three roles (build prompt "Navbar"): top bar (logo,
// search, bell + unread badge, user menu) + left sidebar (nav items,
// role-appropriate). Each role's layout.tsx does its own auth guard
// (requireAdmin/requireClient/requireFreelancer) and passes down
// role-specific nav items and hrefs -- this component has no role logic of
// its own.
//
// Logo: references public/logo.svg -- that file needs to actually exist in
// the repo for this to render; there was no way to save the pasted image
// to disk from this session, so the <Image> tag is wired up correctly but
// will 404 until the real file is added.

export interface AppShellNavItem {
  href: string;
  label: string;
  // A plain element, not a function -- layout.tsx files that build
  // NAV_ITEMS are Server Components, and functions can't be passed as
  // props across the server/client boundary to this ("use client") shell.
  // Icons must be given `stroke="currentColor"` so the active/inactive
  // color (set via the Link's CSS `color`) cascades down instead.
  icon: React.ReactNode;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function AppShell({
  actorName,
  actorEmail,
  roleLabel,
  unreadCount,
  navItems,
  profileHref,
  notificationsHref,
  children,
}: {
  actorName: string;
  actorEmail: string;
  roleLabel: string;
  unreadCount: number;
  navItems: AppShellNavItem[];
  profileHref: string;
  notificationsHref: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, var(--sky-50) 0%, var(--color-aqua-tint) 55%, var(--sky-100) 100%)",
      }}
    >
      <div style={{ height: 3, background: "var(--gradient-deep)" }} />

      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "14px 28px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <span style={{ position: "relative", width: 110, height: 32, flex: "none" }}>
          <Image src="/logo.svg" alt="Zidny" fill style={{ objectFit: "contain", objectPosition: "left center" }} priority />
        </span>

        <div style={{ flex: 1, maxWidth: 420, position: "relative", display: "flex", alignItems: "center" }}>
          <span style={{ position: "absolute", left: 14, display: "flex" }}>
            <SearchIcon />
          </span>
          <input
            placeholder="Rechercher…"
            style={{
              width: "100%",
              height: 40,
              padding: "0 14px 0 38px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--border-default)",
              background: "var(--surface-card)",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              color: "var(--text-body)",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ flex: 1 }} />

        <Link
          href={notificationsHref}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            flex: "none",
          }}
        >
          <BellIcon />
          {unreadCount > 0 ? (
            <span
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                minWidth: 16,
                height: 16,
                borderRadius: "50%",
                background: "var(--danger)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 3px",
              }}
            >
              {unreadCount}
            </span>
          ) : null}
        </Link>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-pill)",
              padding: "6px 14px 6px 6px",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "var(--color-sky-blue)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                flex: "none",
              }}
            >
              {initialsOf(actorName)}
            </span>
            <span style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-strong)", lineHeight: 1.2 }}>
                {actorName}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-subtle)", letterSpacing: "0.04em" }}>{roleLabel}</div>
            </span>
          </button>

          {menuOpen ? (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: 240,
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-md)",
                padding: 12,
                zIndex: 100,
              }}
            >
              <div style={{ padding: "6px 8px 12px", borderBottom: "1px solid var(--divider)", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{actorName}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{actorEmail}</div>
              </div>
              <Link
                href={profileHref}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 8px",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13.5,
                  color: "var(--text-body)",
                  textDecoration: "none",
                }}
              >
                <UserIcon size={15} /> Mon profil
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 8px",
                    borderRadius: "var(--radius-md)",
                    fontSize: 13.5,
                    color: "var(--danger)",
                    background: "none",
                    border: "none",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  <LogOutIcon size={15} /> Se déconnecter
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </header>

      <div style={{ display: "flex" }}>
        <aside style={{ width: 236, flex: "none", padding: "22px 16px" }}>
          <div className="zx-lbl" style={{ padding: "0 8px", marginBottom: 10 }}>
            Vue d&apos;ensemble
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {navItems.map((item) => {
              const active = pathname === item.href;
              const color = active ? "var(--color-primary-blue)" : "var(--text-muted)";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: "10px 12px 10px 16px",
                    borderRadius: "var(--radius-md)",
                    fontFamily: "var(--font-sans)",
                    fontSize: 14,
                    fontWeight: active ? 700 : 600,
                    textDecoration: "none",
                    background: active ? "var(--surface-card)" : "transparent",
                    color: active ? "var(--text-strong)" : "var(--text-muted)",
                    boxShadow: active ? "var(--shadow-xs)" : "none",
                  }}
                >
                  {active ? (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "18%",
                        bottom: "18%",
                        width: 3,
                        borderRadius: "0 4px 4px 0",
                        background: "var(--color-sky-blue)",
                      }}
                    />
                  ) : null}
                  <span style={{ display: "flex", color, flex: "none" }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {active ? (
                    <ChevronDownIcon size={14} stroke="var(--text-subtle)" style={{ transform: "rotate(-90deg)" }} />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main style={{ flex: 1, minWidth: 0, padding: "28px 40px 64px" }}>{children}</main>
      </div>
    </div>
  );
}
