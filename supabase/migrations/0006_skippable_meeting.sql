-- Zidny Design Department Workflow Tool
-- Migration 0006: skippable validation meeting (deliberate, logged bypass)
--
-- The "meeting must be held before approve/send-back" gate is NOT being
-- removed -- this adds a distinct, queryable 'skipped' state alongside
-- 'held', reached only through an explicit admin action
-- (lib/workflow/actions.ts skipMeeting(), next migration-adjacent change),
-- never a default. skipped_at/skipped_by let the audit trail always
-- distinguish "meeting held on date X" from "meeting skipped by admin Y" --
-- that distinction is the entire point of making the skip deliberate
-- rather than just leaving the meeting 'not_scheduled'.

alter type meeting_status add value 'skipped';

alter table public.meetings
  add column skipped_at timestamptz,
  add column skipped_by uuid references public.users(id);
