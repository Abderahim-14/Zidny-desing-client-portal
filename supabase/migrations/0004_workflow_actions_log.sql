-- Zidny Design Department Workflow Tool
-- Migration 0004: workflow action audit trail
--
-- Feature 1 (admin stand-in for freelancer actions) requires that "who
-- actually performed it" is never lost. A single acted_by column on
-- stages/deliverables would only ever hold the LATEST actor -- a stage
-- passes through submit/schedule/hold/approve (and possibly send_back and
-- resubmit) across its lifetime, each potentially a different person, and
-- overwriting one column loses that history. An append-only log is the
-- only shape that satisfies "never lose who did it," so every workflow
-- action (not just admin-stand-in ones) gets a row here.
--
-- acted_as_role + on_behalf_of together make "submitted by freelancer X"
-- vs "submitted by admin on behalf" distinguishable: on_behalf_of is only
-- ever set when acted_as_role = 'admin' performs a freelancer-shaped
-- action (upload_deliverable / submit_stage) on an assigned project, and
-- is snapshotted at write time so it stays accurate even if the project's
-- freelancer assignment changes later.

create type workflow_action_type as enum (
  'upload_deliverable',
  'submit_stage',
  'schedule_meeting',
  'mark_meeting_held',
  'approve_stage',
  'send_back_stage',
  'set_stage_deadline'
);

create table public.workflow_actions_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid references public.stages(id) on delete set null,
  deliverable_id uuid references public.deliverables(id) on delete set null,
  action workflow_action_type not null,
  acted_by uuid not null references public.users(id),
  acted_as_role user_role not null,
  on_behalf_of uuid references public.users(id),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_workflow_actions_log_project_id on public.workflow_actions_log(project_id, created_at);
create index idx_workflow_actions_log_stage_id on public.workflow_actions_log(stage_id);

-- Internal audit data -- admin-only, same tier as freelancer_quality_scores.
-- No insert/update/delete policy for any authenticated role: every write
-- happens via the service-role client inside lib/workflow/actions.ts,
-- exactly like the state-machine mutations it's logging.
alter table public.workflow_actions_log enable row level security;

create policy workflow_actions_log_admin_select on public.workflow_actions_log
  for select using (public.current_user_role() = 'admin');
