-- Zidny Design Department Workflow Tool
-- Migration 0001: portal-mirror tables + net-new workflow tables + enums + RLS
--
-- Scope per CLAUDE.md:
--   - Mirrors the portal's users/client_profiles/freelancer_profiles/
--     freelancer_quality_scores/portfolio_items shape verbatim (UUID ids,
--     portal enum values unchanged) so a later portal hand-off is a data
--     swap, not a rebuild. These are read-models: only lib/portal/PortalClient.ts
--     is allowed to touch them from application code.
--   - Adds the net-new projects/stages/deliverables/meetings tables that
--     belong entirely to this tool.
--   - RLS enforces the admin/freelancer/client read-isolation matrix at the
--     DB level. Mutations that must obey the stage state machine (approve,
--     send_back, submit, etc.) are enforced in backend server actions in a
--     later migration/build step, not by these policies -- RLS here is
--     read-isolation plus light defense-in-depth on writes.

create extension if not exists pgcrypto;

-- =========================================================================
-- Enums
-- =========================================================================

-- Portal-mirrored enums (values reused verbatim, never renamed/restyled)
create type user_role as enum ('client', 'freelancer', 'admin');
create type vetting_status as enum ('pending', 'approved', 'rejected');
create type availability_level as enum ('full', 'part', 'weekend');
create type payout_method as enum ('baridi', 'bank');
create type portfolio_media_type as enum ('image', 'pdf', 'link');

-- Net-new enums (this tool's domain)
create type project_track as enum ('brand', 'uiux', 'campaign');
create type package_tier as enum ('starter', 'premium', 'everything', 'rush');
create type project_status as enum ('active', 'paused', 'completed');
create type stage_status as enum ('locked', 'in_progress', 'submitted', 'in_review', 'approved', 'sent_back');
create type deliverable_status as enum ('pending', 'uploaded', 'awaiting_review', 'approved', 'needs_rework');
create type meeting_status as enum ('not_scheduled', 'scheduled', 'held');
create type meeting_outcome as enum ('approved', 'sent_back');

-- =========================================================================
-- Portal-mirror tables (read-models -- see lib/portal/PortalClient.ts)
-- =========================================================================

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role user_role not null,
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  phone varchar(20),
  is_active boolean not null default true,
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  company_type varchar(100),
  sector varchar(100),
  wilaya varchar(100),
  preferred_services jsonb not null default '[]'::jsonb,
  budget_range_min integer check (budget_range_min is null or budget_range_min >= 0),
  budget_range_max integer check (budget_range_max is null or budget_range_max >= 0),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.freelancer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  headline varchar(120),
  bio varchar(500),
  wilaya varchar(100),
  avatar_url text,
  skills jsonb not null default '[]'::jsonb,
  daily_rate integer check (daily_rate is null or daily_rate >= 0),
  availability availability_level,
  preferred_payout payout_method not null default 'baridi',
  vetting_status vetting_status not null default 'pending',
  vetting_note text,
  internal_score double precision not null default 0.0,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Internal-only. Never exposed to client or freelancer roles (not even the
-- freelancer's own score) -- see RLS policies below.
create table public.freelancer_quality_scores (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null unique references public.freelancer_profiles(id) on delete cascade,
  score double precision not null default 0.0 check (score between 0.0 and 5.0),
  deliveries_count integer not null default 0 check (deliveries_count >= 0),
  on_time_rate double precision not null default 0.0 check (on_time_rate between 0.0 and 1.0),
  revision_rate double precision not null default 0.0 check (revision_rate between 0.0 and 1.0),
  client_rating_avg double precision not null default 0.0 check (client_rating_avg between 0.0 and 5.0),
  last_updated timestamptz not null default now()
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.freelancer_profiles(id) on delete cascade,
  title varchar(200) not null,
  description varchar(500),
  file_url text,
  link_url text,
  media_type portfolio_media_type not null default 'link',
  "order" smallint not null default 0,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- Net-new workflow tables (ours in full)
-- =========================================================================

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id),
  freelancer_id uuid references public.users(id),
  track project_track not null,
  package_tier package_tier not null,
  current_stage smallint not null default 3 check (current_stage between 3 and 5),
  status project_status not null default 'active',
  portal_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- meeting_id FK is added after `meetings` exists (circular reference with stages).
create table public.stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_number smallint not null check (stage_number between 1 and 5),
  name text not null,
  status stage_status not null default 'locked',
  deadline date,
  submitted_at timestamptz,
  approved_at timestamptz,
  meeting_id uuid,
  unique (project_id, stage_number)
);

create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages(id) on delete cascade,
  name text not null,
  type text not null,
  file_url text,
  link_url text,
  status deliverable_status not null default 'pending',
  rework_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages(id) on delete cascade,
  status meeting_status not null default 'not_scheduled',
  scheduled_at timestamptz,
  held_at timestamptz,
  outcome meeting_outcome,
  -- email automation is a FUTURE hook: fields are modeled here, sending stays stubbed.
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stages
  add constraint stages_meeting_id_fkey
  foreign key (meeting_id) references public.meetings(id) on delete set null;

-- =========================================================================
-- Indexes
-- =========================================================================

create index idx_client_profiles_user_id on public.client_profiles(user_id);
create index idx_freelancer_profiles_user_id on public.freelancer_profiles(user_id);
create index idx_freelancer_quality_scores_freelancer_id on public.freelancer_quality_scores(freelancer_id);
create index idx_portfolio_items_freelancer_id on public.portfolio_items(freelancer_id);
create index idx_projects_client_id on public.projects(client_id);
create index idx_projects_freelancer_id on public.projects(freelancer_id);
create index idx_stages_project_id on public.stages(project_id);
create index idx_deliverables_stage_id on public.deliverables(stage_id);
create index idx_meetings_stage_id on public.meetings(stage_id);

-- =========================================================================
-- updated_at maintenance
-- =========================================================================

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.client_profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.freelancer_profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.deliverables
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.meetings
  for each row execute function public.set_updated_at();

-- =========================================================================
-- RLS helper
-- =========================================================================

-- SECURITY DEFINER so role lookups inside policies don't recurse back
-- through the `users` table's own RLS.
create function public.current_user_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

-- =========================================================================
-- RLS: users
-- =========================================================================

alter table public.users enable row level security;

create policy users_select_admin on public.users
  for select using (public.current_user_role() = 'admin');

create policy users_select_own on public.users
  for select using (id = auth.uid());

-- A freelancer may see the basic identity of clients on their own projects
-- (the reverse is forbidden: clients never see freelancer identity).
create policy users_select_own_project_client on public.users
  for select using (
    public.current_user_role() = 'freelancer'
    and id in (select client_id from public.projects where freelancer_id = auth.uid())
  );

create policy users_write_admin on public.users
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- =========================================================================
-- RLS: client_profiles (portal-owned, read-only mirror in this tool)
-- =========================================================================

alter table public.client_profiles enable row level security;

create policy client_profiles_select_admin on public.client_profiles
  for select using (public.current_user_role() = 'admin');

create policy client_profiles_select_own on public.client_profiles
  for select using (user_id = auth.uid());

-- =========================================================================
-- RLS: freelancer_profiles (portal-owned, read-only mirror in this tool)
-- =========================================================================

alter table public.freelancer_profiles enable row level security;

create policy freelancer_profiles_select_admin on public.freelancer_profiles
  for select using (public.current_user_role() = 'admin');

create policy freelancer_profiles_select_own on public.freelancer_profiles
  for select using (user_id = auth.uid());

-- Clients intentionally have no policy here: they must never see
-- freelancer identity, level, or quality data.

-- =========================================================================
-- RLS: freelancer_quality_scores (admin-only, always)
-- =========================================================================

alter table public.freelancer_quality_scores enable row level security;

create policy quality_scores_admin_only on public.freelancer_quality_scores
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- =========================================================================
-- RLS: portfolio_items
-- =========================================================================

alter table public.portfolio_items enable row level security;

create policy portfolio_items_select_admin on public.portfolio_items
  for select using (public.current_user_role() = 'admin');

create policy portfolio_items_select_own on public.portfolio_items
  for select using (
    freelancer_id in (select id from public.freelancer_profiles where user_id = auth.uid())
  );

create policy portfolio_items_write_own on public.portfolio_items
  for all using (
    freelancer_id in (select id from public.freelancer_profiles where user_id = auth.uid())
  )
  with check (
    freelancer_id in (select id from public.freelancer_profiles where user_id = auth.uid())
  );

-- =========================================================================
-- RLS: projects
-- =========================================================================

alter table public.projects enable row level security;

create policy projects_admin_all on public.projects
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy projects_select_freelancer on public.projects
  for select using (freelancer_id = auth.uid());

create policy projects_select_client on public.projects
  for select using (client_id = auth.uid());

-- =========================================================================
-- RLS: stages
-- =========================================================================

alter table public.stages enable row level security;

create policy stages_admin_all on public.stages
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy stages_select_freelancer on public.stages
  for select using (
    project_id in (select id from public.projects where freelancer_id = auth.uid())
  );

create policy stages_select_client on public.stages
  for select using (
    project_id in (select id from public.projects where client_id = auth.uid())
  );

-- No freelancer/client write policy: a freelancer can never advance a
-- stage, and clients are read-only. Stage transitions are enforced by
-- backend server actions (service role) per the state machine.

-- =========================================================================
-- RLS: deliverables
-- =========================================================================

alter table public.deliverables enable row level security;

create policy deliverables_admin_all on public.deliverables
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy deliverables_select_freelancer on public.deliverables
  for select using (
    stage_id in (
      select s.id from public.stages s
      join public.projects p on p.id = s.project_id
      where p.freelancer_id = auth.uid()
    )
  );

-- Clients only ever see approved deliverables.
create policy deliverables_select_client on public.deliverables
  for select using (
    status = 'approved'
    and stage_id in (
      select s.id from public.stages s
      join public.projects p on p.id = s.project_id
      where p.client_id = auth.uid()
    )
  );

-- Defense-in-depth: a freelancer may upload against their own project's
-- deliverables, but cannot self-approve or self-flag rework via direct
-- writes -- only pending/uploaded/awaiting_review are reachable this way.
-- The authoritative transition rules still live in backend server actions.
create policy deliverables_update_freelancer on public.deliverables
  for update using (
    stage_id in (
      select s.id from public.stages s
      join public.projects p on p.id = s.project_id
      where p.freelancer_id = auth.uid()
    )
  )
  with check (
    status in ('pending', 'uploaded', 'awaiting_review')
    and stage_id in (
      select s.id from public.stages s
      join public.projects p on p.id = s.project_id
      where p.freelancer_id = auth.uid()
    )
  );

-- =========================================================================
-- RLS: meetings (admin + freelancer read; clients never see meeting detail)
-- =========================================================================

alter table public.meetings enable row level security;

create policy meetings_admin_all on public.meetings
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy meetings_select_freelancer on public.meetings
  for select using (
    stage_id in (
      select s.id from public.stages s
      join public.projects p on p.id = s.project_id
      where p.freelancer_id = auth.uid()
    )
  );
