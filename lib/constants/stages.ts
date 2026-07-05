// Canonical 5-stage definition. Mirrors the rows supabase/seed.sql inserts
// by hand -- receiveProjectHandoff() below is the code path that creates
// these for real (seed data creates them directly in SQL for now).

export interface StageDefinition {
  stageNumber: 1 | 2 | 3 | 4 | 5;
  name: string;
}

export const STAGE_DEFINITIONS: readonly StageDefinition[] = [
  { stageNumber: 1, name: "Enquiry" },
  { stageNumber: 2, name: "Onboarding & Matching" },
  { stageNumber: 3, name: "Strategy & Creative Direction" },
  { stageNumber: 4, name: "Design & Production" },
  { stageNumber: 5, name: "Delivery & Handoff" },
] as const;

// Stages 1-2 are portal context and are always locked/read-only in this
// tool. Stage 3 is where a freshly handed-off project starts.
export const FIRST_ACTIVE_STAGE = 3;
