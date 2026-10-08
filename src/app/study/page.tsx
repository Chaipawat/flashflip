import { StudyPageClient } from "./study-page-client";

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ deck?: string }>;
}) {
  const { deck } = await searchParams;
  return <StudyPageClient deckId={deck} />;
}
