import { describe, expect, it } from "vitest";
import { createSession, persistDecision, sessionReducer } from "./study-session";
import type { StudyCard } from "./types";

const cards: StudyCard[] = Array.from({ length: 24 }, (_, index) => ({
  id: String(index),
  term: `word-${index}`,
  meaning: `meaning-${index}`,
  box: 0,
  deckTitle: "กองทดสอบ",
}));

describe("study session", () => {
  it("limits sessions and supports deterministic random", () => {
    const state = createSession(cards, () => 0.999, 20);
    expect(state.queue).toHaveLength(20);
    expect(state.queue[0].id).toBe("0");
  });

  it("marks an initially empty session done", () => {
    expect(createSession([]).done).toBe(true);
  });

  it("removes remembered cards", () => {
    const initial = createSession(cards.slice(0, 1), () => 0.5);
    const result = sessionReducer(initial, { type: "answer", result: "remembered" });
    expect(result.done).toBe(true);
    expect(result.leftPile).toEqual(["0"]);
  });

  it("cycles forgotten cards without duplicating stayed", () => {
    let state = createSession(cards.slice(0, 2), () => 0.999);
    state = sessionReducer(state, { type: "answer", result: "forgot" });
    state = sessionReducer(state, { type: "answer", result: "remembered" });
    state = sessionReducer(state, { type: "answer", result: "forgot" });
    expect(state.stayed).toEqual(["0"]);
    expect(state.queue[0].id).toBe("0");
  });

  it("skips persistence when a forgotten card is later remembered", () => {
    const initial = createSession(cards.slice(0, 1), () => 0.5);
    const forgotten = sessionReducer(initial, { type: "answer", result: "forgot" });
    expect(persistDecision(initial, "0", "forgot")).toBe("save-forgot");
    expect(persistDecision(initial, "0", "remembered")).toBe("save-remembered");
    expect(persistDecision(forgotten, "0", "remembered")).toBe("skip");
  });
});
