"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Search } from "lucide-react";
import { toast } from "sonner";
import entries from "@/data/dictionary.json";
import { AppHeader } from "@/components/app-header";
import { useAppData } from "@/components/app-provider";
import { searchDictionary } from "@/lib/dictionary";
import type { Card, DictEntry } from "@/lib/types";

const dictionary = entries as DictEntry[];
const POS: Record<string, string> = {
  n: "คำนาม", v: "คำกริยา", adj: "คำคุณศัพท์", adv: "คำวิเศษณ์",
  prep: "คำบุพบท", conj: "คำสันธาน", phr: "วลี",
};

export function AddWordPage({ initialDeckId }: { initialDeckId?: string }) {
  const { data, ready, addCard, ensureDefaultDeck } = useAppData();
  const [deckId, setDeckId] = useState(initialDeckId ?? "");
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<DictEntry[]>([]);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<DictEntry | null>(null);
  const [selectedMeanings, setSelectedMeanings] = useState<string[]>([]);
  const [customMeaning, setCustomMeaning] = useState("");
  const [recent, setRecent] = useState<Card[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const resolvedDeckId = data.decks.some((deck) => deck.id === deckId)
    ? deckId
    : (data.decks.at(-1)?.id ?? "");
  const targetDeck = data.decks.find((deck) => deck.id === resolvedDeckId);
  const term = (selected?.t ?? query).trim().toLowerCase();
  const duplicate = Boolean(
    resolvedDeckId && data.cards.some((card) => card.deckId === resolvedDeckId && card.term.toLowerCase() === term),
  );
  const canAdd = term.length > 0 && (selectedMeanings.length > 0 || customMeaning.trim()) && !duplicate;
  const showCustom = query.trim().length >= 2 && matches.length === 0 && !selected;

  const joinedMeaning = useMemo(
    () => [...selectedMeanings, customMeaning.trim()].filter(Boolean).join(", "),
    [customMeaning, selectedMeanings],
  );

  function changeQuery(value: string) {
    setQuery(value);
    if (selected && value.toLowerCase() !== selected.t) {
      setSelected(null);
      setSelectedMeanings([]);
      setCustomMeaning("");
    }
    const results = searchDictionary(dictionary, value);
    setMatches(results);
    setActive(0);
  }

  function choose(entry: DictEntry) {
    setSelected(entry);
    setQuery(entry.t);
    setMatches([]);
    setSelectedMeanings([entry.s[0].m[0]]);
    setCustomMeaning("");
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (matches.length && event.key === "ArrowDown") {
      event.preventDefault(); setActive((value) => (value + 1) % matches.length);
    } else if (matches.length && event.key === "ArrowUp") {
      event.preventDefault(); setActive((value) => (value - 1 + matches.length) % matches.length);
    } else if (event.key === "Escape") setMatches([]);
    else if (event.key === "Enter") {
      event.preventDefault();
      if (matches.length) choose(matches[active]);
      else if (canAdd) submitWord();
    }
  }

  function toggleMeaning(meaning: string) {
    setSelectedMeanings((current) =>
      current.includes(meaning) ? current.filter((item) => item !== meaning) : [...current, meaning],
    );
  }

  function submitWord() {
    if (!canAdd) return;
    const target = targetDeck ?? ensureDefaultDeck();
    const card = addCard(target.id, term, joinedMeaning);
    setRecent((current) => [card, ...current]);
    setDeckId(target.id);
    toast.success(`เพิ่ม “${term}” แล้ว`);
    setQuery(""); setSelected(null); setSelectedMeanings([]); setCustomMeaning(""); setMatches([]);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  if (!ready) return <main className="page-shell"><div className="skeleton hero-skeleton" /></main>;

  return (
    <main className="page-shell add-page">
      <AppHeader />
      <div className="page-topline">
        <Link href={targetDeck ? `/deck/${targetDeck.id}` : "/"} className="back-link"><ArrowLeft /> เสร็จแล้ว</Link>
      </div>
      <h1>เพิ่มคำ</h1>

      <div className="deck-picker">
        <label htmlFor="deck-picker">เพิ่มลงกอง</label>
        {data.decks.length ? (
          <select id="deck-picker" value={resolvedDeckId} onChange={(event) => setDeckId(event.target.value)}>
            {data.decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.title}</option>)}
          </select>
        ) : <strong>กองของฉัน</strong>}
      </div>

      <section className="search-section">
        <div className="search-box">
          <Search aria-hidden="true" />
          <label className="sr-only" htmlFor="word-search">คำภาษาอังกฤษ</label>
          <input
            ref={inputRef}
            id="word-search"
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="พิมพ์คำอังกฤษ เช่น ne…"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            role="combobox"
            aria-expanded={matches.length > 0}
            aria-controls="word-suggestions"
            aria-activedescendant={matches.length ? `suggestion-${active}` : undefined}
            autoFocus
          />
        </div>
        {matches.length > 0 && (
          <ul id="word-suggestions" className="suggestions" role="listbox">
            {matches.map((entry, index) => (
              <li key={entry.t} id={`suggestion-${index}`} role="option" aria-selected={active === index}>
                <button onMouseDown={(event) => event.preventDefault()} onClick={() => choose(entry)}>
                  <strong>{entry.t}</strong><span>{entry.s[0].m.join(", ")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(selected || showCustom) && (
        <section className="meaning-card">
          <h2>{term}</h2>
          {selected ? (
            <>
              <p>แตะเลือกความหมายที่อยากจำ เลือกได้มากกว่าหนึ่ง</p>
              {selected.s.map((sense) => (
                <div key={`${sense.pos}-${sense.m.join()}`} className="sense-group">
                  <span className="part-of-speech">{POS[sense.pos]}</span>
                  <div className="meaning-chips">
                    {sense.m.map((meaning) => {
                      const checked = selectedMeanings.includes(meaning);
                      return <button key={meaning} className={checked ? "selected" : ""} aria-pressed={checked} onClick={() => toggleMeaning(meaning)}>{checked && <Check />} {meaning}</button>;
                    })}
                  </div>
                </div>
              ))}
            </>
          ) : <p>ไม่พบ “{term}” ในพจนานุกรม พิมพ์ความหมายเองได้เลย</p>}
          <label htmlFor="custom-meaning">{selected ? "หรือพิมพ์ความหมายเอง" : "ความหมาย"}</label>
          <input id="custom-meaning" value={customMeaning} onChange={(event) => setCustomMeaning(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); submitWord(); } }} maxLength={300} placeholder="ความหมายภาษาไทย" />
          {duplicate && <p className="duplicate-note">มี “{term}” ในกอง {targetDeck?.title ?? "กองของฉัน"} แล้ว</p>}
          <button className="primary-button full" disabled={!canAdd} onClick={submitWord}>เพิ่ม “{term}” ลงกอง</button>
        </section>
      )}

      <section className="recent-section">
        <h2>เพิ่มแล้วรอบนี้{recent.length ? ` ${recent.length} คำ` : ""}</h2>
        {recent.length ? <ul className="word-list">{recent.map((card) => <li key={card.id} className="word-row"><span><strong>{card.term}</strong><small>{card.meaning}</small></span><span className="status-pill learning">{data.decks.find((deck) => deck.id === card.deckId)?.title}</span></li>)}</ul> : <p className="empty-inline">คำที่เพิ่มจะขึ้นตรงนี้</p>}
      </section>
    </main>
  );
}
