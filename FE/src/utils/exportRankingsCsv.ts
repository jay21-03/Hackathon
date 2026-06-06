import type { BoardRanking } from "../services/rankingApi";

export function downloadRankingsCsv(boards: BoardRanking[], filename: string) {
  const lines = ["board,round,rank,team,slot,average_score,judges_submitted"];
  for (const board of boards) {
    for (const entry of board.entries) {
      lines.push(
        [
          csvCell(board.boardName),
          csvCell(board.roundName ?? ""),
          entry.rank,
          csvCell(entry.teamName),
          entry.slotNumber ?? "",
          entry.averageScore,
          entry.submittedJudgeCount
        ].join(",")
      );
    }
  }
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string) {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}
