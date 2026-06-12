import type { EventAwards } from "../services/awardApi";

export function downloadAwardsPdf(awards: EventAwards, filename: string) {
  const sortedCategories = [...awards.categories]
    .filter((c) => c.winners.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  const sections = sortedCategories
    .map((category) => {
      const winners = [...category.winners]
        .sort(
          (a, b) =>
            new Date(a.awardedAt).getTime() - new Date(b.awardedAt).getTime() || a.id - b.id
        )
        .map(
          (winner) =>
            `<li><strong>${escapeHtml(winner.teamName)}</strong>${winner.note ? ` — ${escapeHtml(winner.note)}` : ""}</li>`
        )
        .join("");
      const prize = category.prizeValue
        ? `<p class="prize">${escapeHtml(category.prizeValue)}</p>`
        : "";
      return `<section class="award"><h2>${escapeHtml(category.name)}</h2>${prize}<ul>${winners}</ul></section>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Kết quả trao giải</title>
<style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px;max-width:720px;margin:0 auto}h1{font-size:20px}.award{margin-top:20px;padding-top:12px;border-top:1px solid #ddd}h2{font-size:16px;margin:0 0 8px}.prize{color:#555;font-size:13px;margin:0 0 8px}ul{margin:0;padding-left:20px}li{margin:4px 0;font-size:14px}</style>
</head><body><h1>${escapeHtml(awards.eventName)} — Kết quả trao giải</h1>${sections}
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
