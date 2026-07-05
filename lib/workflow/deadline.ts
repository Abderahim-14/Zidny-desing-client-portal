// Deadline indicator classification (design primitive: on-track / due-soon /
// overdue). Matches Admin.dc.html's _deadline(): overdue if past, due-soon
// if due today or tomorrow, on-track otherwise. Returns null when a
// deadline chip shouldn't render at all (no deadline set, or the stage is
// locked/already approved -- nothing to be "on time" about).

export type DeadlineState = "on_track" | "due_soon" | "overdue";

export interface DeadlineInfo {
  state: DeadlineState;
  label: string;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function classifyDeadline(
  deadline: string | null,
  stageStatus: string,
  today: Date = new Date()
): DeadlineInfo | null {
  if (!deadline) return null;
  if (stageStatus === "locked" || stageStatus === "approved") return null;

  const deadlineDate = new Date(`${deadline}T00:00:00`);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysUntil = Math.round((deadlineDate.getTime() - todayMidnight.getTime()) / MS_PER_DAY);

  if (daysUntil < 0) {
    return { state: "overdue", label: `Overdue · ${Math.abs(daysUntil)}d` };
  }
  if (daysUntil === 0) {
    return { state: "due_soon", label: "Due today" };
  }
  if (daysUntil === 1) {
    return { state: "due_soon", label: "Due tomorrow" };
  }
  return { state: "on_track", label: `Due ${formatShortDate(deadlineDate)}` };
}
