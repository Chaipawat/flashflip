"use client";

import { ErrorState } from "@/components/error-state";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <ErrorState title="เปิดหน้าเพิ่มคำไม่สำเร็จ" reset={reset} />;
}
