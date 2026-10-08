import { describe, expect, it } from "vitest";
import entries from "../data/dictionary.json";
import { defaultMeaning, dictionarySchema, lookup, searchDictionary } from "./dictionary";
import type { DictEntry } from "./types";

const sample: DictEntry[] = [
  { t: "cat", s: [{ pos: "n", m: ["แมว"] }] },
  { t: "catalog", s: [{ pos: "n", m: ["รายการ"] }] },
  { t: "educate", s: [{ pos: "v", m: ["ให้การศึกษา"] }] },
  { t: "catch", s: [{ pos: "v", m: ["จับ"] }] },
];

describe("dictionary", () => {
  it("validates the JSON and unique terms", () => {
    expect(() => dictionarySchema.parse(entries)).not.toThrow();
    expect(new Set(entries.map((entry) => entry.t)).size).toBe(entries.length);
  });

  it("puts prefix matches first and ignores case", () => {
    expect(searchDictionary(sample, "CAT").map((entry) => entry.t)).toEqual([
      "cat",
      "catch",
      "catalog",
      "educate",
    ]);
  });

  it("handles empty queries, limits and lookup misses", () => {
    expect(searchDictionary(sample, " ")).toEqual([]);
    expect(searchDictionary(sample, "cat", 2)).toHaveLength(2);
    expect(lookup(sample, " CAT ")?.t).toBe("cat");
    expect(lookup(sample, "dog")).toBeUndefined();
    expect(defaultMeaning(sample[0])).toBe("แมว");
  });
});
