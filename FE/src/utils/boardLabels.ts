import type { BoardResponse } from "../services/contestApi";
import type { BoardRanking } from "../services/rankingApi";

export function buildRoundNameById(rounds: { id: number; name: string }[]): Record<number, string> {
  return Object.fromEntries(rounds.map((round) => [round.id, round.name]));
}

/** Nhãn hiển thị: «Vòng · Bảng» — dùng cho dropdown, filter, tiêu đề. */
export function formatBoardWithRoundLabel(
  boardName: string,
  roundName?: string | null
): string {
  const name = boardName.trim() || "Bảng";
  if (!roundName) return name;
  return `${roundName} · ${name}`;
}

export function formatBoardResponseLabel(
  board: Pick<BoardResponse, "name" | "roundId">,
  roundNameById: Record<number, string>
): string {
  return formatBoardWithRoundLabel(board.name, roundNameById[board.roundId]);
}

export function formatBoardRankingLabel(board: Pick<BoardRanking, "boardName" | "roundName">): string {
  return formatBoardWithRoundLabel(board.boardName, board.roundName);
}

export function formatBoardLabelById(
  boardId: number | null | undefined,
  boardName: string | null | undefined,
  boards: Pick<BoardResponse, "id" | "name" | "roundId">[],
  roundNameById: Record<number, string>
): string {
  if (boardId == null && !boardName) return "—";
  const board = boardId != null ? boards.find((item) => item.id === boardId) : undefined;
  const name = boardName ?? board?.name ?? (boardId != null ? `Bảng #${boardId}` : "Bảng");
  const roundName = board?.roundId != null ? roundNameById[board.roundId] : undefined;
  return formatBoardWithRoundLabel(name, roundName);
}

export function formatRepositoryBoardLabel(
  row: { boardId?: number | null; roundId?: number | null; roundName?: string | null },
  boards: Pick<BoardResponse, "id" | "name" | "roundId">[],
  roundNameById: Record<number, string>
): string {
  const board = row.boardId != null ? boards.find((item) => item.id === row.boardId) : undefined;
  const roundName =
    row.roundName ??
    (row.roundId != null ? roundNameById[row.roundId] : undefined) ??
    (board?.roundId != null ? roundNameById[board.roundId] : undefined);
  const boardName = board?.name ?? (row.boardId != null ? `Bảng #${row.boardId}` : "—");
  return formatBoardWithRoundLabel(boardName, roundName);
}

export interface BoardRankingRoundGroup {
  key: string;
  roundId: number | null;
  roundName: string;
  boards: BoardRanking[];
}

export function groupBoardRankingsByRound(boards: BoardRanking[]): BoardRankingRoundGroup[] {
  const groups: BoardRankingRoundGroup[] = [];
  const indexByKey = new Map<string, number>();
  for (const board of boards) {
    const key = board.roundId != null ? `round-${board.roundId}` : `board-${board.boardId}`;
    if (!indexByKey.has(key)) {
      indexByKey.set(key, groups.length);
      groups.push({
        key,
        roundId: board.roundId ?? null,
        roundName: board.roundName ?? "Vòng",
        boards: []
      });
    }
    groups[indexByKey.get(key)!].boards.push(board);
  }
  return groups;
}
