import type { EventAwards } from "../services/awardApi";
import { downloadWorkbookSheet } from "./exportSpreadsheet";

export function downloadAwardsExcel(awards: EventAwards, filename: string) {
  const rows: Array<Record<string, string | number>> = [];
  const sortedCategories = [...awards.categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id - b.id
  );
  for (const category of sortedCategories) {
    const winners = [...category.winners].sort(
      (a, b) => new Date(a.awardedAt).getTime() - new Date(b.awardedAt).getTime() || a.id - b.id
    );
    for (const winner of winners) {
      rows.push({
        award_category: category.name,
        award_code: category.code,
        team: winner.teamName,
        note: winner.note ?? "",
        prize_value: category.prizeValue ?? "",
        published: winner.published ? "yes" : "no"
      });
    }
  }
  downloadWorkbookSheet(rows, "Awards", filename);
}
