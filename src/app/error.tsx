"use client";

import { ErrorState } from "@/components/error-state";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <ErrorState title="มีบางอย่างสะดุด" reset={reset} />;
}
