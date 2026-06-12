import type { EventAwards } from "../services/awardApi";

export function downloadAwardsCsv(awards: EventAwards, filename: string) {
  const lines = ["award_category,award_code,team,note,prize_value,published"];
  const sortedCategories = [...awards.categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id - b.id
  );
  for (const category of sortedCategories) {
    const winners = [...category.winners].sort(
      (a, b) => new Date(a.awardedAt).getTime() - new Date(b.awardedAt).getTime() || a.id - b.id
    );
    for (const winner of winners) {
      lines.push(
        [
          csvCell(category.name),
          csvCell(category.code),
          csvCell(winner.teamName),
          csvCell(winner.note ?? ""),
          csvCell(category.prizeValue ?? ""),
          winner.published ? "yes" : "no"
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
