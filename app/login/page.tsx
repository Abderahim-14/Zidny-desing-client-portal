import { login } from "./actions";
import { ArrowRightIcon } from "@/components/primitives/icons";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "linear-gradient(160deg, var(--sky-50) 0%, var(--color-aqua-tint) 55%, var(--sky-100) 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--glass-light-hi)",
          backdropFilter: "blur(var(--blur-md))",
          WebkitBackdropFilter: "blur(var(--blur-md))",
          border: "1px solid var(--glass-border-light)",
          borderRadius: "var(--radius-2xl)",
          boxShadow: "var(--shadow-glass-lg)",
          padding: "40px 36px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: "var(--color-sky-blue)" }}>Zidny</span>
        </div>
        <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-muted)", margin: "0 0 32px" }}>
          Sign in to your Design Workflow dashboard.
        </p>

        {error ? (
          <div
            role="alert"
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--danger-soft)",
              color: "var(--danger)",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        ) : null}

        <form action={login} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="zx-lbl">Email</span>
            <input
              className="zx-input"
              type="email"
              name="email"
              required
              autoComplete="username"
              placeholder="you@zidny.dz"
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="zx-lbl">Password</span>
            <input
              className="zx-input"
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>
          <button
            type="submit"
            className="z-btn z-btn--primary z-btn--block"
            style={{ height: 50, marginTop: 8, gap: 8 }}
          >
            Sign in
            <ArrowRightIcon size={16} stroke="#fff" />
          </button>
        </form>

        <div style={{ borderTop: "1px solid var(--divider)", marginTop: 28, paddingTop: 18 }}>
          <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
            Accounts are created by an admin.
            <br />
            Contact the Head of Design if you don&apos;t have access yet.
          </p>
        </div>
      </div>
    </div>
  );
}
