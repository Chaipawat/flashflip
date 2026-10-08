"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, ChevronLeft, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/app-header";
import { latestDeck, useAppData } from "@/components/app-provider";
import { AddSkeleton } from "@/components/skeletons";
import { lookup, searchDictionary } from "@/lib/dictionary";
import type { DictEntry } from "@/lib/types";

const POS: Record<string, string> = {
  n: "คำนาม", v: "กริยา", adj: "คุณศัพท์", adv: "กริยาวิเศษณ์",
  prep: "บุพบท", conj: "คำเชื่อม", phr: "วลี",
};

type RecentWord = { id: string; term: string; meaning: string; deckTitle: string };

export function AddWordPage({ initialDeckId }: { initialDeckId?: string }) {
  const router = useRouter();
  const { data, ready, addCard, ensureDefaultDeck } = useAppData();
  const [dictionary, setDictionary] = useState<DictEntry[] | null>(null);
  const [deckId, setDeckId] = useState(initialDeckId ?? "");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<DictEntry | null>(null);
  const [selectedMeanings, setSelectedMeanings] = useState<string[]>([]);
  const [customMeaning, setCustomMeaning] = useState("");
  const [recent, setRecent] = useState<RecentWord[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    import("@/data/dictionary.json").then((module) => {
      if (!cancelled) setDictionary(module.default as DictEntry[]);
    });
    return () => { cancelled = true; };
  }, []);

  const matches = useMemo(
    () => (dictionary && !selected ? searchDictionary(dictionary, query) : []),
    [dictionary, query, selected],
  );
  const listOpen = open && matches.length > 0;
  const trimmed = query.trim();
  const notFound = !selected && dictionary !== null && trimmed.length >= 2 && matches.length === 0;

  const targetDeck = data.decks.find((deck) => deck.id === deckId) ?? latestDeck(data);
  const term = selected?.t ?? trimmed;
  const duplicate = Boolean(
    targetDeck && term && data.cards.some(
      (card) => card.deckId === targetDeck.id && card.term.toLowerCase() === term.toLowerCase(),
    ),
  );
  const joinedMeaning = [...selectedMeanings, customMeaning.trim()].filter(Boolean).join(", ");
  const canAdd = (Boolean(selected) || notFound) && joinedMeaning.length > 0 && !duplicate;

  function changeQuery(value: string) {
    setQuery(value);
    setOpen(true);
    setActive(0);
    if (selected && value.trim().toLowerCase() !== selected.t) {
      setSelected(null);
      setSelectedMeanings([]);
      setCustomMeaning("");
    }
  }

  function choose(entry: DictEntry) {
    setSelected(entry);
    setQuery(entry.t);
    setOpen(false);
    setSelectedMeanings([entry.s[0].m[0]]);
    setCustomMeaning("");
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (listOpen && event.key === "ArrowDown") {
      event.preventDefault();
      setActive((value) => (value + 1) % matches.length);
    } else if (listOpen && event.key === "ArrowUp") {
      event.preventDefault();
      setActive((value) => (value - 1 + matches.length) % matches.length);
    } else if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (listOpen) choose(matches[active]);
      else if (selected || notFound) submitWord();
      else {
        const exact = dictionary && lookup(dictionary, query);
        if (exact) choose(exact);
      }
    }
  }

  function toggleMeaning(meaning: string) {
    setSelectedMeanings((current) =>
      current.includes(meaning) ? current.filter((item) => item !== meaning) : [...current, meaning],
    );
  }

  function submitWord() {
    if (!canAdd) {
      if (duplicate) toast(`มี “${term}” ในกองนี้แล้ว`);
      else if (!joinedMeaning) toast("เลือกหรือพิมพ์ความหมายก่อน");
      return;
    }
    const deck = targetDeck ?? ensureDefaultDeck();
    const card = addCard(deck.id, term, joinedMeaning);
    setRecent((current) => [{ id: card.id, term: card.term, meaning: card.meaning, deckTitle: deck.title }, ...current]);
    setDeckId(deck.id);
    toast(`เพิ่ม “${card.term}” แล้ว`);
    setQuery(""); setSelected(null); setSelectedMeanings([]); setCustomMeaning(""); setOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  if (!ready) return <AddSkeleton />;

  return (
    <main className="page-shell add-page">
      <Topbar>
        <button type="button" className="iconbtn" onClick={goBack}>
          <ChevronLeft aria-hidden="true" /> เสร็จแล้ว
        </button>
      </Topbar>

      <header className="add-heading">
        <span className="add-eyebrow">
          <Sparkles aria-hidden="true" /> สร้างคลังคำของคุณ
        </span>
        <h1 className="h1">เพิ่มคำศัพท์</h1>
        <p>ค้นหาคำ เลือกความหมาย แล้วเก็บลงกองไว้ทวนภายหลัง</p>
      </header>

      <div className="add-layout">
        <div className="add-workflow">
          <div className="step-heading">
            <span className="step-number">1</span>
            <span>
              <strong>เลือกกองคำศัพท์</strong>
              <small>คำใหม่จะถูกเก็บไว้ในกองนี้</small>
            </span>
          </div>

          <div className="pilepick">
            <label className="sr-only" htmlFor="deck-picker">เพิ่มลงกอง</label>
            {targetDeck ? (
              <select id="deck-picker" value={targetDeck.id} onChange={(event) => setDeckId(event.target.value)}>
                {data.decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.title}</option>)}
              </select>
            ) : <strong id="deck-picker">กองของฉัน</strong>}
          </div>

          <div className="step-heading search-step">
            <span className="step-number">2</span>
            <span>
              <strong>ค้นหาคำภาษาอังกฤษ</strong>
              <small>พิมพ์อย่างน้อย 2 ตัวอักษร</small>
            </span>
          </div>

          <div className="combo">
            <Search className="si" aria-hidden="true" />
            <label className="sr-only" htmlFor="word-search">คำภาษาอังกฤษ</label>
            <input
              ref={inputRef}
              id="word-search"
              className="field"
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
              onKeyDown={onKeyDown}
              onBlur={() => setOpen(false)}
              onFocus={() => setOpen(true)}
              placeholder="ลองพิมพ์ เช่น name, happy, travel…"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={100}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={listOpen}
              aria-controls="word-suggestions"
              aria-activedescendant={listOpen ? `suggestion-${active}` : undefined}
              autoFocus
            />
            <ul id="word-suggestions" className="sugg" role="listbox" aria-label="คำแนะนำ" hidden={!listOpen}>
              {listOpen && matches.map((entry, index) => (
                <li
                  key={entry.t}
                  id={`suggestion-${index}`}
                  role="option"
                  aria-selected={active === index}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(entry)}
                >
                  <span className="st"><Highlight text={entry.t} query={trimmed} /></span>
                  <span className="sm">{entry.s[0].m.join(", ")}</span>
                </li>
              ))}
            </ul>
          </div>

          {(selected || notFound) && (
            <section className="picked" aria-label={`ความหมายของ ${term}`}>
              <div className="picked-step">
                <span className="step-number">3</span>
                เลือกความหมายที่ต้องการจำ
              </div>
          <div className="pw">{term}</div>
          {selected ? (
            <>
              <p className="ph">แตะเลือกความหมายที่อยากจำ เลือกได้มากกว่าหนึ่ง</p>
              {selected.s.map((sense) => (
                <div key={`${sense.pos}-${sense.m.join()}`}>
                  <div className="pos">{POS[sense.pos] ?? sense.pos}</div>
                  <div className="chips">
                    {sense.m.map((meaning) => {
                      const checked = selectedMeanings.includes(meaning);
                      return (
                        <button key={meaning} type="button" className="chip" aria-pressed={checked} onClick={() => toggleMeaning(meaning)}>
                          <Check strokeWidth={3} aria-hidden="true" />{meaning}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          ) : <p className="empty">ไม่พบ “{term}” ในพจนานุกรม พิมพ์ความหมายเองได้เลย</p>}
          <div className="custom">
            <label htmlFor="custom-meaning">{selected ? "หรือพิมพ์ความหมายเอง" : "ความหมาย"}</label>
            <input
              id="custom-meaning"
              className="field soft"
              value={customMeaning}
              onChange={(event) => setCustomMeaning(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); submitWord(); } }}
              maxLength={300}
              placeholder="ความหมายภาษาไทย"
              autoComplete="off"
            />
          </div>
          {duplicate && <p className="dupnote" role="status">มี “{term}” ในกอง {targetDeck?.title} แล้ว</p>}
          <button type="button" className="btn btn-primary" disabled={!canAdd} onClick={submitWord}>
            เพิ่ม “{term}” ลงกอง
          </button>
            </section>
          )}
        </div>

        <section className="recent" aria-labelledby="recent-heading">
          <div className="recent-heading">
            <span className="recent-icon"><BookOpen aria-hidden="true" /></span>
            <span>
              <h2 id="recent-heading">เพิ่มแล้วรอบนี้</h2>
              <p>{recent.length ? `${recent.length} คำพร้อมทบทวน` : "ยังไม่มีคำที่เพิ่ม"}</p>
            </span>
          </div>
          <ul className={`words${recent.length ? "" : " is-empty"}`}>
            {recent.length ? recent.map((word, index) => (
              <li key={word.id} className={`word${index === 0 ? " new" : ""}`}>
                <span><span className="t">{word.term}</span><span className="m">{word.meaning}</span></span>
                <span className="pill learning">{word.deckTitle}</span>
              </li>
            )) : <li className="empty">คำที่เพิ่มจะปรากฏตรงนี้ทันที</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const index = query ? text.indexOf(query.toLowerCase()) : -1;
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}
