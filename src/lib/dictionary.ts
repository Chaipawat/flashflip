import { z } from "zod";
import type { DictEntry } from "./types";

export const dictionarySchema = z.array(
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

export function searchDictionary(
  entries: DictEntry[],
  query: string,
  limit = 6,
): DictEntry[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized || limit <= 0) return [];

  const sorter = (a: DictEntry, b: DictEntry) =>
    a.t.length - b.t.length || a.t.localeCompare(b.t);
  const prefix = entries.filter((entry) => entry.t.startsWith(normalized)).sort(sorter);
  const contains = entries
    .filter((entry) => !entry.t.startsWith(normalized) && entry.t.includes(normalized))
    .sort(sorter);

  return [...prefix, ...contains].slice(0, limit);
}

export function lookup(entries: DictEntry[], term: string): DictEntry | undefined {
  const normalized = term.trim().toLowerCase();
  return entries.find((entry) => entry.t === normalized);
}

export function defaultMeaning(entry: DictEntry): string {
  return entry.s[0].m.join(", ");
}
