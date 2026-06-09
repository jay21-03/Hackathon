import type { BoardRanking } from "../services/rankingApi";

export function downloadRankingsPdf(boards: BoardRanking[], filename: string) {
  const rows = boards
    .flatMap((board) =>
      board.entries.map(
        (entry) =>
          `<tr><td>${escapeHtml(board.boardName)}</td><td>${escapeHtml(board.roundName ?? "")}</td><td>${entry.rank}</td><td>${escapeHtml(entry.teamName)}</td><td>${entry.slotNumber ?? ""}</td><td>${Number(entry.averageScore).toFixed(2)}</td><td>${entry.submittedJudgeCount}</td></tr>`
      )
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bảng xếp hạng</title>
<style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px}h1{font-size:18px}table{border-collapse:collapse;width:100%;margin-top:16px}th,td{border:1px solid #ccc;padding:8px;text-align:left;font-size:12px}th{background:#f5f5f5}</style>
</head><body><h1>Bảng xếp hạng</h1>
<table><thead><tr><th>Bảng</th><th>Vòng</th><th>Hạng</th><th>Đội</th><th>Vị trí</th><th>Điểm TB</th><th>GK đã nộp</th></tr></thead><tbody>${rows}</tbody></table>
<script>window.onload=function(){window.print();}</script></body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("Trình duyệt chặn cửa sổ in — cho phép popup và thử lại.");
  }
  win.document.title = filename;
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
