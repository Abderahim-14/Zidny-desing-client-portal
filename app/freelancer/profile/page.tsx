import { getCurrentActor } from "@/lib/auth/current-actor";
import { getFreelancerOwnOnTimeHistory } from "@/lib/data/freelancer";
import { getOwnFreelancerProfile } from "@/lib/data/profile";
import { LevelBadge } from "@/components/primitives/LevelBadge";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function FreelancerProfilePage() {
  const actor = await getCurrentActor();
  const [profile, onTime] = await Promise.all([
    getOwnFreelancerProfile(actor.userId),
    getFreelancerOwnOnTimeHistory(),
  ]);

  return (
    <div style={{ maxWidth: 640 }}>
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
          alignItems: "flex-start",
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
          <div style={{ fontSize: 14, color: "var(--text-body)", marginTop: 8 }}>
            {profile?.headline ?? "No headline set"}
          </div>
          {profile?.wilaya ? <div className="zx-note" style={{ marginTop: 4 }}>{profile.wilaya}</div> : null}
        </div>
      </div>

      {profile?.bio ? (
        <div
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "16px 20px",
            marginBottom: 16,
            fontSize: 13.5,
            color: "var(--text-body)",
            lineHeight: 1.6,
          }}
        >
          {profile.bio}
        </div>
      ) : null}

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
        {profile && profile.skills.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {profile.skills.map((s, i) => (
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

      {/* Own on-time history only -- never the composite score,
          revision_rate, client_rating_avg, or internal_score (admin-only). */}
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
