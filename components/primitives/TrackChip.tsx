import type { CSSProperties } from "react";
import type { ProjectTrack } from "@/lib/portal/types";

// Mapping transcribed verbatim from Admin.dc.html's _track().
const TRACK_MAP: Record<
  ProjectTrack,
  { label: string; background: string; color: string; borderColor: string; dot: string }
> = {
  brand: {
    label: "Brand",
    background: "var(--sky-50)",
    color: "var(--color-primary-blue)",
    borderColor: "var(--sky-100)",
    dot: "var(--color-sky-blue)",
  },
  uiux: {
    label: "UI/UX",
    background: "#EAFBFE",
    color: "#0B6E86",
    borderColor: "#BFEEF7",
    dot: "#17A0BE",
  },
  campaign: {
    label: "Campaign",
    background: "var(--surface-cream)",
    color: "#8A6A12",
    borderColor: "#F0E4B4",
    dot: "#E8A33D",
  },
};

export function TrackChip({ track, style }: { track: ProjectTrack; style?: CSSProperties }) {
  const t = TRACK_MAP[track];
  return (
    <span className="zx-chip" style={{ background: t.background, color: t.color, borderColor: t.borderColor, ...style }}>
      <span className="zx-dot" style={{ background: t.dot }} />
      {t.label}
    </span>
  );
}

// Gradient used for avatar swatches keyed by track (Admin.dc.html _trackAvatar()).
export function trackAvatarGradient(track: ProjectTrack): string {
  const map: Record<ProjectTrack, string> = {
    brand: "var(--gradient-sky)",
    uiux: "linear-gradient(135deg,#17A0BE 0%,#0B6E86 100%)",
    campaign: "linear-gradient(135deg,#E8A33D 0%,#B97E1E 100%)",
  };
  return map[track];
}
