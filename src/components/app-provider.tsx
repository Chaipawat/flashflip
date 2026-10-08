"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { nextReviewState } from "@/lib/leitner";
import type { AppData, Card, Deck, ReviewState, SampleDeck } from "@/lib/types";

const STORAGE_KEY = "flashflip-data-v2";
const EMPTY_DATA: AppData = { decks: [], cards: [], reviews: [] };

type AppContextValue = {
  data: AppData;
  ready: boolean;
  createDeck: (title: string) => Deck;
  renameDeck: (id: string, title: string) => void;
  deleteDeck: (id: string) => void;
  addCard: (deckId: string, term: string, meaning: string) => Card;
  addCards: (deckId: string, cards: { term: string; meaning: string }[]) => void;
  updateCard: (id: string, term: string, meaning: string) => void;
  deleteCard: (id: string) => void;
  saveReview: (review: ReviewState) => void;
  /** Puts cards back into the pile by dropping their review state. */
  resetReviews: (cardIds: string[]) => void;
  ensureDefaultDeck: () => Deck;
  importSampleDecks: (decks: SampleDeck[]) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function makeId() {
  return crypto.randomUUID();
}

function isStoredData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false;
  const data = value as AppData;
  return Array.isArray(data.decks) && Array.isArray(data.cards) && Array.isArray(data.reviews);
}

function readStorage(): AppData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    return isStoredData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      const stored = readStorage();
      if (cancelled) return;
      if (stored) setData(stored);
      setReady(true);
    });
    // Keep open tabs in sync so the last tab to save doesn't wipe the others' changes.
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      const stored = readStorage();
      if (stored) setData(stored);
    }
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      const serialized = JSON.stringify(data);
      if (localStorage.getItem(STORAGE_KEY) !== serialized) localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      toast.error("บันทึกไม่สำเร็จ พื้นที่ในเบราว์เซอร์อาจเต็มหรือถูกปิดไว้");
    }
  }, [data, ready]);

  const createDeck = useCallback((title: string) => {
    const now = new Date().toISOString();
    const deck = { id: makeId(), title: title.trim(), createdAt: now, updatedAt: now };
    setData((current) => ({ ...current, decks: [...current.decks, deck] }));
    return deck;
  }, []);

  const ensureDefaultDeck = useCallback(() => {
    return latestDeck(data) ?? createDeck("กองของฉัน");
  }, [createDeck, data]);

  const renameDeck = useCallback((id: string, title: string) => {
    setData((current) => ({
      ...current,
      decks: current.decks.map((deck) =>
        deck.id === id ? { ...deck, title: title.trim(), updatedAt: new Date().toISOString() } : deck,
      ),
    }));
  }, []);

  const deleteDeck = useCallback((id: string) => {
    setData((current) => {
      const cardIds = new Set(current.cards.filter((card) => card.deckId === id).map((card) => card.id));
      return {
        decks: current.decks.filter((deck) => deck.id !== id),
        cards: current.cards.filter((card) => card.deckId !== id),
        reviews: current.reviews.filter((review) => !cardIds.has(review.cardId)),
      };
    });
  }, []);

  const addCard = useCallback((deckId: string, term: string, meaning: string) => {
    const card = {
      id: makeId(),
      deckId,
      term: term.trim(),
      meaning: meaning.trim(),
      createdAt: new Date().toISOString(),
    };
    setData((current) => ({ ...current, cards: [card, ...current.cards] }));
    return card;
  }, []);

  const addCards = useCallback((deckId: string, cards: { term: string; meaning: string }[]) => {
    const now = new Date().toISOString();
    const created = cards.map((card, index) => ({
      id: makeId(),
      deckId,
      term: card.term.trim(),
      meaning: card.meaning.trim(),
      createdAt: new Date(Date.parse(now) + index).toISOString(),
    }));
    setData((current) => ({ ...current, cards: [...created.reverse(), ...current.cards] }));
  }, []);

  const updateCard = useCallback((id: string, term: string, meaning: string) => {
    setData((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        card.id === id ? { ...card, term: term.trim(), meaning: meaning.trim() } : card,
      ),
    }));
  }, []);

  const deleteCard = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      cards: current.cards.filter((card) => card.id !== id),
      reviews: current.reviews.filter((review) => review.cardId !== id),
    }));
  }, []);

  const saveReview = useCallback((review: ReviewState) => {
    setData((current) => ({
      ...current,
      reviews: [...current.reviews.filter((item) => item.cardId !== review.cardId), review],
    }));
  }, []);

  const resetReviews = useCallback((cardIds: string[]) => {
    const ids = new Set(cardIds);
    setData((current) => ({ ...current, reviews: current.reviews.filter((review) => !ids.has(review.cardId)) }));
  }, []);

  const importSampleDecks = useCallback((samples: SampleDeck[]) => {
    const now = new Date();
    const remembered = nextReviewState({ box: 0 }, "remembered", now);
    setData((current) => {
      const decks: Deck[] = [];
      const cards: Card[] = [];
      const reviews: ReviewState[] = [];
      samples.forEach((sample, deckIndex) => {
        const stamp = new Date(now.getTime() + deckIndex).toISOString();
        const deck = { id: makeId(), title: sample.title, createdAt: stamp, updatedAt: stamp };
        decks.push(deck);
        sample.cards.forEach((sampleCard, cardIndex) => {
          const card = {
            id: makeId(),
            deckId: deck.id,
            term: sampleCard.term,
            meaning: sampleCard.meaning,
            createdAt: new Date(now.getTime() - deckIndex * 1000 - cardIndex).toISOString(),
          };
          cards.push(card);
          if (sampleCard.remembered) {
            reviews.push({ cardId: card.id, box: remembered.box, dueAt: remembered.dueAt.toISOString(), lastReviewedAt: now.toISOString() });
          }
        });
      });
      return {
        // Home lists newest decks first, so append in reverse to keep the sample order on screen.
        decks: [...current.decks, ...decks.reverse()],
        cards: [...cards, ...current.cards],
        reviews: [...current.reviews, ...reviews],
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      data,
      ready,
      createDeck,
      renameDeck,
      deleteDeck,
      addCard,
      addCards,
      updateCard,
      deleteCard,
      saveReview,
      resetReviews,
      ensureDefaultDeck,
      importSampleDecks,
    }),
    [
      data,
      ready,
      createDeck,
      renameDeck,
      deleteDeck,
      addCard,
      addCards,
      updateCard,
      deleteCard,
      saveReview,
      resetReviews,
      ensureDefaultDeck,
      importSampleDecks,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppData must be used inside AppProvider");
  return context;
}

/** IDs of cards still in the pile: never reviewed, forgotten, or due again. */
export function dueCardIds(data: AppData, now = new Date()) {
  const notDue = new Set(
    data.reviews.filter((review) => new Date(review.dueAt) > now).map((review) => review.cardId),
  );
  return new Set(data.cards.filter((card) => !notDue.has(card.id)).map((card) => card.id));
}

/** The deck that most recently got a card, falling back to the newest deck. */
export function latestDeck(data: AppData): Deck | undefined {
  const lastCard = data.cards.reduce<Card | undefined>(
    (latest, card) => (!latest || card.createdAt > latest.createdAt ? card : latest),
    undefined,
  );
  return data.decks.find((deck) => deck.id === lastCard?.deckId) ?? data.decks.at(-1);
}
