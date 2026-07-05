import { describe, expect, it } from "vitest";
import {
  WorkflowError,
  assertCanApproveStage,
  assertCanMarkMeetingHeld,
  assertCanScheduleMeeting,
  assertCanSendBackStage,
  assertCanSetStageDeliverables,
  assertCanSkipMeeting,
  assertCanSubmitStage,
  assertCanUploadDeliverable,
  nextStageNumber,
  wasSubmittedOnTime,
  type DeliverableStatus,
} from "./transitions";

describe("assertCanSetStageDeliverables", () => {
  const base = {
    actorRole: "admin" as const,
    stageStatus: "in_progress" as const,
    stageNumber: 3,
    names: ["Moodboard"],
  };

  it("allows an admin to set deliverables while in_progress", () => {
    expect(() => assertCanSetStageDeliverables(base)).not.toThrow();
  });

  it("allows setting deliverables up-front while the stage is still locked", () => {
    expect(() => assertCanSetStageDeliverables({ ...base, stageStatus: "locked" })).not.toThrow();
  });

  it("rejects non-admins", () => {
    expect(() => assertCanSetStageDeliverables({ ...base, actorRole: "freelancer" })).toThrow(
      WorkflowError
    );
    expect(() => assertCanSetStageDeliverables({ ...base, actorRole: "client" })).toThrow(
      WorkflowError
    );
  });

  it("rejects once the stage has moved past in_progress", () => {
    for (const stageStatus of ["submitted", "in_review", "approved"] as const) {
      expect(() => assertCanSetStageDeliverables({ ...base, stageStatus })).toThrow(WorkflowError);
    }
  });

  it("rejects stages 1-2", () => {
    expect(() => assertCanSetStageDeliverables({ ...base, stageNumber: 1 })).toThrow(WorkflowError);
  });

  it("rejects an empty deliverable list -- a stage can't require nothing", () => {
    expect(() => assertCanSetStageDeliverables({ ...base, names: [] })).toThrow(
      /at least one required deliverable/
    );
  });
});

describe("assertCanUploadDeliverable", () => {
  it("allows upload while the stage is in_progress", () => {
    expect(() =>
      assertCanUploadDeliverable({ stageStatus: "in_progress", stageNumber: 3 })
    ).not.toThrow();
  });

  it("rejects stages 1-2 as always locked", () => {
    expect(() =>
      assertCanUploadDeliverable({ stageStatus: "in_progress", stageNumber: 1 })
    ).toThrow(WorkflowError);
    expect(() =>
      assertCanUploadDeliverable({ stageStatus: "in_progress", stageNumber: 2 })
    ).toThrow(WorkflowError);
  });

  it("rejects upload once the stage has moved past in_progress", () => {
    expect(() =>
      assertCanUploadDeliverable({ stageStatus: "submitted", stageNumber: 3 })
    ).toThrow(WorkflowError);
  });
});

describe("assertCanSubmitStage", () => {
  function makeParams(overrides: {
    actorRole?: "admin" | "freelancer" | "client";
    stageStatus?: "locked" | "in_progress" | "submitted" | "in_review" | "approved" | "sent_back";
    stageNumber?: number;
    deliverableStatuses?: DeliverableStatus[];
  } = {}) {
    return {
      actorRole: overrides.actorRole ?? ("freelancer" as const),
      stageStatus: overrides.stageStatus ?? ("in_progress" as const),
      stageNumber: overrides.stageNumber ?? 3,
      deliverableStatuses: overrides.deliverableStatuses ?? ["uploaded", "uploaded"],
    };
  }

  it("allows submit when all deliverables are uploaded", () => {
    expect(() => assertCanSubmitStage(makeParams())).not.toThrow();
  });

  it("allows admin as a stand-in for the freelancer (permission widening, not a rule bypass)", () => {
    expect(() => assertCanSubmitStage(makeParams({ actorRole: "admin" }))).not.toThrow();
  });

  it("still blocks a client outright", () => {
    expect(() => assertCanSubmitStage(makeParams({ actorRole: "client" }))).toThrow(
      /Only the assigned freelancer or an admin/
    );
  });

  it("admin stand-in still can't skip the all-uploaded gate", () => {
    expect(() =>
      assertCanSubmitStage(makeParams({ actorRole: "admin", deliverableStatuses: ["uploaded", "pending"] }))
    ).toThrow(/must be uploaded/);
  });

  it("rejects submit if any deliverable is not yet uploaded", () => {
    expect(() =>
      assertCanSubmitStage(makeParams({ deliverableStatuses: ["uploaded", "pending"] }))
    ).toThrow(/must be uploaded/);
    expect(() =>
      assertCanSubmitStage(makeParams({ deliverableStatuses: ["uploaded", "needs_rework"] }))
    ).toThrow(WorkflowError);
  });

  it("rejects submit with no deliverables at all", () => {
    expect(() => assertCanSubmitStage(makeParams({ deliverableStatuses: [] }))).toThrow(
      /no deliverables/
    );
  });

  it("rejects submit for stages 1-2", () => {
    expect(() => assertCanSubmitStage(makeParams({ stageNumber: 2 }))).toThrow(WorkflowError);
  });

  it("rejects submit unless the stage is in_progress", () => {
    for (const stageStatus of ["locked", "submitted", "in_review", "approved", "sent_back"] as const) {
      expect(() => assertCanSubmitStage(makeParams({ stageStatus }))).toThrow(WorkflowError);
    }
  });
});

describe("assertCanScheduleMeeting", () => {
  it("allows an admin to schedule from submitted or in_review", () => {
    expect(() =>
      assertCanScheduleMeeting({ actorRole: "admin", stageStatus: "submitted" })
    ).not.toThrow();
    expect(() =>
      assertCanScheduleMeeting({ actorRole: "admin", stageStatus: "in_review" })
    ).not.toThrow();
  });

  it("rejects non-admins", () => {
    expect(() =>
      assertCanScheduleMeeting({ actorRole: "freelancer", stageStatus: "submitted" })
    ).toThrow(WorkflowError);
  });

  it("rejects scheduling from in_progress", () => {
    expect(() =>
      assertCanScheduleMeeting({ actorRole: "admin", stageStatus: "in_progress" })
    ).toThrow(WorkflowError);
  });
});

describe("assertCanMarkMeetingHeld", () => {
  it("allows an admin to mark a scheduled meeting held", () => {
    expect(() =>
      assertCanMarkMeetingHeld({ actorRole: "admin", meetingStatus: "scheduled" })
    ).not.toThrow();
  });

  it("rejects marking held from not_scheduled or already-held", () => {
    expect(() =>
      assertCanMarkMeetingHeld({ actorRole: "admin", meetingStatus: "not_scheduled" })
    ).toThrow(WorkflowError);
    expect(() =>
      assertCanMarkMeetingHeld({ actorRole: "admin", meetingStatus: "held" })
    ).toThrow(WorkflowError);
  });

  it("rejects non-admins", () => {
    expect(() =>
      assertCanMarkMeetingHeld({ actorRole: "freelancer", meetingStatus: "scheduled" })
    ).toThrow(WorkflowError);
  });
});

describe("assertCanApproveStage -- a freelancer can never advance a stage", () => {
  const base = {
    actorRole: "admin" as const,
    stageStatus: "in_review" as const,
    meetingStatus: "held" as const,
    stageNumber: 3,
  };

  it("allows approve only for an admin, with the meeting held, from in_review", () => {
    expect(() => assertCanApproveStage(base)).not.toThrow();
  });

  it("rejects a freelancer or client outright", () => {
    expect(() => assertCanApproveStage({ ...base, actorRole: "freelancer" })).toThrow(
      /A freelancer can never advance a stage/
    );
    expect(() => assertCanApproveStage({ ...base, actorRole: "client" })).toThrow(WorkflowError);
  });

  it("rejects approve unless the meeting has been held or skipped", () => {
    expect(() => assertCanApproveStage({ ...base, meetingStatus: "scheduled" })).toThrow(
      /meeting has been held/
    );
    expect(() => assertCanApproveStage({ ...base, meetingStatus: "not_scheduled" })).toThrow(
      WorkflowError
    );
    expect(() => assertCanApproveStage({ ...base, meetingStatus: null })).toThrow(WorkflowError);
  });

  it("allows approve when the meeting was explicitly skipped instead of held", () => {
    expect(() => assertCanApproveStage({ ...base, meetingStatus: "skipped" })).not.toThrow();
  });

  it("rejects approve unless the stage is in_review", () => {
    expect(() => assertCanApproveStage({ ...base, stageStatus: "submitted" })).toThrow(
      WorkflowError
    );
  });

  it("rejects approve for stages 1-2", () => {
    expect(() => assertCanApproveStage({ ...base, stageNumber: 1 })).toThrow(WorkflowError);
  });
});

describe("assertCanSendBackStage -- returns the stage to in_progress on the same stage", () => {
  const base = {
    actorRole: "admin" as const,
    stageStatus: "in_review" as const,
    meetingStatus: "held" as const,
    stageNumber: 3,
    flaggedDeliverableIds: ["d1"],
  };

  it("allows send_back only for an admin, with the meeting held, from in_review, with a flagged deliverable", () => {
    expect(() => assertCanSendBackStage(base)).not.toThrow();
  });

  it("rejects a freelancer outright", () => {
    expect(() => assertCanSendBackStage({ ...base, actorRole: "freelancer" })).toThrow(
      /A freelancer can never advance a stage/
    );
  });

  it("rejects send_back unless the meeting has been held or skipped", () => {
    expect(() => assertCanSendBackStage({ ...base, meetingStatus: "scheduled" })).toThrow(
      /meeting has been held/
    );
    expect(() => assertCanSendBackStage({ ...base, meetingStatus: "not_scheduled" })).toThrow(
      WorkflowError
    );
  });

  it("allows send_back when the meeting was explicitly skipped instead of held", () => {
    expect(() =>
      assertCanSendBackStage({ ...base, meetingStatus: "skipped" })
    ).not.toThrow();
  });

  it("rejects send_back with no flagged deliverables", () => {
    expect(() => assertCanSendBackStage({ ...base, flaggedDeliverableIds: [] })).toThrow(
      /at least one flagged deliverable/
    );
  });

  it("rejects send_back for stages 1-2", () => {
    expect(() => assertCanSendBackStage({ ...base, stageNumber: 2 })).toThrow(WorkflowError);
  });
});

describe("assertCanSkipMeeting -- deliberate, admin-only gate bypass", () => {
  it("allows an admin to skip from submitted or in_review", () => {
    expect(() => assertCanSkipMeeting({ actorRole: "admin", stageStatus: "submitted" })).not.toThrow();
    expect(() => assertCanSkipMeeting({ actorRole: "admin", stageStatus: "in_review" })).not.toThrow();
  });

  it("rejects non-admins", () => {
    expect(() => assertCanSkipMeeting({ actorRole: "freelancer", stageStatus: "submitted" })).toThrow(
      WorkflowError
    );
    expect(() => assertCanSkipMeeting({ actorRole: "client", stageStatus: "submitted" })).toThrow(
      WorkflowError
    );
  });

  it("rejects skipping from in_progress or approved", () => {
    expect(() => assertCanSkipMeeting({ actorRole: "admin", stageStatus: "in_progress" })).toThrow(
      WorkflowError
    );
    expect(() => assertCanSkipMeeting({ actorRole: "admin", stageStatus: "approved" })).toThrow(
      WorkflowError
    );
  });
});

describe("wasSubmittedOnTime -- metric only, never a fee", () => {
  it("is on-time when submitted on or before the deadline day", () => {
    expect(wasSubmittedOnTime("2026-07-15", "2026-07-15T09:00:00Z")).toBe(true);
    expect(wasSubmittedOnTime("2026-07-15", "2026-07-10T09:00:00Z")).toBe(true);
  });

  it("is late when submitted after the deadline day", () => {
    expect(wasSubmittedOnTime("2026-06-20", "2026-06-21T00:00:01Z")).toBe(false);
  });

  it("defaults to true when there is no deadline or no submission yet", () => {
    expect(wasSubmittedOnTime(null, "2026-07-15T09:00:00Z")).toBe(true);
    expect(wasSubmittedOnTime("2026-07-15", null)).toBe(true);
  });
});

describe("nextStageNumber", () => {
  it("advances stages 3 and 4", () => {
    expect(nextStageNumber(3)).toBe(4);
    expect(nextStageNumber(4)).toBe(5);
  });

  it("has no next stage after 5 -- the project completes instead", () => {
    expect(nextStageNumber(5)).toBeNull();
  });
});
