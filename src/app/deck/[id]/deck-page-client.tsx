"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, Pencil, Plus, RotateCcw, Trash2, Undo2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Topbar } from "@/components/app-header";
import { dueCardIds, useAppData } from "@/components/app-provider";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DeckSkeleton } from "@/components/skeletons";
import { SunMascot } from "@/components/sun-mascot";
import { defaultMeaning, lookup } from "@/lib/dictionary";
import { parseBulkInput, type ParseResult } from "@/lib/parse-bulk";
import type { Card, DictEntry } from "@/lib/types";

export function DeckPageClient({ deckId }: { deckId: string }) {
  const router = useRouter();
  const { data, ready, renameDeck, deleteDeck, addCards, updateCard, deleteCard, resetReviews } = useAppData();
  const deck = data.decks.find((item) => item.id === deckId);
  const cards = useMemo(() => data.cards.filter((card) => card.deckId === deckId), [data.cards, deckId]);
  const dueIds = useMemo(() => dueCardIds(data), [data]);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null);
  const bulkRef = useRef<HTMLDetailsElement>(null);
  const [bulk, setBulk] = useState("");
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [bulkError, setBulkError] = useState("");

  if (!ready) return <DeckSkeleton />;
  if (!deck) {
    return (
      <main className="center-state">
        <SunMascot size={110} />
        <h1>ไม่พบกองนี้</h1>
        <p>กองนี้อาจถูกลบไปแล้ว</p>
        <Link className="btn btn-primary" href="/">กลับหน้าแรก</Link>
      </main>
    );
  }

  const dueCount = cards.filter((card) => dueIds.has(card.id)).length;
  const existingTerms = cards.map((card) => card.term.toLowerCase());

  function saveTitle() {
    const clean = title.trim();
    if (!clean) return;
    renameDeck(deckId, clean);
    setRenaming(false);
    toast("เปลี่ยนชื่อกองแล้ว");
  }

  async function parseBulk() {
    setBulkError("");
    try {
      // Loaded on demand: the dictionary is only needed once the user checks a pasted list.
      const dictionary = (await import("@/data/dictionary.json")).default as DictEntry[];
      setPreview(parseBulkInput(bulk, existingTerms, (term) => {
        const entry = lookup(dictionary, term);
        return entry ? defaultMeaning(entry) : undefined;
      }));
    } catch (error) {
      setPreview(null);
      setBulkError(error instanceof Error ? error.message : "ตรวจสอบรายการไม่สำเร็จ");
    }
  }

  function commitBulk() {
    if (!preview?.valid.length) return;
    addCards(deckId, preview.valid);
    toast(`เพิ่มแล้ว ${preview.valid.length} คำ`);
    setBulk(""); setPreview(null);
    if (bulkRef.current) bulkRef.current.open = false;
  }

  function saveCard(card: Card, term: string, meaning: string) {
    const clash = cards.some((item) => item.id !== card.id && item.term.toLowerCase() === term.trim().toLowerCase());
    if (clash) {
      toast(`มี “${term.trim()}” ในกองนี้แล้ว`);
      return false;
    }
    updateCard(card.id, term, meaning);
    toast("แก้ไขคำแล้ว");
    return true;
  }

  return (
    <main className="page-shell has-sticky">
      <Topbar>
        <Link href="/" className="iconbtn"><ChevronLeft aria-hidden="true" /> หน้าแรก</Link>
        <button type="button" className="iconbtn round danger" onClick={() => setShowDelete(true)} aria-label="ลบกองนี้">
          <Trash2 aria-hidden="true" />
        </button>
      </Topbar>

      {renaming ? (
        <div className="title-edit">
          <label className="sr-only" htmlFor="deck-rename">ชื่อกอง</label>
          <input
            id="deck-rename"
            className="field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={60}
            autoFocus
            onKeyDown={(event) => { if (event.key === "Enter") saveTitle(); if (event.key === "Escape") setRenaming(false); }}
          />
          <button type="button" className="iconbtn round" onClick={saveTitle} aria-label="บันทึกชื่อกอง"><Check aria-hidden="true" /></button>
          <button type="button" className="iconbtn round" onClick={() => setRenaming(false)} aria-label="ยกเลิก"><X aria-hidden="true" /></button>
        </div>
      ) : (
        <button type="button" className="editable-title" onClick={() => { setTitle(deck.title); setRenaming(true); }} aria-label={`เปลี่ยนชื่อกอง ${deck.title}`}>
          <h1 className="h1">{deck.title}</h1><Pencil aria-hidden="true" />
        </button>
      )}
      <div className="deck-stats">
        <span className="meter" aria-hidden="true"><span style={{ width: `${cards.length ? ((cards.length - dueCount) / cards.length) * 100 : 0}%` }} /></span>
        <p className="sub">ยังจำไม่ได้ {dueCount} · จำได้แล้ว {cards.length - dueCount}</p>
        {cards.length - dueCount > 0 && (
          <button type="button" className="textbtn" onClick={() => setShowReset(true)}>
            <RotateCcw aria-hidden="true" /> รีเซ็ตกอง
          </button>
        )}
      </div>

      <div className="actions">
        <Link href={`/add?deck=${deckId}`} className="btn btn-ghost"><Plus strokeWidth={2.2} aria-hidden="true" /> เพิ่มคำลงกองนี้</Link>
      </div>

      <details className="bulk" ref={bulkRef}>
        <summary>มีลิสต์คำอยู่แล้ว? วางทีเดียวหลายคำ</summary>
        <p className="hint">บรรทัดละคำ พิมพ์แค่คำอังกฤษก็พอ ความหมายจะเติมจากพจนานุกรมให้ ถ้าอยากใส่เอง ใช้ - คั่น หรือ Copy จาก Excel / Google Sheets มาวาง</p>
        <label className="sr-only" htmlFor="bulk-input">คำศัพท์หลายบรรทัด</label>
        <textarea
          id="bulk-input"
          value={bulk}
          spellCheck={false}
          onChange={(event) => { setBulk(event.target.value); setPreview(null); }}
          placeholder={"hesitate\nreliable\nconvenient - สะดวก"}
        />
        <button type="button" className="btn btn-ghost" onClick={parseBulk} disabled={!bulk.trim()}>ตรวจสอบ</button>
        {bulkError && <p className="error-note" role="alert">{bulkError}</p>}
        {preview && (
          <div className="preview" aria-live="polite">
            <p className="sum">พร้อมเพิ่ม {preview.valid.length} คำ</p>
            {preview.valid.length > 0 && (
              <ul>
                {preview.valid.map((item) => (
                  <li key={item.term}>
                    <b>{item.term}</b> — {item.meaning} {item.auto && <span className="auto">เติมจากพจนานุกรม</span>}
                  </li>
                ))}
              </ul>
            )}
            {preview.duplicates.length > 0 && (
              <p className="warn">มีในกองแล้ว {preview.duplicates.length} คำ จะข้ามไป: {preview.duplicates.join(", ")}</p>
            )}
            {preview.errors.length > 0 && (
              <div className="errlist">
                {preview.errors.map((error) => (
                  <p key={`${error.line}-${error.raw}`}><b>บรรทัด {error.line}:</b> “{error.raw.trim()}” — {error.reason}</p>
                ))}
              </div>
            )}
            <button type="button" className="btn btn-primary" onClick={commitBulk} disabled={!preview.valid.length}>
              เพิ่ม {preview.valid.length} คำลงกอง
            </button>
          </div>
        )}
      </details>

      <div className="section-head">
        <h2>คำในกองนี้{cards.length > 0 && <span className="count">{cards.length}</span>}</h2>
        {cards.length > 0 && <span className="section-hint">แตะคำเพื่อแก้ไข</span>}
      </div>
      <ul className="words">
        {cards.length ? cards.map((card) => (
          <EditableWord
            key={card.id}
            card={card}
            due={dueIds.has(card.id)}
            onSave={(term, meaning) => saveCard(card, term, meaning)}
            onDelete={() => setCardToDelete(card)}
            onReset={() => { resetReviews([card.id]); toast(`ใส่ “${card.term}” กลับเข้ากองแล้ว`); }}
          />
        )) : <li className="empty">ยังไม่มีคำในกองนี้ กด “เพิ่มคำลงกองนี้” เพื่อเริ่ม</li>}
      </ul>

      <div className="sticky">
        {dueCount
          ? <Link href={`/study?deck=${deckId}`} className="btn btn-primary">สุ่มฝึกกองนี้ ({Math.min(dueCount, 20)} คำ)</Link>
          : cards.length
            ? <Link href={`/study?deck=${deckId}&all=1`} className="btn btn-primary"><RotateCcw strokeWidth={2.4} aria-hidden="true" /> ฝึกทั้งกองอีกครั้ง ({Math.min(cards.length, 20)} คำ)</Link>
            : <button type="button" className="btn btn-primary" disabled>ยังไม่มีคำในกองนี้</button>}
      </div>

      <ConfirmDialog
        open={showReset}
        icon={<RotateCcw strokeWidth={2.2} />}
        title={`รีเซ็ตกอง “${deck.title}”?`}
        description={`คำที่จำได้แล้ว ${cards.length - dueCount} คำจะกลับเข้ากองคำที่ยังจำไม่ได้ และเริ่มนับระดับใหม่ (คำศัพท์ไม่หาย)`}
        confirmLabel="รีเซ็ต"
        onClose={() => setShowReset(false)}
        onConfirm={() => {
          resetReviews(cards.map((card) => card.id));
          setShowReset(false);
          toast("ใส่ทุกคำกลับเข้ากองแล้ว");
        }}
      />
      <ConfirmDialog
        open={showDelete}
        title={`ลบกอง “${deck.title}”?`}
        description={cards.length ? `คำทั้ง ${cards.length} คำในกองนี้จะถูกลบไปด้วย และกู้คืนไม่ได้` : "กองนี้ยังไม่มีคำ ลบแล้วกู้คืนไม่ได้"}
        confirmLabel="ลบกอง"
        onClose={() => setShowDelete(false)}
        onConfirm={() => { deleteDeck(deckId); toast("ลบกองแล้ว"); router.replace("/"); }}
      />
      <ConfirmDialog
        open={cardToDelete !== null}
        title={`ลบ “${cardToDelete?.term ?? ""}”?`}
        description="คำนี้และสถานะการทวนจะถูกลบออกจากกอง"
        confirmLabel="ลบคำ"
        onClose={() => setCardToDelete(null)}
        onConfirm={() => {
          if (cardToDelete) { deleteCard(cardToDelete.id); toast(`ลบ “${cardToDelete.term}” แล้ว`); }
          setCardToDelete(null);
        }}
      />
    </main>
  );
}

function EditableWord({ card, due, onSave, onDelete, onReset }: {
  card: Card;
  due: boolean;
  onSave: (term: string, meaning: string) => boolean;
  onDelete: () => void;
  onReset: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [term, setTerm] = useState(card.term);
  const [meaning, setMeaning] = useState(card.meaning);

  function startEdit() {
    setTerm(card.term);
    setMeaning(card.meaning);
    setEditing(true);
  }

  function save() {
    if (!term.trim() || !meaning.trim()) {
      toast("ต้องมีทั้งคำและความหมาย");
      return;
    }
    if (onSave(term, meaning)) setEditing(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") save();
    if (event.key === "Escape") setEditing(false);
  }

  if (editing) {
    return (
      <li className="word editing">
        <div className="edit-fields">
          <label className="edit-label">
            <span>คำศัพท์</span>
            <input className="field soft" value={term} onChange={(event) => setTerm(event.target.value)} onKeyDown={onKeyDown} maxLength={100} autoFocus />
          </label>
          <label className="edit-label">
            <span>ความหมาย</span>
            <input className="field soft" value={meaning} onChange={(event) => setMeaning(event.target.value)} onKeyDown={onKeyDown} maxLength={300} />
          </label>
        </div>
        <div className="edit-actions">
          <button type="button" className="textbtn danger" onClick={onDelete}><Trash2 aria-hidden="true" /> ลบ</button>
          {!due && (
            <button type="button" className="textbtn" onClick={() => { onReset(); setEditing(false); }}><Undo2 aria-hidden="true" /> ใส่กลับเข้ากอง</button>
          )}
          <span className="spacer" />
          <button type="button" className="textbtn" onClick={() => setEditing(false)}>ยกเลิก</button>
          <button type="button" className="chipbtn primary" onClick={save}><Check strokeWidth={2.6} aria-hidden="true" /> บันทึก</button>
        </div>
      </li>
    );
  }

  return (
    <li className="word">
      <button type="button" className="word-btn" onClick={startEdit} aria-label={`${card.term}: ${card.meaning} แตะเพื่อแก้ไข`}>
        <span><span className="t">{card.term}</span><span className="m">{card.meaning}</span></span>
        <span className={`pill ${due ? "learning" : "remembered"}`}>{due ? "ยังจำไม่ได้" : "จำได้แล้ว"}</span>
        <Pencil className="word-edit-hint" aria-hidden="true" />
      </button>
    </li>
  );
}
