import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { StatCard } from "../../components/ui/StatCard";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoScoreSheets, getScoringProgressRows } from "../../services/readModelService";

export function ScoringProgressPage() {
  const rows = getScoringProgressRows();
  const submitted = demoScoreSheets.filter((sheet) => sheet.status === "SUBMITTED").length;
  const progress = Math.round((submitted / demoScoreSheets.length) * 100);

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Tien do cham diem"
        title="Theo doi phieu cham"
        description="Xep hang chi tinh phieu cham da chot. Ban nhap khong duoc tinh vao diem trung binh."
        actions={<ButtonLink to="/organizer/ranking" icon={<Icon name="leaderboard" />}>Xem xep hang</ButtonLink>}
      />

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Da chot" value={submitted} helper="Duoc tinh xep hang" icon="task_alt" tone="success" />
        <StatCard label="Ban nhap" value={demoScoreSheets.length - submitted} helper="Chua tinh diem" icon="edit_note" tone="warning" />
        <StatCard label="Tien do" value={`${progress}%`} helper="Theo tat ca phieu cham" icon="donut_large" tone="primary">
          <ProgressBar value={progress} />
        </StatCard>
      </section>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="table-header-bg">
              <tr className="font-label-sm text-on-surface-variant">
                <th className="px-md py-sm">Doi thi</th>
                <th className="px-md py-sm">Bang</th>
                <th className="px-md py-sm">Da chot</th>
                <th className="px-md py-sm">Ban nhap</th>
                <th className="px-md py-sm">Trang thai</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {rows.map((row) => (
                <tr key={row.team.id} className="font-body-sm text-on-surface">
                  <td className="px-md py-md">{row.team.name}</td>
                  <td className="px-md py-md">{row.team.board}</td>
                  <td className="px-md py-md">{row.submitted}/{row.totalSheets}</td>
                  <td className="px-md py-md">{row.draft}</td>
                  <td className="px-md py-md">
                    <Badge tone={row.complete ? "success" : "warning"}>
                      {row.complete ? "Hoan tat" : "Dang cham"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
