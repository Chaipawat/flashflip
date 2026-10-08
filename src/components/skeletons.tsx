export function HomeSkeleton() {
  return (
    <main className="page-shell" aria-busy="true" aria-label="กำลังโหลด">
      <div className="skeleton sk-topbar" />
      <div className="skeleton sk-title" />
      <div className="skeleton sk-pill" />
      <div className="skeleton sk-card" />
      <div className="skeleton sk-row" />
      <div className="skeleton sk-row" />
    </main>
  );
}

export function AddSkeleton() {
  return (
    <main className="page-shell" aria-busy="true" aria-label="กำลังโหลด">
      <div className="skeleton sk-topbar" />
      <div className="skeleton sk-title" />
      <div className="skeleton sk-pill" />
      <div className="skeleton sk-card" />
    </main>
  );
}

export function DeckSkeleton() {
  return (
    <main className="page-shell" aria-busy="true" aria-label="กำลังโหลด">
      <div className="skeleton sk-topbar" />
      <div className="skeleton sk-title" />
      <div className="skeleton sk-pill" />
      <div className="skeleton sk-row" />
      <div className="skeleton sk-row" />
      <div className="skeleton sk-row" />
    </main>
  );
}

export function StudySkeleton() {
  return (
    <main className="page-shell" aria-busy="true" aria-label="กำลังโหลด">
      <div className="skeleton sk-topbar" />
      <div className="skeleton sk-row" />
      <div className="skeleton sk-flash" />
    </main>
  );
}
