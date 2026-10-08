import { describe, expect, it } from "vitest";
import entries from "../data/dictionary.json";
import { z } from "zod";
import { defaultMeaning, lookup, searchDictionary } from "./dictionary";
import type { DictEntry } from "./types";

// Shape rules for data/dictionary.json (see SPEC 5.1).
const dictionarySchema = z.array(
  z.object({
    t: z.string().min(1).regex(/^[a-z][a-z '-]*$/),
    s: z.array(
      z.object({
        pos: z.enum(["n", "v", "adj", "adv", "prep", "conj", "phr"]),
        m: z.array(z.string().min(1)).min(1).max(3),
      }),
    ).min(1),
  }),
);

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
