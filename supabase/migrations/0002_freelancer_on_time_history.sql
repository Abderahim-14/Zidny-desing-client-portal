-- Zidny Design Department Workflow Tool
-- Migration 0002: freelancer own on-time history + portal-integration notes
--
-- Decision: claude_code_build_prompt.md requires the freelancer view to show
-- "own progress + on-time history". CLAUDE.md's RLS matrix forbids a
-- freelancer from seeing *other* freelancers or their quality scores, but
-- does not forbid seeing their own on-time rate. freelancer_quality_scores
-- stays admin-only in full via its existing RLS policy -- the composite
-- `score`, `revision_rate`, and `client_rating_avg` are internal ranking
-- inputs (DB_schema.docx: "Internal-only -- never exposed to clients or
-- freelancers") and remain hidden from freelancers. This function carves
-- out only the on-time-history slice the freelancer view needs, scoped to
-- the caller's own row, without weakening the base table's RLS.

create function public.freelancer_own_on_time_history()
returns table (
  deliveries_count integer,
  on_time_rate double precision,
  last_updated timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select q.deliveries_count, q.on_time_rate, q.last_updated
  from public.freelancer_quality_scores q
  join public.freelancer_profiles fp on fp.id = q.freelancer_id
  where fp.user_id = auth.uid();
$$;

revoke all on function public.freelancer_own_on_time_history() from public;
grant execute on function public.freelancer_own_on_time_history() to authenticated;

-- Portal-integration note: DB_schema.docx lists baridi_rib / bank_rib
-- (payout account numbers) on the portal's freelancer_profiles table.
-- They are intentionally omitted from this mirror -- nothing in this
-- tool's stage workflow reads them -- but must be added back (as
-- portal-owned, read-only fields surfaced via PortalClient) once the real
-- portal hand-off lands, since preferred_payout alone isn't enough to
-- actually pay a freelancer.
comment on table public.freelancer_profiles is
  'Portal-mirror read-model. Omits baridi_rib/bank_rib payout account numbers present on the portal''s freelancer_profiles table (see DB_schema.docx) -- add them via PortalClient when live portal integration lands; not needed for the stage workflow this tool owns.';

comment on column public.freelancer_profiles.preferred_payout is
  'Payout method only (baridi|bank). The actual RIB/account number lives on the portal and is intentionally not mirrored here yet.';
