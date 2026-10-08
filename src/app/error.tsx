"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="center-state">
      <h1>มีบางอย่างสะดุด</h1>
      <p>ลองโหลดหน้านี้ใหม่อีกครั้ง</p>
      <button className="primary-button" onClick={reset}>ลองใหม่</button>
    </main>
  );
}
