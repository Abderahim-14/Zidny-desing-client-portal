-- Zidny Design Department Workflow Tool
-- Migration 0008: deliverable templates (standard-options menu)
--
-- Two layers, kept deliberately separate:
--   - deliverable_templates: a seeded, read-only reference menu keyed by
--     track + stage_number ("standard options to choose from").
--   - deliverables (existing, migration 0001): the actual required
--     deliverables for one project's stage, created when the admin picks
--     from the template + adds custom ones. Nothing here changes that
--     table's shape -- setStageDeliverables() (lib/workflow/actions.ts)
--     just creates/deletes plain deliverables rows from a chosen name list.
--
-- Also adds the two enum values the backend logic needs: a distinct
-- workflow_actions_log action for defining a stage's deliverables, and a
-- notification type so the freelancer is told when they can start.

create table public.deliverable_templates (
  id uuid primary key default gen_random_uuid(),
  track project_track not null,
  stage_number smallint not null check (stage_number between 3 and 5),
  name text not null,
  description text,
  is_default boolean not null default true,
  sort_order smallint not null default 0
);

create index idx_deliverable_templates_track_stage on public.deliverable_templates(track, stage_number, sort_order);

-- Read-only reference data: any authenticated role may read it (it's just
-- a menu, not project data), nothing may write it via the app -- seed only.
alter table public.deliverable_templates enable row level security;

create policy deliverable_templates_select_all on public.deliverable_templates
  for select using (auth.uid() is not null);

alter type workflow_action_type add value 'set_stage_deliverables';
alter type notification_type add value 'deliverables_defined';

-- =========================================================================
-- Seed: standard deliverables per track + stage
-- =========================================================================

insert into public.deliverable_templates (track, stage_number, name, description, is_default, sort_order) values
  -- Brand -- Stage 3: Strategy & Direction
  ('brand', 3, 'Research doc', 'brand context/audience/competitor/goals', true, 1),
  ('brand', 3, 'Strategy document', 'values/audience/positioning', true, 2),
  ('brand', 3, 'Two Pinterest mood boards', null, true, 3),
  ('brand', 3, 'Strategy & direction presentation', null, true, 4),

  -- Brand -- Stage 4: Design
  ('brand', 4, 'Concept design per package', null, true, 1),
  ('brand', 4, 'Brand presentation', 'elements + mockups + rationale', true, 2),
  ('brand', 4, 'Packaging mockups', null, false, 3),
  ('brand', 4, 'Social media templates', null, false, 4),
  ('brand', 4, 'Printing files', null, false, 5),
  ('brand', 4, 'Signage', null, false, 6),

  -- Brand -- Stage 5: Delivery
  ('brand', 5, 'Brand guidelines document', null, true, 1),
  ('brand', 5, 'Logo files', 'all formats', true, 2),
  ('brand', 5, 'Collateral & applications', null, true, 3),
  ('brand', 5, 'Touch-point files', null, false, 4),

  -- UI/UX -- Stage 3: Research & Direction
  ('uiux', 3, 'Audit of existing product', 'heuristic analysis', false, 1),
  ('uiux', 3, 'Functionality prioritization', null, true, 2),
  ('uiux', 3, 'Competitor analysis', 'feature-by-feature', true, 3),
  ('uiux', 3, 'User personas + user flow', null, true, 4),
  ('uiux', 3, 'Sitemap + critical screen mapping', null, true, 5),
  ('uiux', 3, 'Research & direction presentation', null, true, 6),

  -- UI/UX -- Stage 4: Design
  ('uiux', 4, 'Design system', 'typography/color/components, all states', true, 1),
  ('uiux', 4, 'Hi-fi screens', null, true, 2),
  ('uiux', 4, 'Landing page', 'tied to goal', false, 3),
  ('uiux', 4, 'Prototype', 'clickable', false, 4),

  -- UI/UX -- Stage 5: Delivery
  ('uiux', 5, 'Figma file', null, true, 1),
  ('uiux', 5, 'Design system + components', null, true, 2),
  ('uiux', 5, 'Assets', null, true, 3),
  ('uiux', 5, 'Dev handoff materials', null, true, 4),

  -- Campaign -- Stage 3: Strategy & Direction
  ('campaign', 3, 'Audience + platform research', null, true, 1),
  ('campaign', 3, 'Competitor content audit', null, true, 2),
  ('campaign', 3, 'Campaign concept & angle', null, true, 3),
  ('campaign', 3, 'Content pillars / themes', null, true, 4),
  ('campaign', 3, 'Tone & visual direction', 'reference board', true, 5),
  ('campaign', 3, 'Volume + cadence plan', null, true, 6),
  ('campaign', 3, 'Direction deck', null, true, 7),

  -- Campaign -- Stage 4: Production
  ('campaign', 4, 'Content calendar', 'dates/formats/hooks', true, 1),
  ('campaign', 4, 'Batch-produced assets', 'per volume plan', true, 2),
  ('campaign', 4, 'Copywriting', 'captions/CTAs/hashtags', true, 3),
  ('campaign', 4, 'Internal QC pass', null, true, 4),

  -- Campaign -- Stage 5: Delivery
  ('campaign', 5, 'Final files', 'print-ready or source+exports', true, 1),
  ('campaign', 5, 'Publishing / scheduling plan', null, false, 2),
  ('campaign', 5, 'Packaged handover', null, true, 3);
