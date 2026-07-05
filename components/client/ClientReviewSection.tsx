"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StarIcon } from "@/components/primitives/icons";
import { submitClientReviewAction } from "@/app/client/projects/[id]/actions";

// Feature 3, client side: after submitting, this never shows the admin's
// review or any aggregate -- only its own "review submitted" confirmation.
export function ClientReviewSection({
  projectId,
  existingReview,
}: {
  projectId: string;
  existingReview: { rating: number; feedback: string | null } | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(Boolean(existingReview));

  if (submitted) {
    return (
      <div
        style={{
          padding: "20px 22px",
          borderRadius: "var(--radius-lg)",
          background: "var(--success-soft)",
          border: "1px solid #BFE9D6",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--success)" }}>Review submitted</div>
        <div style={{ fontSize: 13, color: "#177A54", marginTop: 4 }}>
          Thanks for the feedback -- your review has been recorded.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px 22px",
        borderRadius: "var(--radius-lg)",
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-strong)", marginBottom: 4 }}>
        Leave a review
      </div>
      <div className="zx-note" style={{ marginBottom: 14 }}>
        Your project is complete -- let us know how it went.
      </div>
      {error ? <div style={{ color: "var(--danger)", fontSize: 12.5, marginBottom: 10 }}>{error}</div> : null}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
          >
            <StarIcon size={26} filled={n <= rating} />
          </button>
        ))}
      </div>
      <textarea
        className="zx-input"
        style={{ height: 90, padding: "10px 14px", resize: "vertical" }}
        placeholder="Tell us about your experience…"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          className="z-btn z-btn--primary"
          disabled={isPending || rating === 0}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await submitClientReviewAction(projectId, rating, feedback || null);
                setSubmitted(true);
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Something went wrong.");
              }
            });
          }}
        >
          Submit review
        </button>
      </div>
    </div>
  );
}
