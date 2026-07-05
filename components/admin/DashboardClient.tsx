"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DashboardProjectRow } from "@/lib/data/admin";
import { StageStatusChip, type StageStatusValue } from "@/components/primitives/StageStatusChip";
import { TrackChip, trackAvatarGradient } from "@/components/primitives/TrackChip";
import { DeadlineChip } from "@/components/primitives/DeadlineChip";
import { classifyDeadline } from "@/lib/workflow/deadline";
import type { ProjectTrack } from "@/lib/portal/types";
import { CheckIcon, ClockIcon } from "@/components/primitives/icons";

const TRACK_OPTIONS: { value: ProjectTrack | "all"; label: string }[] = [
  { value: "all", label: "All tracks" },
  { value: "brand", label: "Brand" },
  { value: "uiux", label: "UI/UX" },
  { value: "campaign", label: "Campaign" },
];

const STATUS_OPTIONS: { value: StageStatusValue | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "in_progress", label: "In progress" },
  { value: "submitted", label: "Submitted" },
  { value: "in_review", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "sent_back", label: "Sent back" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function DashboardClient({ projects }: { projects: DashboardProjectRow[] }) {
  const [track, setTrack] = useState<ProjectTrack | "all">("all");
  const [status, setStatus] = useState<StageStatusValue | "all">("all");
  const [freelancer, setFreelancer] = useState<string>("all");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const freelancerOptions = useMemo(() => {
    const names = Array.from(new Set(projects.map((p) => p.freelancerName).filter(Boolean))) as string[];
    return names.sort();
  }, [projects]);

  const withDeadline = useMemo(
    () =>
      projects.map((p) => ({
        ...p,
        deadlineInfo: classifyDeadline(p.deadline, p.currentStageStatus),
      })),
    [projects]
  );

  const summary = useMemo(() => {
    const active = projects.filter((p) => p.projectStatus === "active").length;
    const awaitingReview = projects.filter(
      (p) => p.currentStageStatus === "submitted" || p.currentStageStatus === "in_review"
    ).length;
    const overdue = withDeadline.filter((p) => p.deadlineInfo?.state === "overdue").length;
    return { active, awaitingReview, overdue };
  }, [projects, withDeadline]);

  const filtered = withDeadline.filter((p) => {
    if (track !== "all" && p.track !== track) return false;
    if (status !== "all" && p.currentStageStatus !== status) return false;
    if (freelancer !== "all" && p.freelancerName !== freelancer) return false;
    if (overdueOnly && p.deadlineInfo?.state !== "overdue") return false;
    return true;
  });

  const hasActiveFilters = track !== "all" || status !== "all" || freelancer !== "all" || overdueOnly;

  function clearFilters() {
    setTrack("all");
    setStatus("all");
    setFreelancer("all");
    setOverdueOnly(false);
  }

  return (
    <div>
      <div className="zx-lbl" style={{ marginBottom: 6 }}>
        Admin
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-strong)", margin: "0 0 22px" }}>
        All projects
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 22 }}>
        <SummaryTile
          label="Active projects"
          value={summary.active}
          iconBg="var(--sky-50)"
          valueColor="var(--text-strong)"
          icon={<CheckIcon size={18} stroke="var(--color-primary-blue)" />}
        />
        <SummaryTile
          label="Awaiting your review"
          value={summary.awaitingReview}
          iconBg="var(--warning-soft)"
          valueColor="var(--text-strong)"
          icon={<ClockIcon size={18} stroke="#9A6A12" />}
        />
        <button
          type="button"
          onClick={() => setOverdueOnly((v) => !v)}
          style={{
            textAlign: "left",
            cursor: "pointer",
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-xs)",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontFamily: "var(--font-sans)",
          }}
        >
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-md)",
              background: "var(--danger-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <ClockIcon size={18} stroke="var(--danger)" />
          </span>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--danger)", lineHeight: 1 }}>
              {summary.overdue}
            </div>
            <div className="zx-lbl" style={{ marginTop: 5 }}>
              Overdue &nbsp;›
            </div>
          </div>
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select className="zx-sel" value={track} onChange={(e) => setTrack(e.target.value as ProjectTrack | "all")}>
          {TRACK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          className="zx-sel"
          value={status}
          onChange={(e) => setStatus(e.target.value as StageStatusValue | "all")}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select className="zx-sel" value={freelancer} onChange={(e) => setFreelancer(e.target.value)}>
          <option value="all">All freelancers</option>
          {freelancerOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setOverdueOnly((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 600,
            height: 36,
            padding: "0 15px",
            borderRadius: "var(--radius-pill)",
            cursor: "pointer",
            background: overdueOnly ? "var(--danger-soft)" : "var(--surface-card)",
            color: overdueOnly ? "var(--danger)" : "var(--text-muted)",
            border: overdueOnly ? "1px solid #F3CECB" : "1px solid var(--border-default)",
          }}
        >
          Overdue only
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {filtered.length} of {projects.length}
        </span>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-primary-blue)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2.1fr 1fr 1.5fr 1.6fr 1.2fr 1.2fr",
            gap: 12,
            padding: "13px 22px",
            background: "var(--surface-sunken)",
            borderBottom: "1px solid var(--divider)",
          }}
        >
          <span className="zx-lbl">Client · Project</span>
          <span className="zx-lbl">Track</span>
          <span className="zx-lbl">Freelancer</span>
          <span className="zx-lbl">Current stage</span>
          <span className="zx-lbl">Status</span>
          <span className="zx-lbl">Deadline</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "64px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-strong)" }}>
              No projects match these filters
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Try widening the track, status, or freelancer filter.
            </div>
            <button type="button" className="z-btn z-btn--secondary z-btn--sm" onClick={clearFilters}>
              Clear all filters
            </button>
          </div>
        ) : (
          filtered.map((p) => (
            <Link
              key={p.id}
              href={`/admin/projects/${p.id}`}
              className="zx-row"
              style={{
                display: "grid",
                gridTemplateColumns: "2.1fr 1fr 1.5fr 1.6fr 1.2fr 1.2fr",
                gap: 12,
                alignItems: "center",
                padding: "14px 22px",
                borderBottom: "1px solid var(--divider)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius-sm)",
                    flex: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    background: trackAvatarGradient(p.track),
                  }}
                >
                  {initials(p.clientName)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-strong)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.clientName}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.projectLabel}
                  </div>
                </div>
              </div>
              <div>
                <TrackChip track={p.track} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                {p.freelancerName ? (
                  <>
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
                        flex: "none",
                      }}
                    >
                      {initials(p.freelancerName)}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text-body)" }}>{p.freelancerName}</span>
                  </>
                ) : (
                  <span style={{ fontSize: 13, color: "var(--text-subtle)" }}>Unassigned</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-body)" }}>
                Stage {p.currentStageNumber} · {p.currentStageName}
              </div>
              <div>
                <StageStatusChip status={p.currentStageStatus} />
              </div>
              <div>{p.deadlineInfo ? <DeadlineChip info={p.deadlineInfo} /> : null}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  iconBg,
  valueColor,
  icon,
}: {
  label: string;
  value: number;
  iconBg: string;
  valueColor: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-xs)",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--radius-md)",
          background: iconBg,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </span>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: valueColor, lineHeight: 1 }}>{value}</div>
        <div className="zx-lbl" style={{ marginTop: 5 }}>
          {label}
        </div>
      </div>
    </div>
  );
}
