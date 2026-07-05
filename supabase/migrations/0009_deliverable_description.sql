-- Zidny Design Department Workflow Tool
-- Migration 0009: carry deliverable_templates.description onto deliverables
--
-- 0008 shipped without this: a template's description (e.g. "brand
-- context/audience/competitor/goals") only informed the admin while
-- picking, then was dropped -- the freelancer never saw it on the actual
-- checklist item. This column lets setStageDeliverables() carry it over.

alter table public.deliverables
  add column description text;
