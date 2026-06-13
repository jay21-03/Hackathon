import type { AwardCategory } from "../services/awardApi";

export interface AwardRoundGroup {
  key: string;
  roundId: number | null;
  roundName: string;
  categories: AwardCategory[];
}

export function resolveRoundDisplayName(
  roundId: number | null | undefined,
  roundNameById: Record<number, string>
): string {
  if (roundId == null) return "Toàn cuộc thi";
  return roundNameById[roundId] ?? `Vòng #${roundId}`;
}

export function groupAwardCategoriesByRound(
  categories: AwardCategory[],
  roundNameById: Record<number, string>
): AwardRoundGroup[] {
  const groups: AwardRoundGroup[] = [];
  const indexByKey = new Map<string, number>();
  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  for (const category of sorted) {
    const roundId = category.roundId ?? null;
    const key = roundId != null ? `round-${roundId}` : "event-wide";
    if (!indexByKey.has(key)) {
      indexByKey.set(key, groups.length);
      groups.push({
        key,
        roundId,
        roundName: resolveRoundDisplayName(roundId, roundNameById),
        categories: []
      });
    }
    groups[indexByKey.get(key)!].categories.push(category);
  }
  return groups;
}

export interface AwardRankingRow {
  teamId: number;
  teamName: string;
  rank: number;
  score: number;
  boardId: number;
  boardName: string;
  roundId: number | null;
  roundName: string;
}
