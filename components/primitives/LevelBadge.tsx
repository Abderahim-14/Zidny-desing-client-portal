import type { CSSProperties } from "react";
import type { FreelancerLevel } from "@/lib/workflow/level";

// Mapping transcribed verbatim from Admin.dc.html's _level().
const LEVEL_MAP: Record<FreelancerLevel, { background: string; color: string; borderColor?: string }> = {
  Junior: { background: "var(--neutral-100)", color: "var(--text-muted)", borderColor: "var(--border-subtle)" },
  Mid: { background: "var(--sky-50)", color: "var(--color-primary-blue)", borderColor: "var(--sky-100)" },
  Senior: { background: "var(--color-deep-navy)", color: "#fff" },
};

export function LevelBadge({
  level,
  size = "md",
  style,
}: {
  level: FreelancerLevel;
  size?: "md" | "sm";
  style?: CSSProperties;
}) {
  const l = LEVEL_MAP[level];
  return (
    <span
      className="zx-chip"
      style={{
        background: l.background,
        color: l.color,
        borderColor: l.borderColor ?? "transparent",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        fontSize: size === "sm" ? "10px" : "11px",
        height: size === "sm" ? 19 : 24,
        padding: size === "sm" ? "0 8px" : undefined,
        ...style,
      }}
    >
      {level}
    </span>
  );
}
