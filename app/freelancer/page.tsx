import Link from "next/link";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { getFreelancerOwnOnTimeHistory, listFreelancerProjects, type FreelancerProjectRow } from "@/lib/data/freelancer";
import { TrackChip } from "@/components/primitives/TrackChip";
import { StageStatusChip } from "@/components/primitives/StageStatusChip";
import { DeadlineChip } from "@/components/primitives/DeadlineChip";
import { classifyDeadline } from "@/lib/workflow/deadline";

const GRID_COLUMNS = "2.1fr 1fr 1.8fr 1.2fr 1.2fr";

export default async function FreelancerProjectsPage() {
  // Layout above already verified role === 'freelancer'.
  const actor = await getCurrentActor();
  const [projects, onTime] = await Promise.all([
    listFreelancerProjects(actor.userId),
    getFreelancerOwnOnTimeHistory(),
  ]);

  const active = projects.filter((p) => p.status === "active" || p.status === "paused");
  const completed = projects.filter((p) => p.status === "completed");

  return (
    <div style={{ maxWidth: 960 }}>
      <div className="zx-lbl" style={{ marginBottom: 6 }}>
        Freelancer
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-strong)", margin: "0 0 22px" }}>My projects</h1>

      <ProjectTable title="Active" projects={active} emptyMessage="No active projects right now." />
      <ProjectTable title="Completed" projects={completed} emptyMessage="No completed projects yet." />

      {/* Own progress -- deliveries_count/on_time_rate only, never the
          composite score/revision_rate/client_rating_avg (admin-only). */}
      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-sm)",
          padding: "20px 22px",
        }}
      >
        <div className="zx-lbl" style={{ marginBottom: 14 }}>
          My on-time history
        </div>
        {onTime ? (
          <div style={{ display: "flex", gap: 32 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-strong)" }}>
                {Math.round(onTime.onTimeRate * 100)}%
              </div>
              <div className="zx-lbl" style={{ marginTop: 4 }}>
                On-time rate
              </div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-strong)" }}>
                {onTime.deliveriesCount}
              </div>
              <div className="zx-lbl" style={{ marginTop: 4 }}>
                Deliveries
              </div>
            </div>
          </div>
        ) : (
          <span className="zx-note">No delivery history yet.</span>
        )}
      </div>
    </div>
  );
}

// Same dense-table composition as the admin dashboard (DashboardClient),
// minus the Freelancer column (this is the freelancer's own view) and the
// filter bar (nothing to filter -- it's already scoped to their own
// projects via RLS).
function ProjectTable({
  title,
  projects,
  emptyMessage,
}: {
  title: string;
  projects: FreelancerProjectRow[];
  emptyMessage: string;
}) {
  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: GRID_COLUMNS,
          gap: 12,
          padding: "13px 22px",
          background: "var(--surface-sunken)",
          borderBottom: "1px solid var(--divider)",
        }}
      >
        <span className="zx-lbl">{title} · Client</span>
        <span className="zx-lbl">Track</span>
        <span className="zx-lbl">Current stage</span>
        <span className="zx-lbl">Status</span>
        <span className="zx-lbl">Deadline</span>
      </div>

      {projects.length === 0 ? (
        <div style={{ padding: "32px 22px" }}>
          <span className="zx-note">{emptyMessage}</span>
        </div>
      ) : (
        projects.map((p) => {
          const deadlineInfo = classifyDeadline(p.deadline, p.currentStageStatus);
          return (
            <Link
              key={p.id}
              href={`/freelancer/projects/${p.id}`}
              className="zx-row"
              style={{
                display: "grid",
                gridTemplateColumns: GRID_COLUMNS,
                gap: 12,
                alignItems: "center",
                padding: "14px 22px",
                borderBottom: "1px solid var(--divider)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
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
              <div>
                <TrackChip track={p.track} />
              </div>
              <div style={{ fontSize: 13, color: "var(--text-body)" }}>
                Stage {p.currentStageNumber} · {p.currentStageName}
              </div>
              <div>
                <StageStatusChip status={p.currentStageStatus} />
              </div>
              <div>{deadlineInfo ? <DeadlineChip info={deadlineInfo} /> : null}</div>
            </Link>
          );
        })
      )}
    </div>
  );
}
