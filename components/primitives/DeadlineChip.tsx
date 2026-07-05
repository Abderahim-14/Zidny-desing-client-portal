import type { DeadlineInfo } from "@/lib/workflow/deadline";
import { ClockIcon } from "./icons";

const STATE_MAP: Record<DeadlineInfo["state"], { background: string; color: string; borderColor: string }> = {
  on_track: { background: "var(--neutral-100)", color: "var(--text-muted)", borderColor: "var(--border-subtle)" },
  due_soon: { background: "var(--warning-soft)", color: "#9A6A12", borderColor: "#F1DCB0" },
  overdue: { background: "var(--danger-soft)", color: "var(--danger)", borderColor: "#F3CECB" },
};

export function DeadlineChip({ info }: { info: DeadlineInfo }) {
  const s = STATE_MAP[info.state];
  return (
    <span className="zx-chip" style={{ background: s.background, color: s.color, borderColor: s.borderColor }}>
      <ClockIcon size={12} stroke={s.color} />
      {info.label}
    </span>
  );
}
