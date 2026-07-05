"use client";

import { useState } from "react";
import type { DeliverableTemplate } from "@/lib/data/templates";
import { CheckIcon } from "@/components/primitives/icons";
import { setStageDeliverablesAction } from "@/app/admin/projects/[id]/actions";

// The template picker (build prompt "Deliverable templates"): a stage's
// required deliverables are real `deliverables` rows, not the template
// menu itself -- this just turns a chosen set of template + custom names
// into that set via setStageDeliverables(), which reconciles by name
// (insert new, delete dropped, leave existing untouched).

export function DeliverablePicker({
  projectId,
  stageId,
  templates,
  existingNames,
  isPending,
  onClose,
  runAction,
}: {
  projectId: string;
  stageId: string;
  templates: DeliverableTemplate[];
  existingNames: string[];
  isPending: boolean;
  onClose: () => void;
  runAction: (fn: () => Promise<void>) => void;
}) {
  const hasExisting = existingNames.length > 0;
  const [checked, setChecked] = useState<Set<string>>(
    () =>
      new Set(
        templates.filter((t) => (hasExisting ? existingNames.includes(t.name) : t.isDefault)).map((t) => t.name)
      )
  );
  const [customNames, setCustomNames] = useState<string[]>(() =>
    existingNames.filter((n) => !templates.some((t) => t.name === n))
  );
  const [customDraft, setCustomDraft] = useState("");

  function toggle(name: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function addCustom() {
    const trimmed = customDraft.trim();
    if (!trimmed || customNames.includes(trimmed)) return;
    setCustomNames((prev) => [...prev, trimmed]);
    setCustomDraft("");
  }

  const totalCount = checked.size + customNames.length;

  function save() {
    const items = [
      ...templates.filter((t) => checked.has(t.name)).map((t) => ({ name: t.name, description: t.description })),
      ...customNames.map((name) => ({ name, description: null })),
    ];
    runAction(async () => {
      await setStageDeliverablesAction(projectId, stageId, items);
      onClose();
    });
  }

  return (
    <div
      style={{
        padding: 16,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--sky-100)",
        background: "var(--sky-50)",
      }}
    >
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)", marginBottom: 3 }}>
        {hasExisting ? "Edit required deliverables" : "Set required deliverables"}
      </div>
      <div className="zx-note" style={{ marginBottom: 14 }}>
        Standard options for this track and stage -- toggle which apply, or add your own.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
        {templates.map((t) => {
          const isChecked = checked.has(t.name);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.name)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 11,
                padding: "10px 13px",
                borderRadius: "var(--radius-sm)",
                background: "var(--surface-card)",
                border: `1px solid ${isChecked ? "var(--sky-200)" : "var(--border-default)"}`,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                textAlign: "left",
                width: "100%",
              }}
            >
              <span
                style={{
                  width: 19,
                  height: 19,
                  borderRadius: 5,
                  flex: "none",
                  marginTop: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isChecked ? "var(--color-sky-blue)" : "transparent",
                  border: isChecked ? undefined : "2px solid var(--border-strong)",
                }}
              >
                {isChecked ? <CheckIcon size={11} /> : null}
              </span>
              <span style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, color: "var(--text-body)" }}>
                  {t.name}
                  {!t.isDefault ? (
                    <span style={{ marginLeft: 6, fontSize: 11, color: "var(--text-subtle)" }}>(optional)</span>
                  ) : null}
                </div>
                {t.description ? (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{t.description}</div>
                ) : null}
              </span>
            </button>
          );
        })}

        {customNames.map((name) => (
          <div
            key={name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "10px 13px",
              borderRadius: "var(--radius-sm)",
              background: "var(--surface-card)",
              border: "1px solid var(--sky-200)",
            }}
          >
            <span
              style={{
                width: 19,
                height: 19,
                borderRadius: 5,
                flex: "none",
                background: "var(--color-sky-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckIcon size={11} />
            </span>
            <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-body)" }}>
              {name} <span style={{ fontSize: 11, color: "var(--text-subtle)" }}>(custom)</span>
            </span>
            <button
              type="button"
              onClick={() => setCustomNames((prev) => prev.filter((n) => n !== name))}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                color: "var(--danger)",
                fontFamily: "var(--font-sans)",
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          className="zx-input"
          style={{ height: 36, fontSize: 13 }}
          placeholder="Add a custom deliverable…"
          value={customDraft}
          onChange={(e) => setCustomDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <button
          type="button"
          className="z-btn z-btn--secondary z-btn--sm"
          style={{ flex: "none" }}
          onClick={addCustom}
          disabled={!customDraft.trim()}
        >
          Add
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          type="button"
          className="z-btn z-btn--primary z-btn--sm"
          disabled={isPending || totalCount === 0}
          onClick={save}
        >
          Save deliverables ({totalCount})
        </button>
        <button type="button" className="z-btn z-btn--ghost z-btn--sm" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
