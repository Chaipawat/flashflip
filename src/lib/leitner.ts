export const INTERVAL_DAYS = [1, 2, 4, 7, 14] as const;
export const BANGKOK_OFFSET_MINUTES = 7 * 60;

export function nextReviewState(
  current: { box: number },
  result: "remembered" | "forgot",
  now: Date,
): { box: number; dueAt: Date } {
  if (result === "forgot") return { box: 0, dueAt: new Date(now) };

  const box = Math.min(Math.max(current.box, 0) + 1, 5);
  const bangkokNow = new Date(now.getTime() + BANGKOK_OFFSET_MINUTES * 60_000);
  const bangkokMidnightAsUtc = Date.UTC(
    bangkokNow.getUTCFullYear(),
    bangkokNow.getUTCMonth(),
    bangkokNow.getUTCDate() + INTERVAL_DAYS[box - 1],
  );
  const dueAt = new Date(bangkokMidnightAsUtc - BANGKOK_OFFSET_MINUTES * 60_000);
  return { box, dueAt };
}
