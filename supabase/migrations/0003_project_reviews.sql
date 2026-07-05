-- Zidny Design Department Workflow Tool
-- Migration 0003: post-completion project reviews
--
-- One client review + one admin review per completed project.
-- Visibility is admin-only for BOTH reviews: a client may insert and read
-- only their own row; a freelancer has no access at all (no policy = deny
-- under RLS). Ratings feed freelancer_quality_scores.client_rating_avg via
-- PortalClient.recomputeClientRatingAverage() -- a local-mirror write,
-- allowed per CLAUDE.md #2.

create type reviewer_role as enum ('client', 'admin');

create table public.project_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  reviewer_id uuid not null references public.users(id),
  reviewer_role reviewer_role not null,
  rating smallint check (rating is null or rating between 1 and 5),
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, reviewer_role),
  -- Client review requires a rating; admin may leave rating-less internal notes.
  constraint project_reviews_client_rating_required
    check (reviewer_role <> 'client' or rating is not null)
);

create index idx_project_reviews_project_id on public.project_reviews(project_id);

create trigger set_updated_at before update on public.project_reviews
  for each row execute function public.set_updated_at();

alter table public.project_reviews enable row level security;

create policy project_reviews_admin_all on public.project_reviews
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- "never see the admin's [review]" is satisfied by this alone: a client's
-- own reviewer_id never matches the admin review's reviewer_id.
create policy project_reviews_select_own_client on public.project_reviews
  for select using (reviewer_id = auth.uid());

create policy project_reviews_insert_client on public.project_reviews
  for insert with check (
    public.current_user_role() = 'client'
    and reviewer_id = auth.uid()
    and reviewer_role = 'client'
    and project_id in (
      select id from public.projects where client_id = auth.uid() and status = 'completed'
    )
  );

-- No update/delete policy for clients: once submitted, a client review is
-- locked (matches the "review submitted" confirmation UI, not an editable
-- draft). No policy at all for freelancers -- default deny.
