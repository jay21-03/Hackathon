import { useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { getRankingRows } from "../../services/readModelService";
import { formatNumber } from "../../utils/validation";

export function FinalsPage() {
  const rows = getRankingRows();
  const [finalistIds, setFinalistIds] = useState<number[]>([42, 87]);

  function toggle(teamId: number) {
    setFinalistIds((current) =>
      current.includes(teamId) ? current.filter((id) => id !== teamId) : [...current, teamId]
    );
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Chung ket"
        title="Chon doi vao chung ket"
        description="Ban to chuc chon doi vao chung ket thu cong, khong tu dong lay top N."
        actions={<Badge tone="active">{finalistIds.length} doi da chon</Badge>}
      />
      <section className="grid gap-md lg:grid-cols-2">
        {rows.map((row, index) => {
          const selected = finalistIds.includes(row.team.id);
          return (
            <article key={row.team.id} className="rounded-xl border border-outline-variant bg-surface-container p-lg">
              <div className="flex items-start justify-between gap-md">
                <div>
                  <p className="font-label-sm normal-case text-on-surface-variant">Hang #{index + 1}</p>
                  <h2 className="font-headline-sm text-on-surface">{row.team.name}</h2>
                  <p className="font-body-sm text-on-surface-variant">{row.team.board} - {formatNumber(row.averageScore)} diem</p>
                </div>
                <Button type="button" variant={selected ? "primary" : "ghost"} onClick={() => toggle(row.team.id)}>
                  {selected ? "Da chon" : "Chon"}
                </Button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
