# Zidny Design Department Workflow Tool

Next.js 15 + Supabase tool tracking Design Department projects from Stage 3
(Strategy) through Stage 5 (Delivery). See `CLAUDE.md` for the binding
constraints and `claude_code_build_prompt.md` for the full build spec.

## Running locally

```
npm install
npm run dev
```

Requires `.env` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
and `SUPABASE_SERVICE_ROLE_KEY` for the target Supabase project. Apply
`supabase/migrations/*.sql` in order, then `supabase/seed.sql`.

## Local dev test accounts

Seeded users have matching Supabase Auth accounts (same UUID as their
`public.users.id`) so you can sign in and click through the app. All share
the password below -- **local/dev only, not a real credential**:

Password: `ZidnyDemo!2026`

| Role | Email |
|---|---|
| admin | admin@zidny.dz |
| client | meriem.belkacem@client.dz |
| client | yacine.haddad@client.dz |
| client | sarah.boukhalfa@client.dz |
| freelancer | amine.ferhat@freelance.dz |
| freelancer | lina.cherif@freelance.dz |
| freelancer | karim.aouadi@freelance.dz |
| freelancer | nadia.meziane@freelance.dz |

## The portal integration seam

`lib/portal/PortalClient.ts` is the only module allowed to touch
portal-shaped data (freelancer identity, quality scores, client profiles,
project hand-off). Every method today reads/writes the local Supabase
mirror; each is documented with a `// PORTAL INTEGRATION:` comment
describing the real call it becomes once the Django portal exists. Four
integration points to wire later:

1. `getFreelancer` / `listFreelancers` / `getFreelancerQuality` / `getClientProfile`
   -- point these at the portal's read APIs instead of the local mirror tables.
2. `receiveProjectHandoff` -- becomes the handler for an inbound webhook from
   the portal instead of being called by the seed script.
3. `sendDeliveryEvent` -- currently a stubbed no-op; wire it to POST delivery
   outcomes to the portal's quality-score endpoint.
4. RLS policies on the portal-mirror tables (`users`, `client_profiles`,
   `freelancer_profiles`, `freelancer_quality_scores`, `portfolio_items`) will
   need revisiting once those tables are fed by the real portal rather than
   local seed data.

## State machine

`lib/workflow/transitions.ts` is the pure stage-transition rule engine
(unit tested in `transitions.test.ts`); `lib/workflow/actions.ts` is the
Supabase-backed enforcement layer server actions call. Every action takes
an explicit `actorUserId` resolved via `lib/auth/current-actor.ts`
(`getCurrentActor`/`requireAdmin`), which is the only sanctioned way to
learn "who is calling" -- it re-derives the caller's role from the DB
session rather than trusting a client-supplied value.
