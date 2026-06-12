import type { BoardRanking } from "../services/rankingApi";

/** Sắp xếp bảng theo vòng/bảng — phòng khi API trả thứ tự không ổn định. */
export function sortBoardRankings(boards: BoardRanking[]): BoardRanking[] {
  return [...boards].sort((a, b) => {
    const roundA = a.roundId ?? 0;
    const roundB = b.roundId ?? 0;
    if (roundA !== roundB) return roundA - roundB;
    return a.boardId - b.boardId;
  });
}

export function sortByName<T extends { name: string; id?: number }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => a.name.localeCompare(b.name, "vi") || (a.id ?? 0) - (b.id ?? 0)
  );
}
