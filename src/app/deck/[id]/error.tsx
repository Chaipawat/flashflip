"use client";

import { ErrorState } from "@/components/error-state";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <ErrorState title="เปิดกองนี้ไม่สำเร็จ" reset={reset} />;
}
