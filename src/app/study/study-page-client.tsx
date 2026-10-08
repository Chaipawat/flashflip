"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Check, Flame, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/app-header";
import { dueCardIds, useAppData } from "@/components/app-provider";
import { StudySkeleton } from "@/components/skeletons";
import { SunMascot } from "@/components/sun-mascot";
import { nextReviewState } from "@/lib/leitner";
import { createSession, persistDecision, sessionReducer } from "@/lib/study-session";
import type { StudyCard } from "@/lib/types";

const EMPTY_SESSION = createSession([]);
const SWIPE_THRESHOLD = 90;
const FLY_OUT_MS = 340;

type Result = "remembered" | "forgot";
type Ghost = { card: StudyCard; result: Result; id: number };

/**
 * practiceAll: drill every card in the deck, even ones already out of the pile.
 * Forgetting still puts a card back in the pile, but remembering a card that wasn't
 * due leaves its schedule alone, so extra practice can't push reviews further out.
 */
export function StudyPageClient({ deckId, practiceAll = false }: { deckId?: string; practiceAll?: boolean }) {
  const { data, ready, saveReview } = useAppData();
  const [session, dispatch] = useReducer(sessionReducer, EMPTY_SESSION);
  const [started, setStarted] = useState(false);
  const [flipped, setFlipped] = useState(false);
  // Bumped on every answer so the card remounts face-up instead of animating back
  // (which would briefly reveal the next card's meaning).
  const [turn, setTurn] = useState(0);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [streak, setStreak] = useState(0);
  const [dragX, setDragX] = useState(0);
  const drag = useRef<{ startX: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const dueIds = useMemo(() => dueCardIds(data), [data]);
  const pool = useMemo<StudyCard[]>(() => {
    const boxes = new Map(data.reviews.map((review) => [review.cardId, review.box]));
    const titles = new Map(data.decks.map((deck) => [deck.id, deck.title]));
    return data.cards
      .filter((card) => (!deckId || card.deckId === deckId) && (practiceAll || dueIds.has(card.id)))
      .map((card) => ({
        id: card.id,
        term: card.term,
        meaning: card.meaning,
        box: boxes.get(card.id) ?? 0,
        deckTitle: titles.get(card.deckId) ?? "กองของฉัน",
      }));
  }, [data, deckId, dueIds, practiceAll]);

  const start = useCallback(() => {
    dispatch({ type: "reset", state: createSession(pool) });
    setFlipped(false);
    setStreak(0);
    setGhost(null);
    setTurn((value) => value + 1);
    setStarted(true);
  }, [pool]);

  useEffect(() => {
    if (ready && !started) queueMicrotask(start);
  }, [ready, start, started]);

  useEffect(() => {
    if (!ghost) return;
    // A timer rather than animationend: with reduced motion the animation never runs.
    const timer = window.setTimeout(() => setGhost(null), FLY_OUT_MS);
    return () => window.clearTimeout(timer);
  }, [ghost]);

  const answer = useCallback((result: Result) => {
    const current = session.queue[0];
    if (!current || !flipped) return;
    const decision = persistDecision(session, current.id, result);
    const keepSchedule = practiceAll && result === "remembered" && !dueIds.has(current.id);
    if (decision !== "skip" && !keepSchedule) {
      const now = new Date();
      const next = nextReviewState({ box: current.box }, result, now);
      saveReview({ cardId: current.id, box: next.box, dueAt: next.dueAt.toISOString(), lastReviewedAt: now.toISOString() });
    }
    if (result === "forgot") toast("เดี๋ยวคำนี้จะวนกลับมาอีกครั้ง");
    setGhost({ card: current, result, id: turn });
    setStreak((value) => (result === "remembered" ? value + 1 : 0));
    dispatch({ type: "answer", result });
    setFlipped(false);
    setDragX(0);
    setTurn((value) => value + 1);
    // The answer buttons hide again, so hand focus to the new card for keyboard users.
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".flip")?.focus({ preventScroll: true }));
  }, [dueIds, flipped, practiceAll, saveReview, session, turn]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.code === "Space") {
        if (target.closest("button, a")) return;
        event.preventDefault();
        setFlipped((value) => !value);
      } else if (event.key === "ArrowLeft") answer("forgot");
      else if (event.key === "ArrowRight") answer("remembered");
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [answer]);

  // Swipe (touch or mouse) once the card shows its meaning: right = remembered, left = forgot.
  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    suppressClick.current = false;
    if (!flipped) return;
    drag.current = { startX: event.clientX, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!drag.current) return;
    const delta = event.clientX - drag.current.startX;
    if (Math.abs(delta) > 6) drag.current.moved = true;
    setDragX(delta);
  }

  function onPointerUp() {
    if (!drag.current) return;
    const moved = drag.current.moved;
    drag.current = null;
    if (dragX > SWIPE_THRESHOLD) answer("remembered");
    else if (dragX < -SWIPE_THRESHOLD) answer("forgot");
    else {
      // Snapped back: swallow the click this drag produces so it doesn't flip the card.
      // (After a real swipe the card remounts, so no click arrives and nothing is swallowed.)
      suppressClick.current = moved;
      setDragX(0);
    }
  }

  function onCardClick() {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setFlipped((value) => !value);
  }

  if (!ready || !started) return <StudySkeleton />;

  const current = session.queue[0];
  const terms = new Map(data.cards.map((card) => [card.id, card.term]));
  const stayedTerms = session.stayed.map((id) => terms.get(id)).filter((term): term is string => Boolean(term));

  if (!session.total) {
    return (
      <main className="center-state">
        <SunMascot size={110} />
        <h1>กองนี้ไม่มีคำค้างแล้ว</h1>
        <p>เพิ่มคำใหม่ที่อยากจำ แล้วกลับมาสุ่มฝึกได้เลย</p>
        <Link href={deckId ? `/add?deck=${deckId}` : "/add"} className="btn btn-primary">เพิ่มคำ</Link>
        <Link href="/" className="btn btn-ghost">กลับหน้าแรก</Link>
      </main>
    );
  }

  if (session.done) {
    const cleared = session.leftPile.length;
    return (
      <main className="page-shell">
        <section className="summary">
          {cleared > 0 && <Confetti />}
          <SunMascot size={110} float />
          {practiceAll ? (
            <>
              <h1>ทวนครบทั้งกองแล้ว</h1>
              <p className="lead">คำที่จำไม่ได้ถูกใส่กลับเข้ากองแล้ว จะสุ่มเจอในรอบฝึกปกติ ส่วนคำที่จำได้ยังนัดทวนตามเดิม</p>
            </>
          ) : (
            <>
              <h1>{cleared ? `กองเล็กลง ${cleared} คำ` : "ฝึกครบรอบแล้ว"}</h1>
              <p className="lead">คำที่ออกจากกองจะกลับมาให้ทวนพรุ่งนี้อีกครั้ง ถ้ายังจำได้ จะเว้นห่างขึ้นเรื่อย ๆ</p>
            </>
          )}
          <div className="stats">
            <div className="stat remembered"><b>{cleared}</b><span>{practiceAll ? "จำได้" : "จำได้ ออกจากกอง"}</span></div>
            <div className="stat learning"><b>{session.stayed.length}</b><span>{practiceAll ? "กลับเข้ากอง" : "ยังอยู่ในกอง"}</span></div>
          </div>
          {stayedTerms.length > 0 && (
            <div className="retry">
              <p>ยังอยู่ในกอง พรุ่งนี้จะสุ่มเจออีก</p>
              <div>{stayedTerms.map((term, index) => <span key={`${term}-${index}`}>{term}</span>)}</div>
            </div>
          )}
          <Link href="/" className="btn btn-primary">กลับหน้าแรก</Link>
          <button type="button" className="btn btn-ghost" onClick={start}>สุ่มฝึกอีกรอบ</button>
        </section>
      </main>
    );
  }

  const completed = session.total - Math.min(session.queue.length, session.total);
  const behind = Math.min(session.queue.length - 1, 2);
  const swipeStrength = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);
  const dragging = dragX !== 0;

  return (
    <main className="page-shell study">
      <Topbar>
        <Link href={deckId ? `/deck/${deckId}` : "/"} className="iconbtn"><X aria-hidden="true" /> หยุดฝึก</Link>
        <div className="tally" aria-label={`ออกจากกอง ${session.leftPile.length} คำ ยังอยู่ในกอง ${session.stayed.length} คำ`}>
          {streak >= 3 && <span key={streak} className="tally-chip streak"><Flame aria-hidden="true" /> {streak}</span>}
          <span className="tally-chip remembered"><Check aria-hidden="true" /> {session.leftPile.length}</span>
          <span className="tally-chip learning"><RotateCcw aria-hidden="true" /> {session.stayed.length}</span>
        </div>
      </Topbar>
      <div
        className="progress"
        role="progressbar"
        aria-label="ความคืบหน้า"
        aria-valuemin={0}
        aria-valuemax={session.total}
        aria-valuenow={completed}
      >
        <div style={{ width: `${(completed / session.total) * 100}%` }} />
      </div>
      <p className="left">เหลือ {session.queue.length} ใบ</p>

      <div className="stage">
        {behind >= 2 && <span className="stack-layer two" aria-hidden="true" />}
        {behind >= 1 && <span className="stack-layer one" aria-hidden="true" />}

        <button
          key={turn}
          type="button"
          className={`flip deal-in${flipped ? " flipped" : ""}${dragging ? " dragging" : ""}`}
          style={dragging ? { transform: `translateX(${dragX}px) rotate(${dragX / 18}deg)` } : undefined}
          onClick={onCardClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-label={flipped ? `ความหมายของ ${current.term}: ${current.meaning}` : `คำศัพท์ ${current.term} แตะเพื่อดูความหมาย`}
        >
          <span className="flip-inner">
            <span className="face front">
              <span className="from">{current.deckTitle}</span>
              <span className="term">{current.term}</span>
              <BoxLevel box={current.box} />
              <span className="tap">แตะการ์ดเพื่อดูความหมาย</span>
            </span>
            <span className="face back">
              <span className="small">{current.term}</span>
              <span className="meaning">{current.meaning}</span>
              <span className="swipe-hint">ปัดขวา = จำได้ · ปัดซ้าย = จำไม่ได้</span>
            </span>
          </span>
          {dragging && (
            <span
              className={`stamp ${dragX > 0 ? "remembered" : "forgot"}`}
              style={{ opacity: swipeStrength }}
              aria-hidden="true"
            >
              {dragX > 0 ? "จำได้" : "จำไม่ได้"}
            </span>
          )}
        </button>

        {ghost && (
          <span key={ghost.id} className={`ghost ${ghost.result}`} aria-hidden="true">
            <span className="face back">
              <span className="small">{ghost.card.term}</span>
              <span className="meaning">{ghost.card.meaning}</span>
            </span>
          </span>
        )}
      </div>
      <p className="sr-only" aria-live="polite">{flipped ? `ความหมาย: ${current.meaning}` : `คำศัพท์: ${current.term}`}</p>

      <div className={`answers${flipped ? " show" : ""}`}>
        <button type="button" className="ans forgot" onClick={() => answer("forgot")}><RotateCcw strokeWidth={2.2} aria-hidden="true" /> จำไม่ได้</button>
        <button type="button" className="ans remember" onClick={() => answer("remembered")}><Check strokeWidth={2.6} aria-hidden="true" /> จำได้</button>
      </div>
      <p className="keys"><kbd>Space</kbd> พลิก &nbsp; <kbd>←</kbd> จำไม่ได้ &nbsp; <kbd>→</kbd> จำได้</p>
    </main>
  );
}

/** Five dots for the Leitner box, so each card shows how well it is known. */
function BoxLevel({ box }: { box: number }) {
  return (
    <span className="box-level">
      <span className="dots" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => <i key={index} className={index < box ? "on" : ""} />)}
      </span>
      {box === 0 ? "ระดับเริ่มต้น" : `ระดับ ${box}/5`}
    </span>
  );
}

const CONFETTI_COLORS = ["#ffb3c7", "#ffe59e", "#b7e4c7", "#b49bfc"];

function Confetti() {
  return (
    <span className="confetti" aria-hidden="true">
      {Array.from({ length: 18 }, (_, index) => (
        <i
          key={index}
          style={{
            left: `${(index * 37 + 5) % 100}%`,
            background: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
            animationDelay: `${(index % 6) * 0.12}s`,
            animationDuration: `${2.2 + (index % 4) * 0.3}s`,
          }}
        />
      ))}
    </span>
  );
}
