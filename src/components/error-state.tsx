"use client";

import Link from "next/link";
import { SunMascot } from "@/components/sun-mascot";

export function ErrorState({ title, reset }: { title: string; reset: () => void }) {
  return (
    <main className="center-state">
      <SunMascot size={110} />
      <h1>{title}</h1>
      <p>ลองใหม่อีกครั้ง ถ้ายังไม่ได้ให้กลับหน้าแรก</p>
      <button type="button" className="btn btn-primary" onClick={reset}>ลองใหม่</button>
      <Link href="/" className="btn btn-ghost">กลับหน้าแรก</Link>
    </main>
  );
}
