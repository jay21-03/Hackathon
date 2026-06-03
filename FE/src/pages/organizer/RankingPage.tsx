import { useMemo, useState } from "react";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoScoreSheets, getRankingRows } from "../../services/readModelService";
import { formatNumber } from "../../utils/validation";

export function RankingPage() {
  const { notify } = useToast();
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
      <PageHeader
        eyebrow="Xep hang va chung ket"
        title="Bang xep hang theo bang thi"
        description="Xep hang chi tinh phieu cham da chot. Ban to chuc chon doi vao chung ket thu cong, khong tu dong lay top N."
        actions={
          <>
          <Badge tone="success">{submittedSheets} phieu da chot</Badge>
            <Badge tone="ai">Danh gia AI khong tinh diem</Badge>
          </>
        }
      />

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="table-header-bg">
              <tr className="font-label-sm text-on-surface-variant">
                <th className="px-md py-sm">Hang</th>
                <th className="px-md py-sm">Doi thi</th>
                <th className="px-md py-sm">Bang</th>
                <th className="px-md py-sm">Diem TB</th>
                <th className="px-md py-sm">Phieu da chot</th>
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
                        className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 font-label-md transition-colors ${
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
            Ket qua chi hien cong khai sau khi ban to chuc thuc hien cong bo.
          </p>
        </div>
        <ConfirmAction
          title="Chot danh sach chung ket?"
          message="Danh sach nay se duoc dung cho man cong bo ket qua. Hay kiem tra cac doi bi loai truoc khi tiep tuc."
          confirmLabel="Chot danh sach"
          onConfirm={() => notify(`Da chot ${finalistIds.length} doi vao chung ket.`, "success")}
        >
          <Button type="button" disabled={finalistIds.length === 0}>
            Chot danh sach chung ket
          </Button>
        </ConfirmAction>
      </section>
    </div>
  );
}
