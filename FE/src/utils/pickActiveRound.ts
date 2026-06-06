/** Minimal round shape for active-round resolution. */
export type RoundScheduleLike = {
  id: number;
  roundOrder: number;
  startAt: string;
  endAt: string;
};

/**
 * Picks the operative round for participants:
 * 1. Currently running (startAt <= now < endAt), lowest roundOrder
 * 2. Else nearest upcoming by startAt
 * 3. Else latest round by roundOrder (all ended)
 */
export function pickActiveRound<T extends RoundScheduleLike>(
  rounds: T[],
  now: Date = new Date()
): T | null {
  if (rounds.length === 0) return null;

  const sorted = [...rounds].sort((a, b) => a.roundOrder - b.roundOrder);
  const ts = now.getTime();

  const running = sorted.filter((round) => {
    const start = Date.parse(round.startAt);
    const end = Date.parse(round.endAt);
    return Number.isFinite(start) && Number.isFinite(end) && ts >= start && ts < end;
  });
  if (running.length > 0) return running[0];

  const upcoming = sorted
    .filter((round) => {
      const start = Date.parse(round.startAt);
      return Number.isFinite(start) && ts < start;
    })
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  if (upcoming.length > 0) return upcoming[0];

  return sorted[sorted.length - 1];
}

export function isRoundRunning(round: RoundScheduleLike, now: Date = new Date()): boolean {
  const ts = now.getTime();
  const start = Date.parse(round.startAt);
  const end = Date.parse(round.endAt);
  return Number.isFinite(start) && Number.isFinite(end) && ts >= start && ts < end;
}
