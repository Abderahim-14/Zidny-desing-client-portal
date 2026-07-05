# CLAUDE.md — Zidny Design Department Workflow Tool

## What this is
Internal tool tracking Design Department projects from **Stage 3 (Strategy) through Stage 5 (Delivery)**. A separate Django **portal** owns Stages 1–2 (enquiry, onboarding, freelancer matching). We build **only this tool now, standalone** — no live portal connection — but shaped so the portal hand-off drops in later without a rebuild.

**Stack:** Next.js 15 (App Router) + Supabase (Postgres, Auth, Storage, RLS) + TypeScript. Vercel deploy.

## Non-negotiable constraints (apply on every change)

1. **Mirror the portal schema verbatim.** `projects.client_id` and `projects.freelancer_id` are **UUIDs** referencing the portal's `users.id` shape. Reuse portal enum values exactly — never rename or restyle them:
   - role: `client | freelancer | admin`
   - vetting/application status: `pending | approved | rejected`
   - availability: `full | part | weekend`
   - payout: `baridi | bank`

2. **All portal-shaped data goes through `lib/portal/PortalClient.ts` — the ONLY module allowed to touch it.** Freelancer identity, quality scores, client profiles, and the project hand-off are read/written only via this adapter. Today its methods hit local/seeded Supabase; later they point at the real portal. Nothing else in the app reads portal-shaped tables directly.
   - Writes to our **local mirror** of portal-shaped tables are allowed through PortalClient — that data is ours to maintain until the real hand-off lands. `recordDeliveryOutcome(freelancerId, {on_time, revision_count, stage})` recomputes `freelancer_quality_scores` locally; the state machine calls it on stage `approve`/`send_back`.
   - `sendDeliveryEvent()` is a separate **stub with a `// PORTAL INTEGRATION:` TODO** — its only job is the future cross-boundary write to the portal's real, remote table, and it stays a no-op until that integration exists. We do not write to the portal's own tables.

3. **The stage state machine is the single source of truth. Enforce it in the backend, never UI-only.** Per stage:
   `locked → in_progress → submitted → in_review → approved | sent_back`
   - A **freelancer can never advance a stage.** Only an admin `approve` unlocks the next stage.
   - `approve` and `send_back` are legal **only when the stage's meeting = held**.
   - `send_back` flags specific deliverables as `needs_rework` (+ note) and returns the stage to `in_progress` on the **same stage**.
   - Stages 1–2 are always `locked` / read-only (portal context).
   - **No late fees anywhere.** On-time vs late is a metric only (feeds quality scores), never a charge.

4. **RLS enforces role isolation at the DB level, not just the UI.** Every table has policies keyed on `auth.uid()` + role:
   - admin: sees all projects + all freelancers incl. quality scores.
   - freelancer: only projects where `freelancer_id = auth.uid()`; never other freelancers or quality scores.
   - client: only projects where `client_id = auth.uid()`; read-only; only **approved** deliverables; never freelancer identity/level/quality data.

5. **Compose UI only from the rebuilt design primitives.** Do not invent colors, type, spacing, or components. Reuse: stage-status chip (incl. locked), track chip, freelancer level badge, submit/review controls, checklist item (pending/uploaded/awaiting_review/approved/needs_rework), file-upload block, deadline indicator (on-track/due-soon/overdue), load + on-time-rate element, progress bar. If a layout needs something the primitives don't cover, ask — don't improvise.

6. **Build order (bottom-up, verify each layer before the next):**
   schema + enums + RLS + seed → **STOP for confirmation** → PortalClient (stubbed) → state-machine logic + transition tests → admin UI (from rebuilt pages) → derive Freelancer + Client views down per the permission matrix.

## Design source files
- `Zidny Workflow - Primitives.dc.html` and `Zidny Workflow - Admin.dc.html` are the **exact visual/token reference** — rebuild them as React components matching styling precisely.
- **Ignore** the print variant, the standalone `.html`, and `support.js` as app source (Claude Design runtime, not our code).

## Reference docs
- `claude_code_build_prompt.md` — full build spec.
- `DB_schema.docx` — portal table shapes to mirror.
- CDC (if present) — section 4.1 permission matrix, section 12 schema, acceptance criteria.
