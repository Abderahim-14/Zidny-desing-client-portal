import { notFound } from "next/navigation";
import Link from "next/link";
import { getFreelancerDetail } from "@/lib/data/admin";
import { TrackChip } from "@/components/primitives/TrackChip";
import { LevelBadge } from "@/components/primitives/LevelBadge";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function vettingBadgeClass(status: string): string {
  if (status === "approved") return "z-badge--success";
  if (status === "rejected") return "z-badge--danger";
  return "z-badge--neutral";
}

export default async function FreelancerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const freelancer = await getFreelancerDetail(id);
  if (!freelancer) notFound();

  return (
    <div style={{ maxWidth: 900 }}>
      <Link
        href="/admin/roster"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 16 }}
      >
        ‹ Freelancer roster
      </Link>

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
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 17,
            flex: "none",
            background: freelancer.skills[0]?.level === "Senior" ? "var(--color-deep-navy)" : "var(--neutral-100)",
            color: freelancer.skills[0]?.level === "Senior" ? "#fff" : "var(--text-muted)",
          }}
        >
          {initials(freelancer.name)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-strong)", margin: 0 }}>{freelancer.name}</h1>
          <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
            {freelancer.headline ?? "No headline set"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <span className="zx-note">{freelancer.email}</span>
            {freelancer.phone ? <span className="zx-note">· {freelancer.phone}</span> : null}
            {freelancer.wilaya ? <span className="zx-note">· {freelancer.wilaya}</span> : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {freelancer.availability ? <span className="z-badge z-badge--neutral">{freelancer.availability}</span> : null}
            <span className={`z-badge ${vettingBadgeClass(freelancer.vettingStatus)}`}>{freelancer.vettingStatus}</span>
            <span className="z-badge z-badge--brand">Internal score {freelancer.internalScore.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {freelancer.bio ? (
        <div
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "18px 22px",
            marginBottom: 16,
            fontSize: 13.5,
            color: "var(--text-body)",
            lineHeight: 1.6,
          }}
        >
          {freelancer.bio}
        </div>
      ) : null}

      {/* Full quality metrics -- admin-only composite */}
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
          Quality metrics · admin only
        </div>
        {freelancer.quality ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16 }}>
            <MetricTile label="Score" value={freelancer.quality.score.toFixed(1)} />
            <MetricTile label="On-time rate" value={`${Math.round(freelancer.quality.onTimeRate * 100)}%`} />
            <MetricTile label="Deliveries" value={String(freelancer.quality.deliveriesCount)} />
            <MetricTile label="Revision rate" value={`${Math.round(freelancer.quality.revisionRate * 100)}%`} />
            <MetricTile label="Client rating" value={freelancer.quality.clientRatingAvg.toFixed(1)} />
          </div>
        ) : (
          <span className="zx-note">No quality score on file yet.</span>
        )}
        <div style={{ marginTop: 16 }}>
          <MetricTile label="Current load" value={`${freelancer.load} active`} inline />
        </div>
      </div>

      {/* Skills -- per-skill level, not a single derived badge */}
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
          Skills
        </div>
        {freelancer.skills.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {freelancer.skills.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--surface-page)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ fontSize: 13.5, color: "var(--text-body)" }}>{s.skill}</span>
                <LevelBadge level={s.level} size="sm" />
              </div>
            ))}
          </div>
        ) : (
          <span className="zx-note">No skills listed.</span>
        )}
      </div>

      {/* Active projects */}
      <ProjectListCard title="Active projects" projects={freelancer.activeProjects} showStage />

      {/* Completed projects */}
      <ProjectListCard title="Completed projects" projects={freelancer.completedProjects} />

      {/* Portfolio */}
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
          Portfolio
        </div>
        {freelancer.portfolioItems.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {freelancer.portfolioItems.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "12px 15px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-default)",
                  background: "var(--surface-page)",
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)" }}>{item.title}</div>
                {item.description ? (
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{item.description}</div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <span className="zx-note">No portfolio items yet.</span>
        )}
      </div>
    </div>
  );
}

function MetricTile({ label, value, inline }: { label: string; value: string; inline?: boolean }) {
  if (inline) {
    return (
      <span style={{ fontSize: 13, color: "var(--text-body)" }}>
        <span style={{ fontWeight: 700, color: "var(--text-strong)" }}>{value}</span>{" "}
        <span className="zx-lbl" style={{ display: "inline" }}>
          {label}
        </span>
      </span>
    );
  }
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-strong)" }}>{value}</div>
      <div className="zx-lbl" style={{ marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

function ProjectListCard({
  title,
  projects,
  showStage,
}: {
  title: string;
  projects: { id: string; track: import("@/lib/portal/types").ProjectTrack; projectLabel: string; currentStage?: number }[];
  showStage?: boolean;
}) {
  return (
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
        {title}
      </div>
      {projects.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/admin/projects/${p.id}`}
              className="zx-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
                color: "inherit",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <TrackChip track={p.track} />
              <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-body)" }}>{p.projectLabel}</span>
              {showStage && p.currentStage ? (
                <span className="zx-note">Stage {p.currentStage}</span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <span className="zx-note">None.</span>
      )}
    </div>
  );
}
