import { DeckPageClient } from "./deck-page-client";

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DeckPageClient deckId={id} />;
}
