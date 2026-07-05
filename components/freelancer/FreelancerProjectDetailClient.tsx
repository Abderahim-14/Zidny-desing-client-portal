"use client";

import { useMemo, useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ProjectDetail, ProjectStage } from "@/lib/data/admin";
import { StageStatusChip } from "@/components/primitives/StageStatusChip";
import { TrackChip, trackAvatarGradient } from "@/components/primitives/TrackChip";
import { ChecklistItem } from "@/components/primitives/ChecklistItem";
import { SubmitStageButton, SubmittedLockedPill } from "@/components/primitives/WorkflowButtons";
import { CheckIcon, ChevronDownIcon, ClockIcon, LockIcon, UploadIcon } from "@/components/primitives/icons";
import { submitStageAction, uploadDeliverableAction } from "@/app/freelancer/projects/[id]/actions";

// Permission-reduced subset of components/admin/ProjectDetailClient.tsx:
// same tracker/checklist primitives and visual language, but no meeting
// scheduling, no approve/send-back, no deadline editing, and no admin
// stand-in banner -- a freelancer can never advance a stage (CLAUDE.md #3).

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function FreelancerProjectDetailClient({ project }: { project: ProjectDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [contextOpen, setContextOpen] = useState(false);

  // Every project always has exactly 5 stage rows.
  const activeStage = useMemo(
    () =>
      project.stages.find((s) => s.status !== "locked" && s.status !== "approved") ??
      project.stages[project.stages.length - 1]!,
    [project.stages]
  );
  const [expandedStage, setExpandedStage] = useState<number>(activeStage.stageNumber);

  function runAction(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <Link
        href="/freelancer"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 16 }}
      >
        ‹ My projects
      </Link>

      {error ? (
        <div
          style={{
            padding: "12px 15px",
            borderRadius: "var(--radius-md)",
            background: "var(--danger-soft)",
            color: "var(--danger)",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      ) : null}

      {/* Header */}
      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-sm)",
          padding: "24px 26px",
          marginBottom: 16,
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            width: 52,
            height: 52,
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 17,
            background: trackAvatarGradient(project.track),
            flex: "none",
          }}
        >
          {initials(project.client.name)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-strong)", margin: 0 }}>
              {project.client.name}
            </h1>
            <TrackChip track={project.track} />
          </div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
            {(project.portalPayload.brief_summary as string | undefined) ?? `${project.track} project`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="zx-lbl" style={{ marginBottom: 6 }}>
            Overall
          </div>
          <StageStatusChip status={project.status === "completed" ? "approved" : activeStage.status} />
        </div>
      </div>

      {/* Portal context */}
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
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>
              Portal context · Stages 1–2
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Onboarding hand-off — read-only, owned by the client portal
            </div>
          </div>
          <StageStatusChip status="locked" />
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

      {/* Five-stage tracker */}
      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-sm)",
          padding: "8px 26px 20px",
        }}
      >
        <div className="zx-lbl" style={{ padding: "20px 0 8px", color: "var(--color-sky-blue)" }}>
          Five-stage tracker
        </div>
        {project.stages.map((stage) => (
          <FreelancerStageRow
            key={stage.id}
            stage={stage}
            isLast={stage.stageNumber === 5}
            isExpanded={expandedStage === stage.stageNumber}
            onToggle={() => setExpandedStage((v) => (v === stage.stageNumber ? -1 : stage.stageNumber))}
            projectId={project.id}
            isPending={isPending}
            runAction={runAction}
          />
        ))}
      </div>
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

function FreelancerStageRow({
  stage,
  isLast,
  isExpanded,
  onToggle,
  projectId,
  isPending,
  runAction,
}: {
  stage: ProjectStage;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  projectId: string;
  isPending: boolean;
  runAction: (fn: () => Promise<void>) => void;
}) {
  const isPortal = stage.stageNumber <= 2;
  const isPast = stage.status === "approved";
  const isCurrent = !isPortal && !isPast;
  const expandable = !isPortal;

  let nodeStyle: CSSProperties;
  if (isPortal) {
    nodeStyle = { background: "var(--neutral-100)", color: "var(--text-subtle)", border: "1px solid var(--border-subtle)" };
  } else if (isPast) {
    nodeStyle = { background: "var(--success)", color: "#fff" };
  } else if (isCurrent) {
    nodeStyle = { background: "var(--color-sky-blue)", color: "#fff", boxShadow: "0 0 0 4px var(--sky-50)" };
  } else {
    nodeStyle = { background: "var(--surface-card)", color: "var(--text-subtle)", border: "2px solid var(--border-default)" };
  }

  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none", width: 34 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 13,
            flex: "none",
            ...nodeStyle,
          }}
        >
          {isPast ? <CheckIcon size={14} stroke="#fff" /> : stage.stageNumber}
        </span>
        {!isLast ? (
          <span
            style={{
              width: 2,
              flex: 1,
              minHeight: 22,
              marginTop: 4,
              background: isPast ? "var(--success)" : "var(--border-default)",
            }}
          />
        ) : null}
      </div>
      <div className="zx-stagerow" style={{ flex: 1, minWidth: 0, paddingBottom: 18 }}>
        <button
          type="button"
          onClick={expandable ? onToggle : undefined}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "none",
            border: "none",
            padding: "5px 0",
            cursor: expandable ? "pointer" : "default",
            fontFamily: "var(--font-sans)",
            textAlign: "left",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: isCurrent ? "var(--color-primary-blue)" : "var(--text-strong)" }}>
                {stage.name}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-subtle)" }}>
                · {isPortal ? "Portal (read-only)" : "Design Department"}
              </span>
            </div>
          </div>
          {isPortal ? <StageStatusChip status="locked" /> : <StageStatusChip status={stage.status} />}
          {expandable ? (
            <ChevronDownIcon
              className="zx-expandhint"
              size={16}
              stroke="var(--text-subtle)"
              style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          ) : null}
        </button>

        {expandable && isExpanded && isCurrent ? (
          <FreelancerActiveStagePanel stage={stage} projectId={projectId} isPending={isPending} runAction={runAction} />
        ) : null}

        {expandable && isExpanded && isPast ? (
          <div
            style={{
              marginTop: 8,
              padding: "14px 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--success-soft)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <CheckIcon size={16} stroke="#177A54" />
            <span style={{ fontSize: 13, color: "#177A54", fontWeight: 500 }}>
              All deliverables approved{stage.approvedAt ? ` · validated ${formatDateTime(stage.approvedAt)}` : ""}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FreelancerActiveStagePanel({
  stage,
  projectId,
  isPending,
  runAction,
}: {
  stage: ProjectStage;
  projectId: string;
  isPending: boolean;
  runAction: (fn: () => Promise<void>) => void;
}) {
  const [uploadDrafts, setUploadDrafts] = useState<Record<string, string>>({});

  const justSentBack = stage.status === "in_progress" && stage.meeting?.outcome === "sent_back";
  const inReview = stage.status === "submitted" || stage.status === "in_review";

  return (
    <div style={{ marginTop: 12, padding: 18, borderRadius: "var(--radius-lg)", background: "var(--surface-page)", border: "1px solid var(--border-subtle)" }}>
      <div className="zx-lbl" style={{ marginBottom: 16 }}>
        Deliverables · Stage {stage.stageNumber}
      </div>

      {justSentBack ? (
        <div
          style={{
            display: "flex",
            gap: 11,
            padding: "14px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--danger-soft)",
            border: "1px solid #F3CECB",
            marginBottom: 16,
          }}
        >
          <ClockIcon size={18} stroke="var(--danger)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--danger)" }}>Sent back for edits</div>
            <div style={{ fontSize: 13, color: "#B23C36", marginTop: 2 }}>
              Fix the flagged deliverable(s) below, then resubmit. No fee, no penalty.
            </div>
            {stage.meeting?.notes ? (
              <div style={{ marginTop: 8, fontSize: 13, color: "#B23C36" }}>
                <strong>Agency note:</strong> {stage.meeting.notes}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {stage.deliverables.length === 0 ? (
        <div
          style={{
            display: "flex",
            gap: 11,
            padding: "14px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-info)",
          }}
        >
          <ClockIcon size={18} stroke="var(--color-primary-blue)" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-primary-blue)" }}>
              Deliverables not yet defined
            </div>
            <div style={{ fontSize: 13, color: "var(--color-primary-blue)", opacity: 0.85, marginTop: 2 }}>
              Waiting for the agency to set what this stage requires -- you&apos;ll be notified once they do.
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {stage.deliverables.map((d) => {
          const needsUpload = d.status !== "uploaded" && d.status !== "approved";
          return (
            <div key={d.id}>
              <ChecklistItem name={d.name} status={d.status} description={d.description} reworkNote={d.reworkNote} />
              {needsUpload ? (
                <div style={{ display: "flex", gap: 8, marginTop: 6, marginLeft: 32 }}>
                  <input
                    className="zx-input"
                    style={{ height: 34, fontSize: 12.5 }}
                    placeholder="Paste a file or link URL…"
                    value={uploadDrafts[d.id] ?? ""}
                    onChange={(e) => setUploadDrafts((prev) => ({ ...prev, [d.id]: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="z-btn z-btn--secondary z-btn--sm"
                    style={{ flex: "none" }}
                    disabled={isPending || !uploadDrafts[d.id]}
                    onClick={() =>
                      runAction(async () => {
                        await uploadDeliverableAction(projectId, d.id, uploadDrafts[d.id]!);
                        setUploadDrafts((prev) => ({ ...prev, [d.id]: "" }));
                      })
                    }
                  >
                    <UploadIcon size={14} stroke="var(--color-primary-blue)" />
                    Upload
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {stage.status === "in_progress" && stage.deliverables.length > 0 ? (
        <div style={{ marginTop: 16 }}>
          <SubmitStageButton
            disabled={isPending || stage.deliverables.some((d) => d.status !== "uploaded")}
            onClick={() => runAction(async () => await submitStageAction(projectId, stage.id))}
          />
          <span style={{ marginLeft: 10, fontSize: 12.5, color: "var(--text-subtle)" }}>
            Enabled once every deliverable is uploaded
          </span>
        </div>
      ) : null}

      {inReview ? (
        <div style={{ marginTop: 16 }}>
          <SubmittedLockedPill />
          <span style={{ marginLeft: 10, fontSize: 12.5, color: "var(--text-subtle)" }}>
            Awaiting agency review -- the agency schedules and holds the validation meeting.
          </span>
        </div>
      ) : null}
    </div>
  );
}
