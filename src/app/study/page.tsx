import { StudyPageClient } from "./study-page-client";

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ deck?: string; all?: string }>;
}) {
  const { deck, all } = await searchParams;
  return <StudyPageClient deckId={deck} practiceAll={all === "1"} />;
}
