"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, ChevronRight, Layers, MessageCircle, Plus, Sparkles, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Brand, Topbar } from "@/components/app-header";
import { dueCardIds, useAppData } from "@/components/app-provider";
import { HomeSkeleton } from "@/components/skeletons";
import { SunMascot } from "@/components/sun-mascot";
import type { SampleDeck } from "@/lib/types";

export default function HomePage() {
  const { data, ready, createDeck, importSampleDecks } = useAppData();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [loadingSample, setLoadingSample] = useState(false);
  const dueIds = useMemo(() => dueCardIds(data), [data]);
  const dueCards = data.cards.filter((card) => dueIds.has(card.id));

  function submitDeck(event: React.FormEvent) {
    event.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    const deck = createDeck(clean);
    toast(`สร้างกอง “${clean}” แล้ว`);
    router.push(`/add?deck=${deck.id}`);
  }

  async function loadSample() {
    setLoadingSample(true);
    try {
      const mock = await import("@/data/mock-decks.json");
      const decks = mock.default.decks as SampleDeck[];
      importSampleDecks(decks);
      toast(`เพิ่มคำตัวอย่าง ${decks.reduce((sum, deck) => sum + deck.cards.length, 0)} คำ ใน ${decks.length} กองแล้ว`);
    } catch {
      toast.error("โหลดคำตัวอย่างไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setLoadingSample(false);
    }
  }

  if (!ready) return <HomeSkeleton />;

  const peek = dueCards.slice(0, 4).map((card) => card.term).join(" · ") + (dueCards.length > 4 ? " …" : "");
  const rememberedCount = data.cards.length - dueCards.length;
  // Newest deck first so a freshly created deck is at the top.
  const decks = [...data.decks].reverse();

  return (
    <main className="page-shell home">
      <Topbar><Brand /></Topbar>
      <div className="home-grid">
        <div className="home-main">
          <h1 className="greet">เก่งขึ้นอีกนิดทุกวัน</h1>
          <Link href="/add" className="quickadd">
            <Plus className="qa-plus" strokeWidth={2.8} aria-hidden="true" />
            พิมพ์คำอังกฤษที่อยากจำ…
            <span className="qa-go" aria-hidden="true"><ArrowRight strokeWidth={2.6} /></span>
          </Link>

          <section className="pilecard" aria-labelledby="pile-heading">
            <div className="pile-top">
              <SunMascot size={92} float />
              {dueCards.length > 0 && <p className="peek" aria-hidden="true">{peek}</p>}
              <h2 id="pile-heading">
                {dueCards.length
                  ? <>กองคำที่ยังจำไม่ได้<br /><b>{dueCards.length}</b> คำ</>
                  : data.cards.length
                    ? "ไม่มีคำค้างในกองแล้ว"
                    : "เริ่มจากเพิ่มคำแรกที่อยากจำ"}
              </h2>
              {data.cards.length > 0 && (
                <div className="pile-meta">
                  <span className="meter" aria-hidden="true"><span style={{ width: `${(rememberedCount / data.cards.length) * 100}%` }} /></span>
                  <span>จำได้แล้ว {rememberedCount} จาก {data.cards.length} คำ</span>
                </div>
              )}
              <Link href={dueCards.length ? "/study" : "/add"} className="btn btn-primary">
                {dueCards.length
                  ? `สุ่มฝึก ${Math.min(dueCards.length, 20)} คำ`
                  : data.cards.length ? "เพิ่มคำใหม่" : "เพิ่มคำแรก"}
              </Link>
              {data.cards.length === 0 && (
                <button type="button" className="btn btn-ghost" onClick={loadSample} disabled={loadingSample}>
                  <Sparkles strokeWidth={2.2} aria-hidden="true" /> ลองใช้ด้วยคำตัวอย่าง
                </button>
              )}
            </div>
          </section>
        </div>

        <section className="home-decks" aria-labelledby="my-decks">
          <div className="section-head">
            <h2 id="my-decks">กองของฉัน{decks.length > 0 && <span className="count">{decks.length}</span>}</h2>
            {!creating && (
              <button type="button" className="chipbtn" onClick={() => setCreating(true)}>
                <Plus strokeWidth={2.6} aria-hidden="true" /> สร้างกอง
              </button>
            )}
          </div>

          {creating && (
            <form className="newpile" onSubmit={submitDeck}>
              <label className="sr-only" htmlFor="deck-title">ชื่อกองใหม่</label>
              <input
                id="deck-title"
                className="field"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Escape") setCreating(false); }}
                maxLength={60}
                placeholder="ตั้งชื่อกอง เช่น ศัพท์จากเพลง"
                autoComplete="off"
                autoFocus
              />
              <button className="btn btn-primary btn-auto" disabled={!title.trim()}>สร้าง</button>
              <button type="button" className="iconbtn round" onClick={() => { setCreating(false); setTitle(""); }} aria-label="ยกเลิก">
                <X aria-hidden="true" />
              </button>
            </form>
          )}

          {decks.length > 0 ? (
            <ul className="list">
              {decks.map((deck, index) => {
                const cards = data.cards.filter((card) => card.deckId === deck.id);
                const due = cards.filter((card) => dueIds.has(card.id)).length;
                const remembered = cards.length - due;
                const Icon = DECK_ICONS[index % DECK_ICONS.length];
                return (
                  <li key={deck.id}>
                    <Link href={`/deck/${deck.id}`} className="row">
                      <span className={`bub c${index % 4}`} aria-hidden="true"><Icon strokeWidth={2.2} /></span>
                      <span className="rinfo">
                        <span className="rname">{deck.title}</span>
                        {cards.length > 0 ? (
                          <>
                            <span className="meter small" aria-hidden="true"><span style={{ width: `${(remembered / cards.length) * 100}%` }} /></span>
                            <span className="rmeta">จำได้ {remembered}/{cards.length} คำ</span>
                          </>
                        ) : <span className="rmeta">ยังไม่มีคำ แตะเพื่อเพิ่ม</span>}
                      </span>
                      {cards.length === 0
                        ? null
                        : due
                          ? <span className="pill learning">ค้าง {due}</span>
                          : <span className="pill remembered">จำได้ครบ</span>}
                      <ChevronRight className="rchev" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : !creating && (
            <p className="empty">ยังไม่มีกอง เพิ่มคำแรกแล้วระบบจะสร้าง “กองของฉัน” ให้ หรือกด “สร้างกอง” เพื่อแยกหมวดเอง</p>
          )}
        </section>
      </div>
    </main>
  );
}

const DECK_ICONS = [Layers, BookOpen, MessageCircle, Star];
