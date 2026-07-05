"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { NotificationRow, NotificationType } from "@/lib/data/notifications";
import { BellIcon } from "@/components/primitives/icons";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/notifications/actions";

const TYPE_LABEL: Record<NotificationType, string> = {
  upload: "Fichier envoyé",
  submit: "Étape soumise",
  approve: "Étape approuvée",
  rework: "Révision demandée",
};

const TYPE_BADGE_CLASS: Record<NotificationType, string> = {
  upload: "z-badge--brand",
  submit: "z-badge--neutral",
  approve: "z-badge--success",
  rework: "z-badge--danger",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function NotificationsView({ notifications }: { notifications: NotificationRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: "var(--radius-sm)",
            background: "var(--sky-50)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BellIcon size={17} stroke="var(--color-primary-blue)" />
        </span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-strong)", margin: 0 }}>Notifications</h1>
        <div style={{ flex: 1 }} />
        {unreadCount > 0 ? (
          <button
            type="button"
            className="z-btn z-btn--secondary z-btn--sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await markAllNotificationsReadAction();
                router.refresh();
              })
            }
          >
            Marquer tout comme lu
          </button>
        ) : null}
      </div>
      <div className="zx-note" style={{ marginBottom: 20 }}>
        {notifications.length} récentes · {unreadCount} non lues
      </div>

      {notifications.length === 0 ? (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <span className="zx-note">Aucune notification pour le moment.</span>
        </div>
      ) : (
        <div
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow-sm)",
            overflow: "hidden",
          }}
        >
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              disabled={n.read || isPending}
              onClick={() =>
                startTransition(async () => {
                  await markNotificationReadAction(n.id);
                  router.refresh();
                })
              }
              className="zx-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 22px",
                borderBottom: "1px solid var(--divider)",
                background: n.read ? "transparent" : "var(--sky-50)",
                border: "none",
                borderBottomWidth: 1,
                width: "100%",
                textAlign: "left",
                cursor: n.read ? "default" : "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: n.read ? "transparent" : "var(--color-sky-blue)",
                  flex: "none",
                }}
              />
              <span className={`z-badge ${TYPE_BADGE_CLASS[n.type]}`} style={{ flex: "none" }}>
                {TYPE_LABEL[n.type]}
              </span>
              <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-body)" }}>{n.message}</span>
              <span className="zx-note" style={{ flex: "none" }}>
                {formatDateTime(n.createdAt)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
