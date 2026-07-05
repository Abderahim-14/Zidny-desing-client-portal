-- Zidny Design Department Workflow Tool
-- Migration 0007: workflow_actions_log needs a distinct action for skips
--
-- Gap in migration 0006: skipMeeting() logs to workflow_actions_log like
-- every other workflow action (lib/workflow/actions.ts logAction()), but
-- workflow_action_type (migration 0004) has no value for it. Reusing an
-- existing action (e.g. 'mark_meeting_held' with a detail flag) would blur
-- exactly the distinction this feature exists to preserve -- "meeting held
-- on date X" vs "meeting skipped by admin Y" needs to be a clean filter on
-- `action`, not something buried in a JSONB detail column.

alter type workflow_action_type add value 'skip_meeting';
