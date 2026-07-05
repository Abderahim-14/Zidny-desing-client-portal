"use client";

import { ArrowRightIcon, CheckIcon } from "./icons";

export function SubmitStageButton({ onClick, disabled }: { onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="z-btn z-btn--primary" style={{ height: 44 }} onClick={onClick} disabled={disabled}>
      Submit stage
      <span style={{ display: "inline-flex", marginLeft: 2 }}>
        <ArrowRightIcon size={16} stroke="#fff" />
      </span>
    </button>
  );
}

export function SubmittedLockedPill() {
  return (
    <span className="z-btn z-btn--secondary" style={{ height: 44, cursor: "default", pointerEvents: "none" }}>
      <CheckIcon size={16} stroke="var(--color-primary-blue)" />
      <span style={{ marginLeft: 4 }}>Submitted · locked</span>
    </span>
  );
}

export function MarkMeetingHeldButton({ onClick, disabled }: { onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="z-btn z-btn--primary z-btn--sm" onClick={onClick} disabled={disabled}>
      <CheckIcon size={14} stroke="#fff" />
      Mark meeting held
    </button>
  );
}

export function ApproveButton({
  label = "Approve · unlock next",
  onClick,
  disabled,
}: {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="z-btn z-btn--primary"
      style={{ height: 44, background: "var(--success)", boxShadow: "0 6px 18px rgba(31,169,113,.3)" }}
      onClick={onClick}
      disabled={disabled}
    >
      <CheckIcon size={16} stroke="#fff" />
      {label}
    </button>
  );
}

export function SendBackButton({ onClick, disabled }: { onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      className="z-btn"
      style={{ height: 44, background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid #F3CECB" }}
      onClick={onClick}
      disabled={disabled}
    >
      Send back
    </button>
  );
}
