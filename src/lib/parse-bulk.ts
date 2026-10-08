export type ParsedLine = { term: string; meaning: string; auto: boolean };
export type LineError = { line: number; raw: string; reason: string };
export type ParseResult = {
  valid: ParsedLine[];
  errors: LineError[];
  duplicates: string[];
};

export function parseBulkInput(
  text: string,
  existingTerms: string[],
  lookupMeaning: (term: string) => string | undefined,
): ParseResult {
  const lines = text.split(/\r?\n/);
  const nonEmpty = lines.filter((line) => line.trim()).length;
  if (nonEmpty > 500) throw new Error("เพิ่มได้ครั้งละไม่เกิน 500 บรรทัด");

  const valid: ParsedLine[] = [];
  const errors: LineError[] = [];
  const duplicates: string[] = [];
  const seen = new Set(existingTerms.map((term) => term.trim().toLowerCase()));

  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (!line) return;

    let term = "";
    let meaning = "";
    let auto = false;

    if (raw.includes("\t")) {
      const columns = raw.split("\t");
      term = columns[0] ?? "";
      meaning = columns[1] ?? "";
    } else {
      const separator = line.includes(" - ") ? " - " : line.includes(" – ") ? " – " : null;
      if (separator) {
        const separatorIndex = line.indexOf(separator);
        term = line.slice(0, separatorIndex);
        meaning = line.slice(separatorIndex + separator.length);
      } else {
        term = line;
        meaning = lookupMeaning(term) ?? "";
        auto = Boolean(meaning);
        if (!meaning) {
          errors.push({
            line: index + 1,
            raw,
            reason: "ไม่พบในพจนานุกรม ใส่ - ตามด้วยความหมายเอง",
          });
          return;
        }
      }
    }

    term = term.trim();
    meaning = meaning.trim();
    let reason = "";
    if (!term || !meaning) reason = "ต้องมีทั้งคำและความหมาย";
    else if (term.length > 100) reason = "คำยาวเกิน 100 ตัวอักษร";
    else if (meaning.length > 300) reason = "ความหมายยาวเกิน 300 ตัวอักษร";

    if (reason) {
      errors.push({ line: index + 1, raw, reason });
      return;
    }

    const key = term.toLowerCase();
    if (seen.has(key)) {
      duplicates.push(term);
      return;
    }
    seen.add(key);
    valid.push({ term, meaning, auto });
  });

  return { valid, errors, duplicates };
}
