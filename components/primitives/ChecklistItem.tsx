import type { CSSProperties } from "react";
import { BackArrowIcon, CheckIcon, LockIcon } from "./icons";
import type { DeliverableStatus } from "@/lib/workflow/transitions";

// 5 states, mapping transcribed verbatim from Admin.dc.html's _deliv()
// (using its row background for "pending", not the slightly-inconsistent
// swatch background in Primitives.dc.html -- see design extraction notes).
const STATE_MAP: Record<
  DeliverableStatus,
  { badgeClass: string; badgeLabel: string; rowStyle: string; boxStyle: string }
> = {
  pending: {
    badgeClass: "z-badge--neutral",
    badgeLabel: "Pending",
    rowStyle: "border:1px dashed var(--border-strong);background:var(--surface-card)",
    boxStyle: "border:2px solid var(--border-strong)",
  },
  uploaded: {
    badgeClass: "z-badge--brand",
    badgeLabel: "Uploaded",
    rowStyle: "border:1px solid var(--sky-100);background:var(--sky-50)",
    boxStyle: "background:var(--color-sky-blue)",
  },
  awaiting_review: {
    badgeClass: "z-badge--neutral",
    badgeLabel: "Awaiting review",
    rowStyle: "border:1px solid var(--border-default);background:var(--surface-sunken)",
    boxStyle: "background:var(--neutral-500)",
  },
  approved: {
    badgeClass: "z-badge--success",
    badgeLabel: "Approved",
    rowStyle: "border:1px solid #BFE9D6;background:var(--success-soft)",
    boxStyle: "background:var(--success)",
  },
  needs_rework: {
    badgeClass: "z-badge--danger",
    badgeLabel: "Needs rework",
    rowStyle: "border:1px solid #F3CECB;background:var(--danger-soft)",
    boxStyle: "background:var(--danger)",
  },
};

function styleStringToObject(css: string): CSSProperties {
  const style: Record<string, string> = {};
  for (const rule of css.split(";")) {
    const [prop, value] = rule.split(":");
    if (!prop || !value) continue;
    const camel = prop.trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    style[camel] = value.trim();
  }
  return style;
}

export function ChecklistItem({
  name,
  status,
  description,
  reworkNote,
}: {
  name: string;
  status: DeliverableStatus;
  description?: string | null;
  reworkNote?: string | null;
}) {
  const s = STATE_MAP[status];
  const isNeedsRework = status === "needs_rework";

  return (
    <div
      style={{
        display: "flex",
        alignItems: isNeedsRework || description ? "flex-start" : "center",
        gap: 12,
        padding: "13px 15px",
        borderRadius: "var(--radius-md)",
        ...styleStringToObject(s.rowStyle),
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: isNeedsRework || description ? 1 : undefined,
          ...styleStringToObject(s.boxStyle),
        }}
      >
        {status === "uploaded" || status === "approved" ? <CheckIcon size={12} /> : null}
        {status === "awaiting_review" ? <LockIcon size={11} /> : null}
        {status === "needs_rework" ? <BackArrowIcon size={12} /> : null}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--text-body)",
            textDecoration: status === "approved" ? "line-through" : undefined,
            textDecorationColor: status === "approved" ? "rgba(31,169,113,.4)" : undefined,
          }}
        >
          {name}
        </div>
        {description ? (
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{description}</div>
        ) : null}
        {isNeedsRework && reworkNote ? (
          <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 2 }}>Agency: {reworkNote}</div>
        ) : null}
      </div>
      <span className={`z-badge ${s.badgeClass}`}>{s.badgeLabel}</span>
    </div>
  );
}
