import { describe, expect, it } from "vitest";
import dictionary from "./dictionary.json";
import mock from "./mock-decks.json";

describe("sample vocabulary decks", () => {
  it("has unique category names and useful deck sizes", () => {
    const titles = mock.decks.map((deck) => deck.title);

    expect(mock.decks).toHaveLength(16);
    expect(new Set(titles).size).toBe(titles.length);
    expect(mock.decks.every((deck) => deck.cards.length >= 20)).toBe(true);
  });

  it("only references dictionary terms and never repeats a card", () => {
    const dictionaryTerms = new Set(dictionary.map((entry) => entry.t));
    const cardTerms = mock.decks.flatMap((deck) => deck.cards.map((card) => card.term));

    expect(cardTerms).toHaveLength(471);
    expect(new Set(cardTerms).size).toBe(cardTerms.length);
    expect(cardTerms.every((term) => dictionaryTerms.has(term))).toBe(true);
  });

  it("includes the five expanded practical categories", () => {
    const titles = new Set(mock.decks.map((deck) => deck.title));

    for (const title of [
      "เทคโนโลยีและโลกออนไลน์",
      "การเรียนและการศึกษา",
      "เงินและการเงิน",
      "อาหารและร้านอาหาร",
      "ธรรมชาติและสิ่งแวดล้อม",
    ]) {
      expect(titles.has(title)).toBe(true);
    }
  });
});
