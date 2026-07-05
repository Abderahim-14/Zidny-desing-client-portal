import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { listClientProjects } from "@/lib/data/client";
import { TrackChip } from "@/components/primitives/TrackChip";

export default async function ClientProjectsPage() {
  // Layout above already verified role === 'client'.
  const actor = await getCurrentActor();
  const projects = await listClientProjects(actor.userId);

  if (projects.length === 1) {
    redirect(`/client/projects/${projects[0]!.id}`);
  }

  return (
    <div>
      <div className="zx-lbl" style={{ marginBottom: 6 }}>
        My projects
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-strong)", margin: "0 0 22px" }}>Projects</h1>

      {projects.length === 0 ? (
        <span className="zx-note">No projects yet.</span>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/client/projects/${p.id}`}
              className="zx-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 20px",
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <TrackChip track={p.track} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>
                {p.projectLabel}
              </span>
              <span className="zx-note" style={{ textTransform: "capitalize" }}>
                {p.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
