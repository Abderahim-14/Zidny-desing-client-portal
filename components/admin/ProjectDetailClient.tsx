"use client";

import { useMemo, useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ProjectDetail, ProjectReviews, ProjectStage } from "@/lib/data/admin";
import type { DeliverableTemplate } from "@/lib/data/templates";
import { ReviewsSection } from "@/components/admin/ReviewsSection";
import { DeliverablePicker } from "@/components/admin/DeliverablePicker";
import { StageStatusChip } from "@/components/primitives/StageStatusChip";
import { TrackChip, trackAvatarGradient } from "@/components/primitives/TrackChip";
import { LevelBadge } from "@/components/primitives/LevelBadge";
import { DeadlineChip } from "@/components/primitives/DeadlineChip";
import { ChecklistItem } from "@/components/primitives/ChecklistItem";
import {
  ApproveButton,
  MarkMeetingHeldButton,
  SendBackButton,
  SubmitStageButton,
  SubmittedLockedPill,
} from "@/components/primitives/WorkflowButtons";
import { CalendarIcon, CheckIcon, ChevronDownIcon, ClockIcon, LockIcon, PencilIcon, UploadIcon } from "@/components/primitives/icons";
import { classifyDeadline } from "@/lib/workflow/deadline";
import {
  approveStageAction,
  markMeetingHeldAction,
  scheduleMeetingAction,
  sendBackStageAction,
  setStageDeadlineAction,
  submitStageAction,
  uploadDeliverableAction,
} from "@/app/admin/projects/[id]/actions";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function defaultScheduleDraft(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ProjectDetailClient({
  project,
  reviews,
  templatesByStage,
}: {
  project: ProjectDetail;
  reviews: ProjectReviews | null;
  templatesByStage: Record<number, DeliverableTemplate[]>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [contextOpen, setContextOpen] = useState(false);

  // Every project always has exactly 5 stage rows (receiveProjectHandoff /
  // seed invariant), so this is always non-empty.
  const activeStage = useMemo(
    () => project.stages.find((s) => s.status !== "locked" && s.status !== "approved") ?? project.stages[project.stages.length - 1]!,
    [project.stages]
  );
  const [expandedStage, setExpandedStage] = useState<number>(activeStage.stageNumber);

  const overallStage = project.stages.find((s) => s.stageNumber === expandedStage) ?? activeStage;

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
        href="/admin"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 16 }}
      >
        ‹ All projects
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

      {/* Header card */}
      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-sm)",
          padding: "24px 26px",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
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
            {project.freelancer ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "var(--neutral-100)",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {initials(project.freelancer.name)}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{project.freelancer.name}</span>
                <LevelBadge level={project.freelancer.level} size="sm" />
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-subtle)", marginTop: 14 }}>No freelancer assigned</div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="zx-lbl" style={{ marginBottom: 6 }}>
              Overall
            </div>
            <StageStatusChip status={project.status === "completed" ? "approved" : overallStage.status} />
          </div>
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
          <StageRow
            key={stage.id}
            stage={stage}
            isLast={stage.stageNumber === 5}
            isExpanded={expandedStage === stage.stageNumber}
            onToggle={() => setExpandedStage((v) => (v === stage.stageNumber ? -1 : stage.stageNumber))}
            projectId={project.id}
            freelancerName={project.freelancer?.name ?? null}
            templates={templatesByStage[stage.stageNumber] ?? []}
            isPending={isPending}
            onError={setError}
            runAction={runAction}
          />
        ))}
      </div>

      {reviews ? (
        <ReviewsSection projectId={project.id} clientReview={reviews.client} adminReview={reviews.admin} />
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

function StageRow({
  stage,
  isLast,
  isExpanded,
  onToggle,
  projectId,
  freelancerName,
  templates,
  isPending,
  onError,
  runAction,
}: {
  stage: ProjectStage;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  projectId: string;
  freelancerName: string | null;
  templates: DeliverableTemplate[];
  isPending: boolean;
  onError: (msg: string | null) => void;
  runAction: (fn: () => Promise<void>) => void;
}) {
  const isPortal = stage.stageNumber <= 2;
  const isPast = stage.status === "approved";
  // Distinct from "current": a stage the admin hasn't reached yet still
  // renders (so its required deliverables can be defined in advance), but
  // shouldn't look "active" -- no blue highlight, no upload/submit/review
  // controls, just the deliverable picker.
  const isFutureLocked = !isPortal && stage.status === "locked";
  const isCurrent = !isPortal && !isPast && !isFutureLocked;
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
          <ActiveStagePanel
            stage={stage}
            projectId={projectId}
            freelancerName={freelancerName}
            templates={templates}
            isPending={isPending}
            onError={onError}
            runAction={runAction}
          />
        ) : null}

        {expandable && isExpanded && isFutureLocked ? (
          <FutureStagePanel
            stage={stage}
            projectId={projectId}
            templates={templates}
            isPending={isPending}
            runAction={runAction}
          />
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

function FutureStagePanel({
  stage,
  projectId,
  templates,
  isPending,
  runAction,
}: {
  stage: ProjectStage;
  projectId: string;
  templates: DeliverableTemplate[];
  isPending: boolean;
  runAction: (fn: () => Promise<void>) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div
      style={{
        marginTop: 12,
        padding: 18,
        borderRadius: "var(--radius-lg)",
        background: "var(--surface-page)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
        <span className="zx-note">Not started yet -- you can define its required deliverables now.</span>
        {!pickerOpen ? (
          <button type="button" className="z-btn z-btn--secondary z-btn--sm" onClick={() => setPickerOpen(true)}>
            {stage.deliverables.length > 0 ? "Edit deliverables" : "Set deliverables"}
          </button>
        ) : null}
      </div>

      {stage.deliverables.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: pickerOpen ? 14 : 0 }}>
          {stage.deliverables.map((d) => (
            <ChecklistItem key={d.id} name={d.name} status={d.status} description={d.description} />
          ))}
        </div>
      ) : !pickerOpen ? (
        <span className="zx-note">No deliverables defined yet.</span>
      ) : null}

      {pickerOpen ? (
        <DeliverablePicker
          projectId={projectId}
          stageId={stage.id}
          templates={templates}
          existingNames={stage.deliverables.map((d) => d.name)}
          isPending={isPending}
          onClose={() => setPickerOpen(false)}
          runAction={runAction}
        />
      ) : null}
    </div>
  );
}

function ActiveStagePanel({
  stage,
  projectId,
  freelancerName,
  templates,
  isPending,
  onError,
  runAction,
}: {
  stage: ProjectStage;
  projectId: string;
  freelancerName: string | null;
  templates: DeliverableTemplate[];
  isPending: boolean;
  onError: (msg: string | null) => void;
  runAction: (fn: () => Promise<void>) => void;
}) {
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [deadlineDraft, setDeadlineDraft] = useState(stage.deadline ?? "");
  const [scheduleDraft, setScheduleDraft] = useState(defaultScheduleDraft());
  const [sendBackMode, setSendBackMode] = useState(false);
  const [flagPicks, setFlagPicks] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");
  const [uploadDrafts, setUploadDrafts] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState(false);

  const deadlineInfo = classifyDeadline(stage.deadline, stage.status);
  const flaggableDeliverables = stage.deliverables.filter((d) => d.status === "awaiting_review");

  const justSentBack = stage.status === "in_progress" && stage.meeting?.outcome === "sent_back";
  const needSchedule = stage.status === "submitted";
  const awaitingHold = stage.status === "in_review" && stage.meeting?.status === "scheduled";
  const ready = stage.status === "in_review" && stage.meeting?.status === "held";

  return (
    <div style={{ marginTop: 12, padding: 18, borderRadius: "var(--radius-lg)", background: "var(--surface-page)", border: "1px solid var(--border-subtle)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="zx-lbl">Deliverables · Stage {stage.stageNumber}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!editingDeadline ? (
            <>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Deadline</span>
              {deadlineInfo ? <DeadlineChip info={deadlineInfo} /> : <span className="zx-note">Not set</span>}
              <button
                type="button"
                onClick={() => setEditingDeadline(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-primary-blue)",
                  background: "var(--sky-50)",
                  border: "none",
                  borderRadius: "var(--radius-pill)",
                  height: 28,
                  padding: "0 12px",
                  cursor: "pointer",
                }}
              >
                <PencilIcon /> Adjust
              </button>
            </>
          ) : (
            <>
              <input
                type="date"
                value={deadlineDraft}
                onChange={(e) => setDeadlineDraft(e.target.value)}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  height: 34,
                  padding: "0 10px",
                  border: "1px solid var(--color-sky-blue)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-body)",
                  boxShadow: "0 0 0 3px var(--focus-ring)",
                }}
              />
              <button
                type="button"
                className="z-btn z-btn--primary z-btn--sm"
                disabled={isPending || !deadlineDraft}
                onClick={() =>
                  runAction(async () => {
                    await setStageDeadlineAction(projectId, stage.id, deadlineDraft);
                    setEditingDeadline(false);
                  })
                }
              >
                Save
              </button>
              <button type="button" className="z-btn z-btn--ghost z-btn--sm" onClick={() => setEditingDeadline(false)}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {stage.status === "in_progress" ? (
        <div style={{ marginBottom: 12 }}>
          {!pickerOpen ? (
            <button type="button" className="z-btn z-btn--secondary z-btn--sm" onClick={() => setPickerOpen(true)}>
              {stage.deliverables.length > 0 ? "Edit deliverables" : "Set deliverables"}
            </button>
          ) : (
            <DeliverablePicker
              projectId={projectId}
              stageId={stage.id}
              templates={templates}
              existingNames={stage.deliverables.map((d) => d.name)}
              isPending={isPending}
              onClose={() => setPickerOpen(false)}
              runAction={runAction}
            />
          )}
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {stage.deliverables.length === 0 ? (
          <span className="zx-note">No deliverables defined yet -- use &quot;Set deliverables&quot; above.</span>
        ) : null}
        {stage.deliverables.map((d) => {
          const needsUpload = stage.status === "in_progress" && d.status !== "uploaded" && d.status !== "approved";
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
                    Upload as admin
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {stage.status === "in_progress" && !justSentBack ? (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--surface-info)",
              marginBottom: 12,
              fontSize: 12.5,
              color: "var(--color-primary-blue)",
            }}
          >
            Admin acting on behalf of {freelancerName ?? "the freelancer"} -- uploads and the submit below are
            logged as an admin stand-in action.
          </div>
          <SubmitStageButton
            disabled={
              isPending ||
              stage.deliverables.length === 0 ||
              stage.deliverables.some((d) => d.status !== "uploaded")
            }
            onClick={() => runAction(async () => await submitStageAction(projectId, stage.id))}
          />
          <span style={{ marginLeft: 10, fontSize: 12.5, color: "var(--text-subtle)" }}>
            Enabled once every deliverable is uploaded
          </span>
        </div>
      ) : null}

      {stage.status === "submitted" ? (
        <div style={{ marginTop: 16 }}>
          <SubmittedLockedPill />
        </div>
      ) : null}

      {(needSchedule || awaitingHold || ready) && (
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border-default)" }}>
          <div className="zx-lbl" style={{ marginBottom: 12 }}>
            Agency review
          </div>

          {needSchedule ? (
            <ScheduleMeetingBlock
              scheduleDraft={scheduleDraft}
              setScheduleDraft={setScheduleDraft}
              isPending={isPending}
              onSchedule={() =>
                runAction(async () => {
                  await scheduleMeetingAction(projectId, stage.id, new Date(scheduleDraft).toISOString());
                })
              }
            />
          ) : null}

          {awaitingHold ? (
            <>
              <InfoBanner
                tone="info"
                title="Submitted — deliverables locked"
                body="Hold the validation meeting, then approve or send back."
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-default)",
                  background: "var(--surface-card)",
                  marginBottom: 14,
                }}
              >
                <span style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "var(--sky-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CalendarIcon size={18} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>Validation meeting</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                    Scheduled {formatDateTime(stage.meeting?.scheduledAt ?? null)} · email invite is a later automation
                  </div>
                </div>
                <MarkMeetingHeldButton
                  disabled={isPending}
                  onClick={() => runAction(async () => await markMeetingHeldAction(projectId, stage.id))}
                />
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <ApproveButton disabled />
                <SendBackButton disabled />
                <span style={{ fontSize: 12.5, color: "var(--text-subtle)" }}>Enabled after the meeting is marked held</span>
              </div>
            </>
          ) : null}

          {ready && !sendBackMode ? (
            <>
              <InfoBanner
                tone="success"
                title="Validation meeting held"
                body="Record the outcome — approve to unlock the next stage, or send back for edits."
              />
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <ApproveButton
                  label={stage.stageNumber >= 5 ? "Approve · deliver" : "Approve · unlock next"}
                  disabled={isPending}
                  onClick={() => runAction(async () => await approveStageAction(projectId, stage.id))}
                />
                <SendBackButton
                  disabled={isPending || flaggableDeliverables.length === 0}
                  onClick={() => {
                    onError(null);
                    setSendBackMode(true);
                  }}
                />
              </div>
            </>
          ) : null}

          {ready && sendBackMode ? (
            <div style={{ padding: 16, borderRadius: "var(--radius-md)", border: "1px solid #F3CECB", background: "var(--danger-soft)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--danger)", marginBottom: 3 }}>Send back for edits</div>
              <div style={{ fontSize: 12.5, color: "#B23C36", marginBottom: 14 }}>
                Flag the specific deliverables that need rework. No fee, no penalty — the stage reopens as In progress.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
                {flaggableDeliverables.map((d) => {
                  const checked = Boolean(flagPicks[d.id]);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setFlagPicks((prev) => ({ ...prev, [d.id]: !prev[d.id] }))}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 11,
                        padding: "10px 13px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--surface-card)",
                        border: `1px solid ${checked ? "#F3CECB" : "var(--border-default)"}`,
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <span
                        style={{
                          width: 19,
                          height: 19,
                          borderRadius: 5,
                          flex: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: checked ? "var(--danger)" : "transparent",
                          border: checked ? undefined : "2px solid var(--border-strong)",
                        }}
                      >
                        {checked ? <CheckIcon size={11} /> : null}
                      </span>
                      <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-body)" }}>{d.name}</span>
                      {checked ? <span className="z-badge z-badge--danger">Needs rework</span> : null}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for the freelancer (optional)…"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  color: "var(--text-body)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  padding: "11px 13px",
                  resize: "vertical",
                  minHeight: 64,
                  background: "var(--surface-card)",
                  marginBottom: 14,
                }}
              />
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  type="button"
                  className="z-btn z-btn--danger"
                  style={{ height: 42 }}
                  disabled={isPending || Object.values(flagPicks).every((v) => !v)}
                  onClick={() =>
                    runAction(async () => {
                      const flagged = Object.entries(flagPicks)
                        .filter(([, checked]) => checked)
                        .map(([deliverableId]) => ({ deliverableId, note }));
                      await sendBackStageAction(projectId, stage.id, flagged);
                      setSendBackMode(false);
                      setFlagPicks({});
                      setNote("");
                    })
                  }
                >
                  Confirm send back ({Object.values(flagPicks).filter(Boolean).length})
                </button>
                <button type="button" className="z-btn z-btn--ghost" style={{ height: 42 }} onClick={() => setSendBackMode(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {justSentBack ? (
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border-default)" }}>
          <div
            style={{
              display: "flex",
              gap: 11,
              padding: "14px 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--danger-soft)",
              border: "1px solid #F3CECB",
            }}
          >
            <ClockIcon size={18} stroke="var(--danger)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--danger)" }}>Sent back — awaiting re-submission</div>
              <div style={{ fontSize: 13, color: "#B23C36", marginTop: 2 }}>
                {stage.deliverables.some((d) => d.status === "needs_rework")
                  ? `Flagged: ${stage.deliverables.filter((d) => d.status === "needs_rework").map((d) => d.name).join(", ")}`
                  : "Returned to In progress for edits."}
              </div>
            </div>
          </div>
          {stage.meeting?.notes ? (
            <div style={{ marginTop: 12, padding: "12px 15px", borderRadius: "var(--radius-md)", background: "var(--surface-page)", border: "1px solid var(--border-subtle)" }}>
              <div className="zx-lbl" style={{ marginBottom: 4 }}>
                Note to freelancer
              </div>
              <div style={{ fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.5 }}>{stage.meeting.notes}</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ScheduleMeetingBlock({
  scheduleDraft,
  setScheduleDraft,
  isPending,
  onSchedule,
}: {
  scheduleDraft: string;
  setScheduleDraft: (v: string) => void;
  isPending: boolean;
  onSchedule: () => void;
}) {
  return (
    <>
      <InfoBanner tone="info" title="Submitted — deliverables locked" body="Schedule the validation meeting, then hold it to unlock approve / send back." />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-default)",
          background: "var(--surface-card)",
        }}
      >
        <span style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "var(--sky-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CalendarIcon size={18} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>Validation meeting</div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Not scheduled yet · email invite is a later automation</div>
        </div>
        <input
          type="datetime-local"
          value={scheduleDraft}
          onChange={(e) => setScheduleDraft(e.target.value)}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            height: 36,
            padding: "0 10px",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
          }}
        />
        <button type="button" className="z-btn z-btn--primary z-btn--sm" disabled={isPending} onClick={onSchedule}>
          Schedule
        </button>
      </div>
    </>
  );
}

function InfoBanner({ tone, title, body }: { tone: "info" | "success"; title: string; body: string }) {
  const bg = tone === "info" ? "var(--surface-info)" : "var(--success-soft)";
  const color = tone === "info" ? "var(--color-primary-blue)" : "var(--success)";
  return (
    <div style={{ display: "flex", gap: 11, padding: "14px 16px", borderRadius: "var(--radius-md)", background: bg, marginBottom: 14 }}>
      {tone === "info" ? <ClockIcon size={18} stroke={color} /> : <CheckIcon size={18} stroke={color} />}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color }}>{title}</div>
        <div style={{ fontSize: 13, color, opacity: 0.85, marginTop: 2 }}>{body}</div>
      </div>
    </div>
  );
}
