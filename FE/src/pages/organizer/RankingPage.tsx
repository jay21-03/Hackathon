import { useMemo, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoScoreSheets, getRankingRows } from "../../services/readModelService";
import { formatNumber } from "../../utils/validation";

export function RankingPage() {
  const rows = useMemo(() => getRankingRows(), []);
  const [finalistIds, setFinalistIds] = useState<number[]>([42]);
  const submittedSheets = demoScoreSheets.filter((sheet) => sheet.status === "SUBMITTED").length;

  function toggleFinalist(teamId: number) {
    setFinalistIds((current) =>
      current.includes(teamId)
        ? current.filter((id) => id !== teamId)
        : [...current, teamId]
    );
  }

  return (
    <div className="space-y-lg">
      <section className="flex flex-col gap-md border-b border-outline-variant pb-lg md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-label-sm normal-case text-primary">Ranking va chung ket</p>
          <h1 className="font-headline-lg text-on-surface">Bang xep hang theo bang thi</h1>
          <p className="mt-xs max-w-2xl font-body-md text-on-surface-variant">
            Ranking chi tinh score sheet da submit. Ban to chuc chon doi vao chung ket thu cong,
            khong tu dong lay top N.
          </p>
        </div>
        <div className="flex flex-wrap gap-sm">
          <Badge tone="success">{submittedSheets} phieu da submit</Badge>
          <Badge tone="ai">AI Review khong tinh diem</Badge>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="table-header-bg">
              <tr className="font-label-sm text-on-surface-variant">
                <th className="px-md py-sm">Hang</th>
                <th className="px-md py-sm">Doi thi</th>
                <th className="px-md py-sm">Bang</th>
                <th className="px-md py-sm">Diem TB</th>
                <th className="px-md py-sm">Phieu submit</th>
                <th className="px-md py-sm">Trang thai</th>
                <th className="px-md py-sm">Chung ket</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {rows.map((row, index) => {
                const selected = finalistIds.includes(row.team.id);
                return (
                  <tr key={row.team.id} className="font-body-sm text-on-surface">
                    <td className="px-md py-md">#{index + 1}</td>
                    <td className="px-md py-md">
                      <p className="font-label-md text-on-surface">{row.team.name}</p>
                      <p className="text-on-surface-variant">AI: {row.team.aiReviewScore}/100</p>
                    </td>
                    <td className="px-md py-md">{row.team.board}</td>
                    <td className="px-md py-md" data-testid={`rank-score-${row.team.id}`}>
                      {formatNumber(row.averageScore)}
                    </td>
                    <td className="px-md py-md">{row.submittedCount}</td>
                    <td className="px-md py-md">
                      <Badge tone={getStatusTone(row.team.status)}>
                        {getStatusLabel(row.team.status)}
                      </Badge>
                    </td>
                    <td className="px-md py-md">
                      <button
                        type="button"
                        data-testid={`finalist-${row.team.id}`}
                        onClick={() => toggleFinalist(row.team.id)}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-label-md ${
                          selected
                            ? "border-secondary/40 bg-secondary-container text-on-secondary-container"
                            : "border-outline-variant text-on-surface-variant hover:bg-surface-variant"
                        }`}
                      >
                        <Icon name={selected ? "check_circle" : "radio_button_unchecked"} />
                        {selected ? "Da chon" : "Chon"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-md rounded-xl border border-outline-variant bg-surface-container p-lg md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-label-md text-on-surface">
            Da chon {finalistIds.length} doi vao chung ket
          </p>
          <p className="font-body-sm text-on-surface-variant">
            Ket qua chi public sau khi ban to chuc thuc hien cong bo.
          </p>
        </div>
        <Button type="button" disabled={finalistIds.length === 0}>
          Luu danh sach chung ket
        </Button>
      </section>
    </div>
  );
}
