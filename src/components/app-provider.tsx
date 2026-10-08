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
import type { AppData, Card, Deck, ReviewState } from "@/lib/types";

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
  ensureDefaultDeck: () => Deck;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (!cancelled && isStoredData(parsed)) setData(parsed);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        if (!cancelled) setReady(true);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, ready]);

  const createDeck = useCallback((title: string) => {
    const now = new Date().toISOString();
    const deck = { id: makeId(), title: title.trim(), createdAt: now, updatedAt: now };
    setData((current) => ({ ...current, decks: [...current.decks, deck] }));
    return deck;
  }, []);

  const ensureDefaultDeck = useCallback(() => {
    const existing = data.decks.at(-1);
    if (existing) return existing;
    return createDeck("กองของฉัน");
  }, [createDeck, data.decks]);

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
      ensureDefaultDeck,
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
      ensureDefaultDeck,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppData must be used inside AppProvider");
  return context;
}

export function isCardDue(cardId: string, reviews: ReviewState[], now = new Date()) {
  const review = reviews.find((item) => item.cardId === cardId);
  return !review || new Date(review.dueAt) <= now;
}
