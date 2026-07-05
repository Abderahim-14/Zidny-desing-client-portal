"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StarIcon } from "@/components/primitives/icons";
import { upsertAdminReviewAction } from "@/app/admin/projects/[id]/review-actions";
import type { ProjectReviewRow } from "@/lib/data/admin";

// Feature 3: visibility here is admin-only for BOTH reviews -- this
// component only ever renders inside /admin/projects/[id], never anywhere
// a client or freelancer session could reach it. The client's own review
// UI lives separately under app/client/projects/[id].

export function ReviewsSection({
  projectId,
  clientReview,
  adminReview,
}: {
  projectId: string;
  clientReview: ProjectReviewRow | null;
  adminReview: ProjectReviewRow | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!adminReview);
  const [rating, setRating] = useState(adminReview?.rating ?? 0);
  const [notes, setNotes] = useState(adminReview?.feedback ?? "");
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await upsertAdminReviewAction(projectId, rating || null, notes || null);
        setEditing(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-sm)",
        padding: "24px 26px",
        marginTop: 16,
      }}
    >
      <div className="zx-lbl" style={{ marginBottom: 16 }}>
        Post-completion reviews
      </div>

      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 8 }}>
          Client review
        </div>
        {clientReview ? (
          <>
            <StarRow rating={clientReview.rating ?? 0} />
            {clientReview.feedback ? (
              <p style={{ fontSize: 13.5, color: "var(--text-body)", marginTop: 8, lineHeight: 1.5 }}>
                {clientReview.feedback}
              </p>
            ) : null}
          </>
        ) : (
          <span className="zx-note">No client review yet.</span>
        )}
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-strong)" }}>Admin review</div>
          {!editing ? (
            <button type="button" className="z-btn z-btn--ghost z-btn--sm" onClick={() => setEditing(true)}>
              Edit
            </button>
          ) : null}
        </div>

        {error ? <div style={{ color: "var(--danger)", fontSize: 12.5, marginTop: 6 }}>{error}</div> : null}

        {!editing && adminReview ? (
          <>
            <StarRow rating={adminReview.rating ?? 0} />
            {adminReview.feedback ? (
              <p style={{ fontSize: 13.5, color: "var(--text-body)", marginTop: 8, lineHeight: 1.5 }}>
                {adminReview.feedback}
              </p>
            ) : null}
          </>
        ) : editing ? (
          <div style={{ marginTop: 8 }}>
            <StarPicker value={rating} onChange={setRating} />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this project…"
              className="zx-input"
              style={{ height: 80, padding: "10px 14px", marginTop: 10, resize: "vertical" }}
            />
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button type="button" className="z-btn z-btn--primary z-btn--sm" disabled={isPending} onClick={save}>
                Save review
              </button>
              {adminReview ? (
                <button
                  type="button"
                  className="z-btn z-btn--ghost z-btn--sm"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <span className="zx-note">No admin review yet.</span>
        )}
      </div>
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} size={16} filled={n <= rating} />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
        >
          <StarIcon size={22} filled={n <= value} />
        </button>
      ))}
    </div>
  );
}
