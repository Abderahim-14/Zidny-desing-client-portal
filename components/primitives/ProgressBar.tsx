// Horizontal 5-stage progress bar (Primitives.dc.html). Not used by the
// admin screens (project detail uses the vertical FiveStageTracker instead
// -- that's what Admin.dc.html actually composes) but built now so it's in
// the primitive inventory for the freelancer/client views.

const STAGE_LABELS = ["Strategy", "Direction", "Production", "Delivery"];

export function ProgressBar({
  currentStageLabel,
  completedCount,
}: {
  currentStageLabel: string;
  completedCount: number;
}) {
  const pct = Math.round((completedCount / 5) * 100);

  return (
    <div>
      <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-body)" }}>{currentStageLabel}</span>
        <span className="zx-note">{completedCount} of 5 · {pct}%</span>
      </div>
      <div className="z-progress" style={{ height: 10 }}>
        <div className="z-progress__fill" style={{ width: `${pct}%` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        {STAGE_LABELS.map((label) => (
          <span key={label} className="zx-note" style={{ fontSize: 10.5 }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
