"use client";

import { useState } from "react";
import type { ClientProjectDetail, ClientStage, OwnClientReview } from "@/lib/data/client";
import { TrackChip } from "@/components/primitives/TrackChip";
import { StageStatusChip } from "@/components/primitives/StageStatusChip";
import { ChecklistItem } from "@/components/primitives/ChecklistItem";
import { ProgressBar } from "@/components/primitives/ProgressBar";
import { ChevronDownIcon, LockIcon } from "@/components/primitives/icons";
import { ClientReviewSection } from "@/components/client/ClientReviewSection";

// Read-only subset of the admin/freelancer project detail: progress bar +
// per-stage previews (approved deliverables only -- the data layer already
// guarantees that via RLS, this component never sees anything else) + the
// client's own review. No freelancer identity, no admin controls, no
// meeting/audit data anywhere in these props.

export function ClientProjectView({
  project,
  stages,
  existingReview,
}: {
  project: ClientProjectDetail;
  stages: ClientStage[];
  existingReview: OwnClientReview | null;
}) {
  const [contextOpen, setContextOpen] = useState(false);

  const productionStages = stages.filter((s) => s.stageNumber >= 3);
  const approvedCount = productionStages.filter((s) => s.status === "approved").length;
  // Stages 1-2 (portal onboarding) are already behind the client by the
  // time this tool sees the project, so they count as done on the 5-stage
  // scale the ProgressBar primitive expects.
  const completedCount = 2 + approvedCount;
  const currentStage = productionStages.find((s) => s.status !== "approved");
  const currentStageLabel =
    project.status === "completed" ? "Delivered" : currentStage ? currentStage.name : "Strategy & Creative Direction";

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <TrackChip track={project.track} />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-strong)", margin: 0 }}>
          {project.projectLabel}
        </h1>
      </div>

      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-xs)",
          marginBottom: 16,
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={() => setContextOpen((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "15px 20px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            textAlign: "left",
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              background: "var(--neutral-100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <LockIcon size={14} stroke="var(--text-subtle)" />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>Your onboarding info</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>What you shared with us to kick things off</div>
          </div>
          <ChevronDownIcon
            size={18}
            style={{
              transition: "transform var(--duration-base) var(--ease-standard)",
              transform: contextOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>
        {contextOpen ? (
          <div style={{ padding: "4px 20px 20px", borderTop: "1px solid var(--divider)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "14px 24px", marginTop: 16 }}>
              <PortalField label="Package tier" value={project.packageTier} />
              {Object.entries(project.portalPayload).map(([key, value]) => (
                <PortalField key={key} label={key.replace(/_/g, " ")} value={String(value)} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-sm)",
          padding: "20px 22px",
          marginBottom: 16,
        }}
      >
        <ProgressBar currentStageLabel={currentStageLabel} completedCount={completedCount} />
      </div>

      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-sm)",
          padding: "20px 22px",
          marginBottom: 16,
        }}
      >
        <div className="zx-lbl" style={{ marginBottom: 14 }}>
          Stages
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {productionStages.map((s) => (
            <div key={s.stageNumber}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{s.name}</span>
                <StageStatusChip status={s.status} />
              </div>
              {s.approvedDeliverables.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {s.approvedDeliverables.map((d) => (
                    <ChecklistItem key={d.id} name={d.name} status="approved" description={d.description} />
                  ))}
                </div>
              ) : (
                <span className="zx-note">Not available yet -- previews appear once this stage is approved.</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {project.status === "completed" ? (
        <ClientReviewSection projectId={project.id} existingReview={existingReview} />
      ) : null}
    </div>
  );
}

function PortalField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="zx-lbl" style={{ marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}
