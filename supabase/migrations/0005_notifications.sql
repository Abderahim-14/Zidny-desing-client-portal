-- Zidny Design Department Workflow Tool
-- Migration 0005: in-app notifications
--
-- Notification rows are created only inside lib/workflow/actions.ts (one
-- code path alongside the workflow_actions_log audit write), never by a DB
-- trigger -- same pattern as every other workflow side effect. Visibility
-- is strictly per-recipient: unlike freelancer_quality_scores or
-- workflow_actions_log, admin does NOT get blanket access here -- a
-- notification is only ever meaningful to the user it was addressed to,
-- admin included when admin is the recipient.

create type notification_type as enum ('upload', 'submit', 'approve', 'rework');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.users(id) on delete cascade,
  type notification_type not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid references public.stages(id) on delete set null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_recipient_id on public.notifications(recipient_id, created_at desc);

alter table public.notifications enable row level security;

create policy notifications_select_own on public.notifications
  for select using (recipient_id = auth.uid());

-- Only the read flag is ever meant to change, and only by its own
-- recipient ("mark as read" / "mark all as read").
create policy notifications_update_own on public.notifications
  for update using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- No insert policy for any authenticated role: notifications are written
-- exclusively via the service-role client inside lib/workflow/actions.ts.
