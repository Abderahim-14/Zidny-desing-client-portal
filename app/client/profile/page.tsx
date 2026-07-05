import { getCurrentActor } from "@/lib/auth/current-actor";
import { getOwnClientProfile } from "@/lib/data/profile";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function ClientProfilePage() {
  const actor = await getCurrentActor();
  const profile = await getOwnClientProfile(actor.userId);

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
          marginBottom: 16,
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
        </div>
      </div>

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
          Company
        </div>
        {profile ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "14px 24px" }}>
            <ProfileField label="Company type" value={profile.companyType} />
            <ProfileField label="Sector" value={profile.sector} />
            <ProfileField label="Wilaya" value={profile.wilaya} />
            <ProfileField
              label="Preferred services"
              value={profile.preferredServices.length > 0 ? profile.preferredServices.join(", ") : null}
            />
          </div>
        ) : (
          <span className="zx-note">No company info on file.</span>
        )}
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="zx-lbl" style={{ marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13.5, color: "var(--text-body)" }}>{value ?? "—"}</div>
    </div>
  );
}
