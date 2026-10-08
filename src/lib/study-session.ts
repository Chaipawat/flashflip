import type { StudyCard } from "./types";

export type SessionState = {
  queue: StudyCard[];
  total: number;
  leftPile: string[];
  stayed: string[];
  done: boolean;
};

export type SessionAction =
  | { type: "answer"; result: "remembered" | "forgot" }
  | { type: "reset"; state: SessionState };

export function createSession(
  cards: StudyCard[],
  random: () => number = Math.random,
  max = 20,
): SessionState {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  const queue = shuffled.slice(0, max);
  return { queue, total: queue.length, leftPile: [], stayed: [], done: queue.length === 0 };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  if (action.type === "reset") return action.state;
  const current = state.queue[0];
  if (!current) return { ...state, done: true };

  const rest = state.queue.slice(1);
  if (action.result === "forgot") {
    return {
      ...state,
      queue: [...rest, current],
      stayed: state.stayed.includes(current.id) ? state.stayed : [...state.stayed, current.id],
    };
  }

  const leftPile =
    state.stayed.includes(current.id) || state.leftPile.includes(current.id)
      ? state.leftPile
      : [...state.leftPile, current.id];
  return { ...state, queue: rest, leftPile, done: rest.length === 0 };
}

export function persistDecision(
  state: SessionState,
  cardId: string,
  result: "remembered" | "forgot",
): "save-remembered" | "save-forgot" | "skip" {
  if (result === "forgot") return "save-forgot";
  return state.stayed.includes(cardId) ? "skip" : "save-remembered";
}
