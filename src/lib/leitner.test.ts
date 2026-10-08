import { describe, expect, it } from "vitest";
import { nextReviewState } from "./leitner";

describe("nextReviewState", () => {
  it("moves a new card to box 1 at tomorrow Bangkok midnight", () => {
    const result = nextReviewState({ box: 0 }, "remembered", new Date("2026-10-08T10:00:00Z"));
    expect(result.box).toBe(1);
    expect(result.dueAt.toISOString()).toBe("2026-10-08T17:00:00.000Z");
  });

  it("keeps box 5 and adds 14 days", () => {
    const result = nextReviewState({ box: 5 }, "remembered", new Date("2026-10-08T10:00:00Z"));
    expect(result.box).toBe(5);
    expect(result.dueAt.toISOString()).toBe("2026-10-21T17:00:00.000Z");
  });

  it("resets forgotten cards immediately", () => {
    const now = new Date("2026-10-08T10:00:00Z");
    expect(nextReviewState({ box: 4 }, "forgot", now)).toEqual({ box: 0, dueAt: now });
  });

  it("uses the correct Bangkok date around midnight", () => {
    const before = nextReviewState({ box: 0 }, "remembered", new Date("2026-10-08T16:30:00Z"));
    const after = nextReviewState({ box: 0 }, "remembered", new Date("2026-10-08T17:30:00Z"));
    expect(before.dueAt.toISOString()).toBe("2026-10-08T17:00:00.000Z");
    expect(after.dueAt.toISOString()).toBe("2026-10-09T17:00:00.000Z");
  });
});
