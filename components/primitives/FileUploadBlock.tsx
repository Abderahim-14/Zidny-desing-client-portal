import { RefreshIcon, UploadIcon } from "./icons";

// Not wired into the admin screens (admin reviews, freelancers upload --
// that's the freelancer-view phase) but built now so it's in the primitive
// inventory per CLAUDE.md #5.

export function FileUploadDropzone() {
  return (
    <div
      style={{
        border: "1.5px dashed var(--sky-200)",
        borderRadius: "var(--radius-lg)",
        background: "var(--brand-soft)",
        padding: 26,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        textAlign: "center",
      }}
    >
      <span
        style={{
          width: 42,
          height: 42,
          borderRadius: "var(--radius-md)",
          background: "var(--sky-100)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <UploadIcon size={20} />
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-primary-blue)" }}>
        Drop files or paste a link
      </span>
      <span className="zx-note">PDF, Figma, PNG, or a shared URL</span>
    </div>
  );
}

export function FileUploadReworkRequested() {
  return (
    <div
      style={{
        border: "1.5px solid #F3CECB",
        borderRadius: "var(--radius-lg)",
        background: "var(--danger-soft)",
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 13,
      }}
    >
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: "var(--radius-md)",
          background: "#F7D5D2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
      >
        <RefreshIcon size={18} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--danger)" }}>Re-upload requested</div>
        <div className="zx-note" style={{ color: "#B23C36" }}>
          Replace the flagged file, then re-submit the stage.
        </div>
      </div>
    </div>
  );
}
