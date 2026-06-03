import { useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { PageHeader } from "../../components/ui/PageHeader";
import {
  getDensityCellClass,
  TableDensityToggle,
  type TableDensity
} from "../../components/ui/TableDensityToggle";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoBoards, getTeamById } from "../../services/demoDataService";

export function BoardManagementPage() {
  const [density, setDensity] = useState<TableDensity>("comfortable");
  const cell = getDensityCellClass(density);

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Bang thi va phan cong"
        title="Quan ly bang cham"
        description="Moi team chi nam trong mot bang cua cung mot round. Judge chi cham team trong bang duoc phan cong."
        actions={<TableDensityToggle value={density} onChange={setDensity} />}
      />
      <section className="grid gap-md lg:grid-cols-2">
        {demoBoards.map((board) => (
          <article key={board.id} className="rounded-xl border border-outline-variant bg-surface-container p-lg">
            <div className="flex items-start justify-between gap-md">
              <div>
                <h2 className="font-headline-sm text-on-surface">{board.name}</h2>
                <p className="font-body-sm text-on-surface-variant">{board.round}</p>
              </div>
              <Badge tone={getStatusTone(board.status)}>{getStatusLabel(board.status)}</Badge>
            </div>
            <div className="mt-md overflow-x-auto">
              <table className="min-w-full text-left">
                <tbody className="table-divider font-body-sm text-on-surface">
                  <tr><td className={cell}>Mentor</td><td className={cell}>{board.mentor}</td></tr>
                  <tr><td className={cell}>Judge</td><td className={cell}>{board.judges.join(", ")}</td></tr>
                  <tr>
                    <td className={cell}>Doi thi</td>
                    <td className={cell}>
                      {board.teamIds.map((id) => getTeamById(id)?.name).filter(Boolean).join(", ")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
