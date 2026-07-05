import { ShipIcon } from "./icons";

const LOAD_CAP = 5;

function onTimeColor(onTimePct: number): string {
  if (onTimePct >= 90) return "var(--success)";
  if (onTimePct >= 80) return "var(--warning)";
  return "var(--danger)";
}

// Compact roster-row variant (Admin.dc.html): ship icon + load number + dot
// meter, divider, on-time percentage.
export function LoadOnTimeCompact({ load, onTimePct }: { load: number; onTimePct: number }) {
  const overloaded = load > LOAD_CAP;
  const otColor = onTimeColor(onTimePct);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        padding: "7px 12px",
        borderRadius: "var(--radius-sm)",
        background: overloaded ? "var(--danger-soft)" : "var(--surface-page)",
        border: overloaded ? "1px solid #F3CECB" : undefined,
        width: "fit-content",
      }}
    >
      <ShipIcon stroke={overloaded ? "var(--danger)" : "var(--text-muted)"} />
      <span style={{ fontSize: 13, fontWeight: 700, color: overloaded ? "var(--danger)" : "var(--text-strong)" }}>
        {load}
      </span>
      <span style={{ display: "inline-flex", gap: 3 }}>
        {Array.from({ length: LOAD_CAP }).map((_, i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: i < load ? (overloaded ? "var(--danger)" : "var(--color-sky-blue)") : "var(--neutral-200)",
            }}
          />
        ))}
      </span>
      <span style={{ width: 1, height: 14, background: "var(--border-default)" }} />
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: otColor }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)" }}>{onTimePct}%</span>
    </div>
  );
}

// Standalone segmented two-cell variant (Primitives.dc.html). Not used in
// the admin screens yet, kept for the primitive inventory.
export function LoadOnTimeSegmented({ load, onTimePct }: { load: number; onTimePct: number }) {
  const otColor = onTimeColor(onTimePct);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 15px", background: "var(--surface-card)" }}>
        <ShipIcon size={16} />
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>{load}</div>
          <div style={{ fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-subtle)" }}>
            active
          </div>
        </div>
      </div>
      <div style={{ width: 1, background: "var(--border-subtle)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 15px", background: "var(--surface-card)" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: otColor, flex: "none" }} />
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>{onTimePct}%</div>
          <div style={{ fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-subtle)" }}>
            on-time
          </div>
        </div>
      </div>
    </div>
  );
}
