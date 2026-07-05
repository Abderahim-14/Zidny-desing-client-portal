import { getCurrentActor } from "@/lib/auth/current-actor";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function AdminProfilePage() {
  const actor = await getCurrentActor();

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="zx-lbl" style={{ marginBottom: 6 }}>
        Mon profil
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-strong)", margin: "0 0 22px" }}>Profil</h1>

      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-sm)",
          padding: "24px 26px",
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <span
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--color-deep-navy)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 19,
            fontWeight: 700,
            flex: "none",
          }}
        >
          {initials(actor.name)}
        </span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-strong)" }}>{actor.name}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{actor.email}</div>
          <span className="z-badge z-badge--brand" style={{ marginTop: 8, display: "inline-flex" }}>
            Admin
          </span>
        </div>
      </div>
    </div>
  );
}
