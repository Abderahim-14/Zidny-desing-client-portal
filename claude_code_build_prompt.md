# Claude Code build brief — Zidny Design Department Workflow Tool

## What we're building
An internal web app that tracks Zidny's Design Department creative-production projects **from Stage 3 (Strategy & Creative Direction) through Stage 5 (Delivery)**. It is the second of two tools: a separate **portal** (Django) already handles Stages 1–2 (enquiry, onboarding, freelancer matching). **We are building only this tool now, fully standalone** — no live connection to the portal yet. But it must be shaped so the portal hand-off drops in later without a rebuild.

**Stack:** Next.js 15 (App Router) + Supabase (Postgres, Auth, Storage, RLS) + Vercel. TypeScript throughout.

---

## Critical constraints (read first)

1. **Standalone now, integration-ready later.** No portal API calls. Projects enter via **seeded/mock data** for now. But all portal-owned reads (freelancer identity, quality scores, client profile) and the project hand-off must go through a **single adapter module** (`lib/portal/PortalClient.ts`) whose methods currently return local/seeded data. Later, those methods point at the real portal. Nothing else in the app may read portal-shaped data except through this adapter.

2. **Mirror the portal's schema conventions exactly** so the future join is trivial:
   - `users.id` is **UUID** — our `projects.client_id` and `projects.freelancer_id` are UUIDs referencing that shape.
   - Reuse the portal's **enum values verbatim**: role `client|freelancer|admin`; vetting/application status `pending|approved|rejected`; availability `full|part|weekend`; payout `baridi|bank`.
   - **Do not rebuild** freelancer identity or quality metrics as our own invented shape. Mirror the portal tables (below) as read-models so seeded data can later be swapped for real portal rows.

3. **We own the net-new half only.** The portal has NO project/stage/deliverable/meeting tables — those don't exist anywhere yet and are 100% ours. The portal's half (users, profiles, quality scores) we **mirror in shape** and seed locally.

---

## Portal-shape read-models (mirror these — seed locally, read via PortalClient)

These mirror the real portal tables. Model them in Supabase as our local representation; the adapter reads them now, swaps to portal later.

**users** — id (UUID PK), email, role (`client|freelancer|admin`), first_name, last_name, phone, is_active, email_verified, created_at, updated_at

**client_profiles** — user_id (FK→users, OneToOne), company_type, sector, wilaya, preferred_services (JSON list), budget_range_min (int, nullable), budget_range_max (int, nullable), onboarding_completed (bool)

**freelancer_profiles** — user_id (FK→users, OneToOne), headline, bio, wilaya, avatar_url, skills (JSON: `[{"skill":"React","level":"senior"}]`), daily_rate (int nullable), availability (`full|part|weekend`), vetting_status (`pending|approved|rejected`), internal_score (float), onboarding_completed (bool)

**freelancer_quality_scores** — freelancer_id (FK→freelancer_profiles, OneToOne), score (float 0–5), deliveries_count (int), on_time_rate (float), revision_rate (float), client_rating_avg (float), last_updated
  - *Internal-only — never exposed to client or freelancer roles.*
  - *NOTE: our tool is what generates on-time/delivery events. For now, compute and store locally. Later, these get written back to the portal via `PortalClient.sendDeliveryEvent()` — leave that method stubbed with a clear TODO.*

**portfolio_items** — id (UUID), freelancer_id (FK), title, description, file_url, link_url, media_type (`image|pdf|link`), order

---

## Our own schema (net-new — build in full)

**projects**
- id (UUID PK)
- client_id (UUID → users.id)
- freelancer_id (UUID → users.id, nullable until assigned)
- track (`brand|uiux|campaign`)
- package_tier (`starter|premium|everything|rush`)
- current_stage (int, 3–5)
- status (`active|paused|completed`)
- portal_payload (JSONB — the onboarding snapshot; seeded now, portal-fed later)
- created_at, updated_at

**stages** — 5 rows per project (1–2 exist as locked context, 3–5 active)
- id (UUID PK), project_id (FK→projects), stage_number (1–5), name
- status (`locked|in_progress|submitted|in_review|approved|sent_back`)
- deadline (date, nullable), submitted_at, approved_at
- meeting_id (FK→meetings, nullable)

**deliverables**
- id (UUID PK), stage_id (FK→stages), name, type
- file_url (Supabase Storage), link_url
- status (`pending|uploaded|awaiting_review|approved|needs_rework`)
- rework_note (text, nullable — agency's per-deliverable feedback)

**meetings**
- id (UUID PK), stage_id (FK→stages)
- status (`not_scheduled|scheduled|held`)
- scheduled_at, held_at
- outcome (`approved|sent_back`, nullable)
- notes (text)
- *email automation is a FUTURE hook — model the fields, leave sending stubbed*

---

## The stage state machine (the heart of the tool — implement exactly)

Per stage:
```
locked        → (portal context, stages 1–2, never editable)
in_progress   → freelancer uploads deliverables, can Submit when all complete
submitted     → freelancer pressed Submit; deliverables lock; agency notified
in_review     → agency scheduled/held the validation meeting
approved      → next stage unlocks & opens as in_progress
sent_back     → returns to in_progress on the SAME stage (no fee, no penalty)
```

**Hard rules (enforce in backend, not just UI):**
- A freelancer can **never** advance a stage. Only an admin `approve` transition unlocks the next stage.
- `approve` and `send_back` are only allowed when the stage's meeting is `held`.
- `send_back` may flag specific deliverables as `needs_rework` (with rework_note) and returns the stage to `in_progress`.
- Stages 1–2 are always `locked` and read-only.
- **No late fees anywhere.** On-time vs late is computed as a metric only (feeds quality scores), never a charge.

---

## Three roles & RLS (enforce at DB level via Supabase RLS, not UI-only)

- **admin** (Head of Design): sees all projects, all freelancers incl. quality scores; assigns freelancers; sets deadlines; reviews submissions; schedules/marks meetings; approve / send_back.
- **freelancer**: sees only projects where `freelancer_id = auth.uid()`; own progress; uploads + submits; **cannot** advance stages, see other freelancers, or see quality scores of others.
- **client**: sees only projects where `client_id = auth.uid()`; read-only progress + **approved** deliverables only; **never** sees freelancer identity, level, or any quality metric.

Write RLS policies for every table keyed on `auth.uid()` and role.

---

## Three views (compose from the locked design-system primitives)

I have the shared primitives already designed and token-locked. Build the UI from these — **do not invent styles or components**; reuse: stage-status chip (6 states incl. locked), track chip, freelancer level badge, submit/review controls, checklist item (pending/uploaded/awaiting_review/approved/needs_rework), file-upload block, deadline indicator (on-track/due-soon/overdue), load + on-time-rate element, progress bar.

**Build order — Admin first, then derive the other two as permission-reduced subsets:**

### 1. Admin view (richest — build fully)
- **All-projects dashboard**: dense table (client, track chip, freelancer, current stage, status chip, deadline w/ overdue indicator); filters by track/status/freelancer + overdue toggle; summary strip (active / awaiting-review / overdue counts); empty state.
- **Freelancer roster**: rows with level badge + load + on-time-rate; sortable by load & on-time; empty state.
- **Project detail**: header (client, track, freelancer+level, status); collapsible **read-only portal-context block** (Stage 1–2 onboarding — clearly locked); 5-stage vertical tracker (1–2 locked, 3–5 active); current-stage deliverables checklist in real states; per-stage deadline control.
- **Review panel**: shows submitted deliverables (locked, previewable); meeting control (schedule / mark-held); **approve & send-back disabled until meeting = held**; send-back flags per-deliverable needs_rework + note. Design the three moments: submitted-awaiting-meeting, meeting-held-ready, just-sent-back.

### 2. Freelancer view (derive: project detail minus admin controls, scoped to own projects)
- "My Projects" (active) + "Completed"; project detail with the 5-stage tracker; deliverable upload; **Submit stage** button (disabled until all deliverables complete); own progress + on-time history; sees a sent-back stage with flagged deliverables.

### 3. Client view (derive: read-only subset)
- Single project progress bar across 5 stages; per-stage deliverable previews **only once stage is approved**; sign-off acknowledgment; never sees freelancer/quality data.

---

## Seed data (so the app runs immediately)
Seed: ~3 clients (client_profiles), ~4 freelancers (freelancer_profiles + quality_scores, varied levels/load/on-time), and ~5 projects across all three tracks (brand/uiux/campaign) in different stages & states — including one overdue, one awaiting-review, one sent-back — so every state is visible without manual setup. Populate `portal_payload` with realistic onboarding JSON.

---

## The integration seam (build now, connect later)
Create `lib/portal/PortalClient.ts` as the ONLY module that touches portal-shaped data:
- `getFreelancer(userId)`, `listFreelancers()`, `getFreelancerQuality(userId)`
- `getClientProfile(userId)`
- `receiveProjectHandoff(payload)` → creates a project + its 5 stages from a portal onboarding payload (called by seed script now; by the portal later)
- `sendDeliveryEvent(freelancerId, {on_time, revision_count, stage})` → **stubbed with TODO**; later writes back to portal quality scores via portal API
Every method reads/writes local Supabase now. Document each with a `// PORTAL INTEGRATION:` TODO describing the future real call.

---

## Deliverables
1. Supabase migration SQL: portal-mirror tables + our tables + all enums + RLS policies.
2. Seed script populating the data above.
3. Next.js 15 app: three role-based views composed from the primitives.
4. `PortalClient` adapter with stubbed methods + integration TODOs.
5. State-machine logic in the backend (server actions / route handlers) enforcing the hard rules.
6. README: how to run, where the portal seam is, and the four integration points to wire later.

## Build order
1. Schema + enums + RLS + seed → confirm data layer works.
2. `PortalClient` adapter (stubbed).
3. State-machine server logic + tests for the transition rules.
4. Admin view → Freelancer view → Client view.

Start with the schema and seed. Show me the migration + seed before building UI so I can confirm the data layer.
