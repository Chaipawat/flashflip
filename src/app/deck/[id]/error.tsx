"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="center-state"><h1>เปิดกองนี้ไม่สำเร็จ</h1><button className="primary-button" onClick={reset}>ลองใหม่</button></main>; }
