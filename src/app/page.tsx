"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Layers3, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { isCardDue, useAppData } from "@/components/app-provider";
import { SunMascot } from "@/components/sun-mascot";

const COLORS = ["purple", "pink", "sun", "mint"];

export default function HomePage() {
  const { data, ready, createDeck } = useAppData();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const dueCards = data.cards.filter((card) => isCardDue(card.id, data.reviews));

  function submitDeck(event: React.FormEvent) {
    event.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    const deck = createDeck(clean);
    toast.success(`สร้างกอง “${clean}” แล้ว`);
    router.push(`/add?deck=${deck.id}`);
  }

  if (!ready) return <HomeSkeleton />;

  return (
    <main className="page-shell home-page">
      <AppHeader />
      <section className="home-intro">
        <p className="eyebrow">จำทีละนิด แต่จำได้จริง</p>
        <h1>เก่งขึ้นอีกนิดทุกวัน</h1>
        <Link href="/add" className="quick-add">
          <Plus aria-hidden="true" />
          <span>พิมพ์คำอังกฤษที่อยากจำ…</span>
          <span className="quick-go"><ArrowRight /></span>
        </Link>
      </section>

      <section className="pile-hero" aria-labelledby="pile-heading">
        <span className="pile-layer pile-layer-one" aria-hidden="true" />
        <span className="pile-layer pile-layer-two" aria-hidden="true" />
        <SunMascot size={104} float />
        <div className="pile-copy">
          {dueCards.length > 0 && (
            <p className="word-peek">{dueCards.slice(0, 4).map((card) => card.term).join(" · ")}</p>
          )}
          <h2 id="pile-heading">
            {dueCards.length
              ? <>กองคำที่ยังจำไม่ได้<br /><strong>{dueCards.length}</strong> คำ</>
              : data.cards.length
                ? "ไม่มีคำค้างในกองแล้ว"
                : "เริ่มจากเพิ่มคำแรกที่อยากจำ"}
          </h2>
          <Link href={dueCards.length ? "/study" : "/add"} className="primary-button">
            {dueCards.length ? `สุ่มฝึก ${Math.min(dueCards.length, 20)} คำ` : "เพิ่มคำใหม่"}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="deck-section" aria-labelledby="my-decks">
        <div className="section-heading"><h2 id="my-decks">กองของฉัน</h2></div>
        {data.decks.length ? (
          <ul className="deck-list">
            {data.decks.map((deck, index) => {
              const cards = data.cards.filter((card) => card.deckId === deck.id);
              const due = cards.filter((card) => isCardDue(card.id, data.reviews)).length;
              return (
                <li key={deck.id}>
                  <Link href={`/deck/${deck.id}`} className="deck-row">
                    <span className={`deck-icon ${COLORS[index % COLORS.length]}`}><Layers3 /></span>
                    <span className="deck-name"><strong>{deck.title}</strong><small>{cards.length} คำ</small></span>
                    <span className={`status-pill ${due ? "learning" : "remembered"}`}>
                      {due ? `ยังจำไม่ได้ ${due}` : "จำได้ครบ"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="empty-inline">ยังไม่มีกอง ลองสร้างกองแรกของคุณ</div>
        )}

        {creating ? (
          <form className="create-deck-form" onSubmit={submitDeck}>
            <label htmlFor="deck-title">ชื่อกองใหม่</label>
            <div><input id="deck-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={60} placeholder="เช่น ศัพท์จากซีรีส์" autoFocus />
            <button className="primary-button compact" disabled={!title.trim()}>สร้าง</button></div>
          </form>
        ) : (
          <button className="ghost-button full" onClick={() => setCreating(true)}><Plus /> สร้างกองใหม่</button>
        )}
      </section>
    </main>
  );
}

function HomeSkeleton() {
  return <main className="page-shell"><div className="skeleton header-skeleton" /><div className="skeleton title-skeleton" /><div className="skeleton hero-skeleton" /><div className="skeleton row-skeleton" /></main>;
}
