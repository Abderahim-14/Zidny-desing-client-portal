import type { CSSProperties } from "react";
import { BackArrowIcon, CheckIcon, LockIcon } from "./icons";

// 6 states, mapping transcribed verbatim from Admin.dc.html's _status().
export type StageStatusValue =
  | "locked"
  | "in_progress"
  | "submitted"
  | "in_review"
  | "approved"
  | "sent_back";

const STATUS_MAP: Record<
  StageStatusValue,
  { label: string; background: string; color: string; borderColor: string }
> = {
  in_progress: {
    label: "In progress",
    background: "var(--sky-50)",
    color: "var(--color-primary-blue)",
    borderColor: "var(--sky-100)",
  },
  submitted: {
    label: "Submitted",
    background: "var(--color-sky-blue)",
    color: "#fff",
    borderColor: "transparent",
  },
  in_review: {
    label: "In review",
    background: "var(--warning-soft)",
    color: "#9A6A12",
    borderColor: "#F1DCB0",
  },
  approved: {
    label: "Approved",
    background: "var(--success-soft)",
    color: "var(--success)",
    borderColor: "#BFE9D6",
  },
  sent_back: {
    label: "Sent back",
    background: "var(--danger-soft)",
    color: "var(--danger)",
    borderColor: "#F3CECB",
  },
  locked: {
    label: "Locked",
    background: "var(--neutral-100)",
    color: "var(--text-subtle)",
    borderColor: "var(--border-subtle)",
  },
};

export function StageStatusChip({ status, style }: { status: StageStatusValue; style?: CSSProperties }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.locked;
  return (
    <span
      className="zx-chip"
      style={{ background: s.background, color: s.color, borderColor: s.borderColor, ...style }}
    >
      {status === "submitted" || status === "approved" ? (
        <CheckIcon size={12} stroke={s.color} />
      ) : status === "sent_back" ? (
        <BackArrowIcon size={12} stroke={s.color} />
      ) : status === "locked" ? (
        <LockIcon size={12} stroke={s.color} />
      ) : (
        <span className="zx-dot" />
      )}
      {s.label}
    </span>
  );
}
