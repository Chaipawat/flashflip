"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { ArrowLeft, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { isCardDue, useAppData } from "@/components/app-provider";
import { SunMascot } from "@/components/sun-mascot";
import { nextReviewState } from "@/lib/leitner";
import { createSession, persistDecision, sessionReducer } from "@/lib/study-session";
import type { StudyCard } from "@/lib/types";

const EMPTY_SESSION = createSession([]);

export function StudyPageClient({ deckId }: { deckId?: string }) {
  const { data, ready, saveReview } = useAppData();
  const [session, dispatch] = useReducer(sessionReducer, EMPTY_SESSION);
  const [started, setStarted] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const pool = useMemo<StudyCard[]>(() => data.cards
    .filter((card) => (!deckId || card.deckId === deckId) && isCardDue(card.id, data.reviews))
    .map((card) => ({
      id: card.id,
      term: card.term,
      meaning: card.meaning,
      box: data.reviews.find((review) => review.cardId === card.id)?.box ?? 0,
      deckTitle: data.decks.find((deck) => deck.id === card.deckId)?.title ?? "กองของฉัน",
    })), [data, deckId]);

  const start = useCallback(() => {
    dispatch({ type: "reset", state: createSession(pool) });
    setFlipped(false);
    setStarted(true);
  }, [pool]);

  useEffect(() => {
    if (ready && !started) queueMicrotask(start);
  }, [ready, start, started]);

  const answer = useCallback((result: "remembered" | "forgot") => {
    const current = session.queue[0];
    if (!current || !flipped) return;
    const decision = persistDecision(session, current.id, result);
    if (decision !== "skip") {
      const next = nextReviewState({ box: current.box }, result, new Date());
      saveReview({ cardId: current.id, box: next.box, dueAt: next.dueAt.toISOString(), lastReviewedAt: new Date().toISOString() });
    }
    if (result === "forgot") toast("เดี๋ยวคำนี้จะวนกลับมาอีกครั้ง");
    dispatch({ type: "answer", result });
    setFlipped(false);
  }, [flipped, saveReview, session]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.code === "Space") {
        if (target.closest("button")) return;
        event.preventDefault(); setFlipped((value) => !value);
      } else if (event.key === "ArrowLeft") answer("forgot");
      else if (event.key === "ArrowRight") answer("remembered");
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [answer]);

  if (!ready || !started) return <main className="page-shell"><div className="skeleton hero-skeleton" /></main>;

  const current = session.queue[0];
  const stayedCards = session.stayed.map((id) => data.cards.find((card) => card.id === id)).filter(Boolean);

  if (!session.total) return (
    <main className="study-shell center-state">
      <SunMascot size={136} />
      <h1>กองนี้ไม่มีคำค้างแล้ว</h1>
      <p>เพิ่มคำใหม่ หรือกลับมาทวนเมื่อถึงวันนัด</p>
      <Link href={deckId ? `/add?deck=${deckId}` : "/add"} className="primary-button">เพิ่มคำ</Link>
      <Link href="/" className="ghost-button">กลับหน้าแรก</Link>
    </main>
  );

  if (session.done) return (
    <main className="study-shell summary-page">
      <SunMascot size={140} float />
      <h1>{session.leftPile.length ? `กองเล็กลง ${session.leftPile.length} คำ` : "ฝึกครบรอบแล้ว"}</h1>
      <p className="summary-lead">คำที่ออกจากกองจะกลับมาให้ทวนพรุ่งนี้อีกครั้ง ถ้ายังจำได้ จะเว้นห่างขึ้นเรื่อย ๆ</p>
      <div className="summary-stats"><div className="stat remembered"><strong>{session.leftPile.length}</strong><span>จำได้ ออกจากกอง</span></div><div className="stat learning"><strong>{session.stayed.length}</strong><span>ยังอยู่ในกอง</span></div></div>
      {stayedCards.length > 0 && <div className="retry-box"><p>ยังอยู่ในกอง พรุ่งนี้จะสุ่มเจออีก</p><div>{stayedCards.map((card) => <span key={card!.id}>{card!.term}</span>)}</div></div>}
      <Link href="/" className="primary-button full">กลับหน้าแรก</Link>
      <button className="ghost-button full" onClick={start}>สุ่มฝึกอีกรอบ</button>
    </main>
  );

  const completed = session.total - Math.min(session.queue.length, session.total);
  return (
    <main className="study-shell">
      <div className="study-top"><Link href="/" className="back-link"><ArrowLeft /> หยุดฝึก</Link><span>เหลือ {session.queue.length} ใบ</span></div>
      <div className="progress-track" aria-hidden="true"><div style={{ width: `${(completed / session.total) * 100}%` }} /></div>
      <button className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((value) => !value)} aria-label={flipped ? `ความหมาย ${current.meaning}` : `คำศัพท์ ${current.term} แตะเพื่อพลิก`}>
        <span className="flashcard-inner">
          <span className="flash-face flash-front"><span className="deck-tag">{current.deckTitle}</span><strong>{current.term}</strong><small>แตะการ์ดเพื่อดูความหมาย</small></span>
          <span className="flash-face flash-back"><small>{current.term}</small><strong>{current.meaning}</strong></span>
        </span>
      </button>
      <p className="sr-only" aria-live="polite">{flipped ? `ความหมาย: ${current.meaning}` : `คำศัพท์: ${current.term}`}</p>
      <div className={`answer-buttons ${flipped ? "visible" : ""}`} aria-hidden={!flipped}>
        <button className="answer-button forgot" onClick={() => answer("forgot")} tabIndex={flipped ? 0 : -1}><RotateCcw /> จำไม่ได้</button>
        <button className="answer-button remember" onClick={() => answer("remembered")} tabIndex={flipped ? 0 : -1}><Check /> จำได้</button>
      </div>
      <p className="keyboard-hint"><kbd>Space</kbd> พลิก · <kbd>←</kbd> จำไม่ได้ · <kbd>→</kbd> จำได้</p>
    </main>
  );
}
