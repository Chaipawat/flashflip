import { AddWordPage } from "./word-search";

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ deck?: string }>;
}) {
  const { deck } = await searchParams;
  return <AddWordPage initialDeckId={deck} />;
}
