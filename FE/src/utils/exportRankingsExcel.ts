import type { BoardRanking } from "../services/rankingApi";
import { downloadWorkbookSheet } from "./exportSpreadsheet";

export function downloadRankingsExcel(boards: BoardRanking[], filename: string) {
  const rows: Array<Record<string, string | number>> = [];
  for (const board of boards) {
    for (const entry of board.entries) {
      rows.push({
        board: board.boardName,
        round: board.roundName ?? "",
        rank: entry.rank,
        team: entry.teamName,
        slot: entry.slotNumber ?? "",
        average_score: entry.averageScore,
        judges_submitted: entry.submittedJudgeCount
      });
    }
  }
  downloadWorkbookSheet(rows, "Rankings", filename);
}
