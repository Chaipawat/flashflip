import Link from "next/link";
import type { ReactNode } from "react";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="FlashFlip หน้าแรก">
      <span className="brand-mark" aria-hidden="true"><i /><i /></span>
      FlashFlip
    </Link>
  );
}

export function Topbar({ children }: { children: ReactNode }) {
  return <header className="topbar">{children}</header>;
}
