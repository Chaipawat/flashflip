import Link from "next/link";

export function AppHeader() {
  return (
    <header className="app-header">
      <Link href="/" className="brand" aria-label="FlashFlip หน้าแรก">
        <span className="brand-mark" aria-hidden="true"><i /><i /></span>
        FlashFlip
      </Link>
      <span className="local-badge">เก็บข้อมูลบนเครื่องนี้</span>
    </header>
  );
}
