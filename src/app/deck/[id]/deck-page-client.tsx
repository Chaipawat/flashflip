"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Edit3, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import entries from "@/data/dictionary.json";
import { isCardDue, useAppData } from "@/components/app-provider";
import { defaultMeaning, lookup } from "@/lib/dictionary";
import { parseBulkInput, type ParseResult } from "@/lib/parse-bulk";
import type { Card, DictEntry } from "@/lib/types";

const dictionary = entries as DictEntry[];

export function DeckPageClient({ deckId }: { deckId: string }) {
  const router = useRouter();
  const { data, ready, renameDeck, deleteDeck, addCards, updateCard, deleteCard } = useAppData();
  const deck = data.decks.find((item) => item.id === deckId);
  const cards = useMemo(() => data.cards.filter((card) => card.deckId === deckId), [data.cards, deckId]);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [bulk, setBulk] = useState("");
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [bulkError, setBulkError] = useState("");

  if (!ready) return <main className="page-shell"><div className="skeleton hero-skeleton" /></main>;
  if (!deck) return <main className="center-state"><h1>ไม่พบกองนี้</h1><p>กองอาจถูกลบไปแล้ว</p><Link className="primary-button" href="/">กลับหน้าแรก</Link></main>;

  const dueCount = cards.filter((card) => isCardDue(card.id, data.reviews)).length;

  function saveTitle() {
    const clean = title.trim();
    if (!clean) return;
    renameDeck(deckId, clean);
    setRenaming(false);
    toast.success("เปลี่ยนชื่อกองแล้ว");
  }

  function parseBulk() {
    setBulkError("");
    try {
      setPreview(parseBulkInput(
        bulk,
        cards.map((card) => card.term),
        (term) => {
          const entry = lookup(dictionary, term);
          return entry ? defaultMeaning(entry) : undefined;
        },
      ));
    } catch (error) {
      setPreview(null);
      setBulkError(error instanceof Error ? error.message : "ตรวจสอบรายการไม่สำเร็จ");
    }
  }

  function commitBulk() {
    if (!preview?.valid.length) return;
    addCards(deckId, preview.valid);
    toast.success(`เพิ่มแล้ว ${preview.valid.length} คำ`);
    setBulk(""); setPreview(null);
  }

  return (
    <main className="page-shell deck-page">
      <div className="page-topline">
        <Link href="/" className="back-link"><ArrowLeft /> หน้าแรก</Link>
        <button className="icon-button danger" onClick={() => setShowDelete(true)} aria-label="ลบกอง"><Trash2 /></button>
      </div>

      <header className="deck-title-block">
        {renaming ? (
          <div className="inline-edit title-edit"><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={60} autoFocus onKeyDown={(event) => { if (event.key === "Enter") saveTitle(); if (event.key === "Escape") setRenaming(false); }} /><button onClick={saveTitle} aria-label="บันทึก"><Check /></button><button onClick={() => setRenaming(false)} aria-label="ยกเลิก"><X /></button></div>
        ) : <button className="editable-title" onClick={() => { setTitle(deck.title); setRenaming(true); }}><h1>{deck.title}</h1><Edit3 /></button>}
        <p>ยังจำไม่ได้ {dueCount} · จำได้แล้ว {cards.length - dueCount}</p>
      </header>

      <Link href={`/add?deck=${deckId}`} className="primary-button full"><Plus /> เพิ่มคำลงกองนี้</Link>

      <details className="bulk-panel">
        <summary>มีลิสต์คำอยู่แล้ว? วางทีเดียวหลายคำ</summary>
        <p>บรรทัดละคำ พิมพ์แค่คำอังกฤษก็พอ ความหมายจะเติมจากพจนานุกรมให้ ถ้าอยากใส่เอง ใช้ - คั่น หรือ Copy จาก Excel / Google Sheets มาวาง</p>
        <label className="sr-only" htmlFor="bulk-input">คำศัพท์หลายบรรทัด</label>
        <textarea id="bulk-input" value={bulk} onChange={(event) => { setBulk(event.target.value); setPreview(null); }} placeholder={'hesitate\nreliable\nconvenient - สะดวก'} />
        <button className="ghost-button full" onClick={parseBulk} disabled={!bulk.trim()}>ตรวจสอบ</button>
        {bulkError && <p className="error-note">{bulkError}</p>}
        {preview && (
          <div className="bulk-preview" aria-live="polite">
            <h3>พร้อมเพิ่ม {preview.valid.length} คำ</h3>
            {preview.valid.length > 0 && <ul>{preview.valid.map((item) => <li key={item.term}><strong>{item.term}</strong> — {item.meaning} {item.auto && <span>· เติมจากพจนานุกรม</span>}</li>)}</ul>}
            {preview.duplicates.length > 0 && <p className="warning-note">มีในกองแล้ว {preview.duplicates.length} คำ จะข้ามไป: {preview.duplicates.join(", ")}</p>}
            {preview.errors.length > 0 && <div className="error-list">{preview.errors.map((error) => <p key={`${error.line}-${error.raw}`}><strong>บรรทัด {error.line}:</strong> “{error.raw}” — {error.reason}</p>)}</div>}
            <button className="primary-button full" onClick={commitBulk} disabled={!preview.valid.length}>เพิ่ม {preview.valid.length} คำลงกอง</button>
          </div>
        )}
      </details>

      <section className="deck-words">
        <h2>คำในกองนี้</h2>
        {cards.length ? <ul className="word-list">{cards.map((card) => <EditableCard key={card.id} card={card} due={isCardDue(card.id, data.reviews)} onSave={updateCard} onDelete={deleteCard} />)}</ul> : <p className="empty-inline">ยังไม่มีคำในกองนี้ กด “เพิ่มคำลงกองนี้” เพื่อเริ่ม</p>}
      </section>

      <div className="sticky-action">
        {dueCount ? <Link href={`/study?deck=${deckId}`} className="primary-button full">สุ่มฝึกกองนี้ ({Math.min(dueCount, 20)} คำ)</Link> : <button className="primary-button full" disabled>ไม่มีคำค้างในกองนี้</button>}
      </div>

      {showDelete && <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowDelete(false)}><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title" onMouseDown={(event) => event.stopPropagation()}><h2 id="delete-title">ลบกอง “{deck.title}”?</h2><p>คำทั้งหมดในกองนี้จะถูกลบจากเครื่องนี้ด้วย</p><div><button className="ghost-button" onClick={() => setShowDelete(false)}>ยกเลิก</button><button className="danger-button" onClick={() => { deleteDeck(deckId); toast.success("ลบกองแล้ว"); router.replace("/"); }}>ลบกอง</button></div></section></div>}
    </main>
  );
}

function EditableCard({ card, due, onSave, onDelete }: { card: Card; due: boolean; onSave: (id: string, term: string, meaning: string) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [term, setTerm] = useState(card.term);
  const [meaning, setMeaning] = useState(card.meaning);
  if (editing) return <li className="word-row editing"><div className="edit-fields"><input value={term} onChange={(event) => setTerm(event.target.value)} maxLength={100} aria-label="คำศัพท์" /><input value={meaning} onChange={(event) => setMeaning(event.target.value)} maxLength={300} aria-label="ความหมาย" /></div><div className="row-actions"><button onClick={() => { if (term.trim() && meaning.trim()) { onSave(card.id, term, meaning); setEditing(false); toast.success("แก้ไขคำแล้ว"); } }} aria-label="บันทึก"><Check /></button><button onClick={() => setEditing(false)} aria-label="ยกเลิก"><X /></button></div></li>;
  return <li className="word-row"><span><strong>{card.term}</strong><small>{card.meaning}</small></span><span className={`status-pill ${due ? "learning" : "remembered"}`}>{due ? "ยังจำไม่ได้" : "จำได้แล้ว"}</span><div className="row-actions"><button onClick={() => setEditing(true)} aria-label={`แก้ไข ${card.term}`}><Edit3 /></button><button onClick={() => { if (confirm(`ลบ “${card.term}” ใช่ไหม`)) onDelete(card.id); }} aria-label={`ลบ ${card.term}`}><Trash2 /></button></div></li>;
}
