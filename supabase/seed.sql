-- Zidny Design Department Workflow Tool -- seed data
--
-- 1 admin, 3 clients, 4 freelancers (varied level/load/on-time), 5 projects
-- spanning all three tracks and all four package tiers, including:
--   - proj1: healthy in_progress, on-track deadline
--   - proj2: awaiting-review (stage in_review, meeting scheduled, not held)
--   - proj3: sent-back (stage back in_progress, one deliverable needs_rework,
--            historical meeting recorded with outcome = sent_back)
--   - proj4: overdue (in_progress, deadline in the past, nothing uploaded)
--   - proj5: completed (all 5 stages approved)
--
-- Fixed UUIDs are used throughout so every cross-table reference below is
-- readable without a round trip to the database.

-- =========================================================================
-- users
-- =========================================================================

insert into public.users (id, email, role, first_name, last_name, phone, is_active, email_verified) values
  ('10000000-0000-4000-8000-000000000001', 'admin@zidny.dz',        'admin',      'Sofiane', 'Bourenane', '0550000001', true, true),
  ('20000000-0000-4000-8000-000000000001', 'meriem.belkacem@client.dz', 'client', 'Meriem',  'Belkacem',  '0550000011', true, true),
  ('20000000-0000-4000-8000-000000000002', 'yacine.haddad@client.dz',   'client', 'Yacine',  'Haddad',    '0550000012', true, true),
  ('20000000-0000-4000-8000-000000000003', 'sarah.boukhalfa@client.dz', 'client', 'Sarah',   'Boukhalfa', '0550000013', true, true),
  ('30000000-0000-4000-8000-000000000001', 'amine.ferhat@freelance.dz', 'freelancer', 'Amine', 'Ferhat',  '0550000021', true, true),
  ('30000000-0000-4000-8000-000000000002', 'lina.cherif@freelance.dz',  'freelancer', 'Lina',  'Cherif',  '0550000022', true, true),
  ('30000000-0000-4000-8000-000000000003', 'karim.aouadi@freelance.dz', 'freelancer', 'Karim', 'Aouadi',  '0550000023', true, true),
  ('30000000-0000-4000-8000-000000000004', 'nadia.meziane@freelance.dz','freelancer', 'Nadia', 'Meziane', '0550000024', true, true);

-- =========================================================================
-- client_profiles
-- =========================================================================

insert into public.client_profiles (id, user_id, company_type, sector, wilaya, preferred_services, budget_range_min, budget_range_max, onboarding_completed) values
  ('21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Retail',       'Fashion',    'Alger',       '["brand"]'::jsonb,           150000, 400000, true),
  ('21000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'Tech Startup', 'SaaS',       'Oran',        '["uiux","campaign"]'::jsonb, 300000, 900000, true),
  ('21000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 'F&B',          'Restaurants','Constantine', '["campaign"]'::jsonb,        100000, 250000, true);

-- =========================================================================
-- freelancer_profiles
-- =========================================================================

insert into public.freelancer_profiles (id, user_id, headline, bio, wilaya, avatar_url, skills, daily_rate, availability, preferred_payout, vetting_status, internal_score, onboarding_completed) values
  ('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001',
   'Senior Brand & Identity Designer', 'Ten years building brand systems for retail and F&B clients across Algeria.',
   'Alger', 'https://example.com/avatars/amine.jpg',
   '[{"skill":"Brand Identity","level":"senior"},{"skill":"Illustration","level":"mid"}]'::jsonb,
   9000, 'full', 'baridi', 'approved', 8.5, true),

  ('31000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002',
   'Product Designer, UI/UX', 'Mid-level product designer focused on SaaS dashboards and mobile flows.',
   'Oran', 'https://example.com/avatars/lina.jpg',
   '[{"skill":"UI Design","level":"mid"},{"skill":"Prototyping","level":"mid"}]'::jsonb,
   7000, 'full', 'bank', 'approved', 7.2, true),

  ('31000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003',
   'Campaign & Motion Designer', 'Motion-first campaign designer, agency background.',
   'Constantine', 'https://example.com/avatars/karim.jpg',
   '[{"skill":"Motion Design","level":"senior"},{"skill":"Art Direction","level":"mid"}]'::jsonb,
   8000, 'part', 'baridi', 'approved', 6.0, true),

  ('31000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004',
   'Junior UI/UX Designer', 'Recently vetted, no deliveries yet -- available for new assignments.',
   'Alger', 'https://example.com/avatars/nadia.jpg',
   '[{"skill":"UI Design","level":"junior"}]'::jsonb,
   4000, 'weekend', 'baridi', 'approved', 7.8, true);

-- =========================================================================
-- freelancer_quality_scores (internal-only)
-- =========================================================================

insert into public.freelancer_quality_scores (id, freelancer_id, score, deliveries_count, on_time_rate, revision_rate, client_rating_avg) values
  ('32000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001', 4.6, 18, 0.94, 0.11, 4.7),
  ('32000000-0000-4000-8000-000000000002', '31000000-0000-4000-8000-000000000002', 4.1, 9,  0.78, 0.22, 4.2),
  ('32000000-0000-4000-8000-000000000003', '31000000-0000-4000-8000-000000000003', 3.2, 14, 0.61, 0.35, 3.4),
  ('32000000-0000-4000-8000-000000000004', '31000000-0000-4000-8000-000000000004', 0.0, 0,  0.0,  0.0,  0.0);

-- =========================================================================
-- projects
-- =========================================================================

insert into public.projects (id, client_id, freelancer_id, track, package_tier, current_stage, status, portal_payload, created_at) values
  ('40000000-0000-4000-8000-000000000001',
   '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001',
   'brand', 'starter', 3, 'active',
   '{"enquiry_source":"referral","brief_summary":"New boutique fashion label needs full brand identity.","onboarding_call_date":"2026-06-10","matched_at":"2026-06-14"}'::jsonb,
   '2026-06-08'),

  ('40000000-0000-4000-8000-000000000002',
   '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002',
   'uiux', 'premium', 4, 'active',
   '{"enquiry_source":"website","brief_summary":"SaaS dashboard redesign, mobile + desktop.","onboarding_call_date":"2026-05-20","matched_at":"2026-05-25"}'::jsonb,
   '2026-05-18'),

  ('40000000-0000-4000-8000-000000000003',
   '20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003',
   'campaign', 'everything', 3, 'active',
   '{"enquiry_source":"instagram","brief_summary":"Ramadan campaign for three restaurant locations.","onboarding_call_date":"2026-06-01","matched_at":"2026-06-05"}'::jsonb,
   '2026-05-30'),

  ('40000000-0000-4000-8000-000000000004',
   '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002',
   'uiux', 'rush', 3, 'active',
   '{"enquiry_source":"referral","brief_summary":"Rush landing page redesign ahead of a funding announcement.","onboarding_call_date":"2026-06-12","matched_at":"2026-06-13"}'::jsonb,
   '2026-06-12'),

  ('40000000-0000-4000-8000-000000000005',
   '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001',
   'brand', 'premium', 5, 'completed',
   '{"enquiry_source":"referral","brief_summary":"Full rebrand ahead of Series A.","onboarding_call_date":"2026-04-02","matched_at":"2026-04-05"}'::jsonb,
   '2026-03-30');

-- =========================================================================
-- stages -- 5 rows per project; stages 1-2 always locked (portal context)
-- =========================================================================

-- proj1: healthy, on-track, stage 3 in_progress
insert into public.stages (id, project_id, stage_number, name, status, deadline, submitted_at, approved_at) values
  ('50000000-0000-4000-8000-000000000101', '40000000-0000-4000-8000-000000000001', 1, 'Enquiry',                        'locked',      null, null, null),
  ('50000000-0000-4000-8000-000000000102', '40000000-0000-4000-8000-000000000001', 2, 'Onboarding & Matching',          'locked',      null, null, null),
  ('50000000-0000-4000-8000-000000000103', '40000000-0000-4000-8000-000000000001', 3, 'Strategy & Creative Direction',  'in_progress', '2026-07-15', null, null),
  ('50000000-0000-4000-8000-000000000104', '40000000-0000-4000-8000-000000000001', 4, 'Design & Production',           'locked',      null, null, null),
  ('50000000-0000-4000-8000-000000000105', '40000000-0000-4000-8000-000000000001', 5, 'Delivery & Handoff',            'locked',      null, null, null);

-- proj2: awaiting-review, stage 4 in_review (meeting scheduled, not held)
insert into public.stages (id, project_id, stage_number, name, status, deadline, submitted_at, approved_at) values
  ('50000000-0000-4000-8000-000000000201', '40000000-0000-4000-8000-000000000002', 1, 'Enquiry',                        'locked',    null,         null,          null),
  ('50000000-0000-4000-8000-000000000202', '40000000-0000-4000-8000-000000000002', 2, 'Onboarding & Matching',          'locked',    null,         null,          null),
  ('50000000-0000-4000-8000-000000000203', '40000000-0000-4000-8000-000000000002', 3, 'Strategy & Creative Direction',  'approved',  '2026-06-05', '2026-06-04',  '2026-06-05'),
  ('50000000-0000-4000-8000-000000000204', '40000000-0000-4000-8000-000000000002', 4, 'Design & Production',           'in_review', '2026-07-08', '2026-07-01',  null),
  ('50000000-0000-4000-8000-000000000205', '40000000-0000-4000-8000-000000000002', 5, 'Delivery & Handoff',            'locked',    null,         null,          null);

-- proj3: sent-back, stage 3 back in_progress after rework request
insert into public.stages (id, project_id, stage_number, name, status, deadline, submitted_at, approved_at) values
  ('50000000-0000-4000-8000-000000000301', '40000000-0000-4000-8000-000000000003', 1, 'Enquiry',                        'locked',      null, null, null),
  ('50000000-0000-4000-8000-000000000302', '40000000-0000-4000-8000-000000000003', 2, 'Onboarding & Matching',          'locked',      null, null, null),
  ('50000000-0000-4000-8000-000000000303', '40000000-0000-4000-8000-000000000003', 3, 'Strategy & Creative Direction',  'in_progress', '2026-07-12', null, null),
  ('50000000-0000-4000-8000-000000000304', '40000000-0000-4000-8000-000000000003', 4, 'Design & Production',           'locked',      null, null, null),
  ('50000000-0000-4000-8000-000000000305', '40000000-0000-4000-8000-000000000003', 5, 'Delivery & Handoff',            'locked',      null, null, null);

-- proj4: overdue, stage 3 in_progress, deadline already passed
insert into public.stages (id, project_id, stage_number, name, status, deadline, submitted_at, approved_at) values
  ('50000000-0000-4000-8000-000000000401', '40000000-0000-4000-8000-000000000004', 1, 'Enquiry',                        'locked',      null, null, null),
  ('50000000-0000-4000-8000-000000000402', '40000000-0000-4000-8000-000000000004', 2, 'Onboarding & Matching',          'locked',      null, null, null),
  ('50000000-0000-4000-8000-000000000403', '40000000-0000-4000-8000-000000000004', 3, 'Strategy & Creative Direction',  'in_progress', '2026-06-20', null, null),
  ('50000000-0000-4000-8000-000000000404', '40000000-0000-4000-8000-000000000004', 4, 'Design & Production',           'locked',      null, null, null),
  ('50000000-0000-4000-8000-000000000405', '40000000-0000-4000-8000-000000000004', 5, 'Delivery & Handoff',            'locked',      null, null, null);

-- proj5: completed, all 5 stages approved
insert into public.stages (id, project_id, stage_number, name, status, deadline, submitted_at, approved_at) values
  ('50000000-0000-4000-8000-000000000501', '40000000-0000-4000-8000-000000000005', 1, 'Enquiry',                        'locked',   null,         null,         null),
  ('50000000-0000-4000-8000-000000000502', '40000000-0000-4000-8000-000000000005', 2, 'Onboarding & Matching',          'locked',   null,         null,         null),
  ('50000000-0000-4000-8000-000000000503', '40000000-0000-4000-8000-000000000005', 3, 'Strategy & Creative Direction',  'approved', '2026-04-20', '2026-04-18', '2026-04-20'),
  ('50000000-0000-4000-8000-000000000504', '40000000-0000-4000-8000-000000000005', 4, 'Design & Production',           'approved', '2026-05-10', '2026-05-08', '2026-05-10'),
  ('50000000-0000-4000-8000-000000000505', '40000000-0000-4000-8000-000000000005', 5, 'Delivery & Handoff',            'approved', '2026-05-25', '2026-05-23', '2026-05-25');

-- =========================================================================
-- meetings -- only for stages that reached a review moment
-- =========================================================================

-- proj2 stage4: submitted, meeting scheduled but not yet held ("awaiting-review")
insert into public.meetings (id, stage_id, status, scheduled_at, held_at, outcome, notes) values
  ('70000000-0000-4000-8000-000000000201', '50000000-0000-4000-8000-000000000204',
   'scheduled', '2026-07-05 10:00:00+01', null, null, 'Design review call booked with client stakeholder.');

-- proj3 stage3: historical meeting that produced the sent_back outcome
insert into public.meetings (id, stage_id, status, scheduled_at, held_at, outcome, notes) values
  ('70000000-0000-4000-8000-000000000301', '50000000-0000-4000-8000-000000000303',
   'held', '2026-06-25 14:00:00+01', '2026-06-25 14:20:00+01', 'sent_back',
   'Concept deck does not match target-audience brief; rework requested with a younger demographic focus.');

-- proj5: one held/approved meeting per completed stage
insert into public.meetings (id, stage_id, status, scheduled_at, held_at, outcome, notes) values
  ('70000000-0000-4000-8000-000000000502', '50000000-0000-4000-8000-000000000503',
   'held', '2026-04-19 09:00:00+01', '2026-04-19 09:15:00+01', 'approved', 'Strategy approved, no changes requested.'),
  ('70000000-0000-4000-8000-000000000503', '50000000-0000-4000-8000-000000000504',
   'held', '2026-05-09 09:00:00+01', '2026-05-09 09:30:00+01', 'approved', 'Final logo suite approved.'),
  ('70000000-0000-4000-8000-000000000504', '50000000-0000-4000-8000-000000000505',
   'held', '2026-05-24 09:00:00+01', '2026-05-24 09:10:00+01', 'approved', 'Handoff package approved, project closed.');

-- Back-fill stages.meeting_id now that the meeting rows exist.
update public.stages set meeting_id = '70000000-0000-4000-8000-000000000201' where id = '50000000-0000-4000-8000-000000000204';
update public.stages set meeting_id = '70000000-0000-4000-8000-000000000301' where id = '50000000-0000-4000-8000-000000000303';
update public.stages set meeting_id = '70000000-0000-4000-8000-000000000502' where id = '50000000-0000-4000-8000-000000000503';
update public.stages set meeting_id = '70000000-0000-4000-8000-000000000503' where id = '50000000-0000-4000-8000-000000000504';
update public.stages set meeting_id = '70000000-0000-4000-8000-000000000504' where id = '50000000-0000-4000-8000-000000000505';

-- =========================================================================
-- deliverables -- checklist items in real, varied states
-- =========================================================================

-- proj1 stage3 (in_progress, on-track): mixed pending/uploaded
insert into public.deliverables (id, stage_id, name, type, file_url, link_url, status, rework_note) values
  ('60000000-0000-4000-8000-000000000101', '50000000-0000-4000-8000-000000000103', 'Moodboard',              'design',   'https://example.com/files/moodboard.pdf', null, 'uploaded', null),
  ('60000000-0000-4000-8000-000000000102', '50000000-0000-4000-8000-000000000103', 'Brand Positioning Doc',  'document', null, null, 'pending', null),
  ('60000000-0000-4000-8000-000000000103', '50000000-0000-4000-8000-000000000103', 'Color Palette',          'design',   'https://example.com/files/palette.pdf', null, 'uploaded', null);

-- proj2 stage3 (approved) + stage4 (in_review): all submitted, awaiting client/admin review
insert into public.deliverables (id, stage_id, name, type, file_url, link_url, status, rework_note) values
  ('60000000-0000-4000-8000-000000000201', '50000000-0000-4000-8000-000000000203', 'Creative Brief', 'document', 'https://example.com/files/brief.pdf', null, 'approved', null),
  ('60000000-0000-4000-8000-000000000202', '50000000-0000-4000-8000-000000000203', 'Moodboard',      'design',   'https://example.com/files/moodboard-uiux.pdf', null, 'approved', null),
  ('60000000-0000-4000-8000-000000000203', '50000000-0000-4000-8000-000000000204', 'UI Design System', 'design', 'https://example.com/files/design-system.fig', null, 'awaiting_review', null),
  ('60000000-0000-4000-8000-000000000204', '50000000-0000-4000-8000-000000000204', 'Prototype Link',   'link',   null, 'https://figma.com/proto/example', 'awaiting_review', null),
  ('60000000-0000-4000-8000-000000000205', '50000000-0000-4000-8000-000000000204', 'Interaction Spec', 'document', 'https://example.com/files/interaction-spec.pdf', null, 'awaiting_review', null);

-- proj3 stage3 (sent-back): one flagged needs_rework, one approved, one re-uploaded since
insert into public.deliverables (id, stage_id, name, type, file_url, link_url, status, rework_note) values
  ('60000000-0000-4000-8000-000000000301', '50000000-0000-4000-8000-000000000303', 'Campaign Concept Deck', 'design', 'https://example.com/files/concept-deck-v1.pdf', null, 'needs_rework',
   'Concept does not match target-audience brief -- please rework with a younger demographic focus.'),
  ('60000000-0000-4000-8000-000000000302', '50000000-0000-4000-8000-000000000303', 'Moodboard',             'design', 'https://example.com/files/moodboard-campaign.pdf', null, 'approved', null),
  ('60000000-0000-4000-8000-000000000303', '50000000-0000-4000-8000-000000000303', 'Tagline Options',       'document', 'https://example.com/files/taglines-v2.pdf', null, 'uploaded', null);

-- proj4 stage3 (overdue): nothing uploaded yet
insert into public.deliverables (id, stage_id, name, type, file_url, link_url, status, rework_note) values
  ('60000000-0000-4000-8000-000000000401', '50000000-0000-4000-8000-000000000403', 'Wireframes',  'design',   null, null, 'pending', null),
  ('60000000-0000-4000-8000-000000000402', '50000000-0000-4000-8000-000000000403', 'Style Guide', 'document', null, null, 'pending', null);

-- proj5 (completed): approved deliverables across stages 3-5
insert into public.deliverables (id, stage_id, name, type, file_url, link_url, status, rework_note) values
  ('60000000-0000-4000-8000-000000000501', '50000000-0000-4000-8000-000000000503', 'Brand Strategy Doc',        'document', 'https://example.com/files/strategy.pdf', null, 'approved', null),
  ('60000000-0000-4000-8000-000000000502', '50000000-0000-4000-8000-000000000504', 'Final Logo Suite',         'design',   'https://example.com/files/logo-suite.zip', null, 'approved', null),
  ('60000000-0000-4000-8000-000000000503', '50000000-0000-4000-8000-000000000505', 'Handoff Package (ZIP)',   'file',     'https://example.com/files/handoff.zip', null, 'approved', null);
