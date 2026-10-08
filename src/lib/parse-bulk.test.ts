import { describe, expect, it } from "vitest";
import { parseBulkInput } from "./parse-bulk";

const meanings: Record<string, string> = { apple: "แอปเปิล", reliable: "เชื่อถือได้" };
const lookup = (term: string) => meanings[term.trim().toLowerCase()];

describe("parseBulkInput", () => {
  it("parses tab, dash, nested dash and extra spreadsheet columns", () => {
    const result = parseBulkInput(
      "apple\tผลไม้\tignored\nwork - งาน - อาชีพ\nreliable – ไว้ใจได้",
      [],
      lookup,
    );
    expect(result.valid).toEqual([
      { term: "apple", meaning: "ผลไม้", auto: false },
      { term: "work", meaning: "งาน - อาชีพ", auto: false },
      { term: "reliable", meaning: "ไว้ใจได้", auto: false },
    ]);
  });

  it("autofills known single words and errors on unknown words", () => {
    const result = parseBulkInput("apple\nunknown", [], lookup);
    expect(result.valid[0]).toEqual({ term: "apple", meaning: "แอปเปิล", auto: true });
    expect(result.errors[0].line).toBe(2);
  });

  it("keeps real line numbers and catches empty and long values", () => {
    const result = parseBulkInput(`\n - meaning\n${"a".repeat(101)} - x`, [], lookup);
    expect(result.errors.map((error) => error.line)).toEqual([2, 3]);
  });

  it("detects input and existing duplicates case-insensitively with CRLF", () => {
    const result = parseBulkInput("Apple\r\napple\r\nRELIABLE", ["reliable"], lookup);
    expect(result.valid).toHaveLength(1);
    expect(result.duplicates).toEqual(["apple", "RELIABLE"]);
  });

  it("rejects more than 500 non-empty lines", () => {
    expect(() => parseBulkInput(Array(501).fill("apple").join("\n"), [], lookup)).toThrow(
      "500",
    );
  });
});
