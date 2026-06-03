import { useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import {
  getDensityCellClass,
  TableDensityToggle,
  type TableDensity
} from "../../components/ui/TableDensityToggle";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoInvitations, type DemoInvitation } from "../../services/readModelService";

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

export function InvitationManagementPage() {
  const { notify } = useToast();
  const [density, setDensity] = useState<TableDensity>("comfortable");
  const [rows, setRows] = useState<DemoInvitation[]>(demoInvitations);
  const cell = getDensityCellClass(density);

  function resend(id: number) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status: "PENDING" } : row)));
    notify("Da gui lai loi moi.", "success");
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Loi moi mentor va judge"
        title="Theo doi trang thai loi moi"
        description="Moi mentor/judge theo bang thi, theo doi xac nhan truoc khi cham diem."
        actions={<TableDensityToggle value={density} onChange={setDensity} />}
      />
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="table-header-bg">
              <tr className="font-label-sm text-on-surface-variant">
                <th className={cell}>Email</th>
                <th className={cell}>Vai tro</th>
                <th className={cell}>Bang</th>
                <th className={cell}>Da gui</th>
                <th className={cell}>Trang thai</th>
                <th className={cell}>Thao tac</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {rows.map((row) => (
                <tr key={row.id} className="font-body-sm text-on-surface">
                  <td className={cell}>{row.email}</td>
                  <td className={cell}>{row.role}</td>
                  <td className={cell}>{row.board}</td>
                  <td className={cell}>{formatDate(row.sentAt)}</td>
                  <td className={cell}><Badge tone={getStatusTone(row.status)}>{getStatusLabel(row.status)}</Badge></td>
                  <td className={cell}><Button type="button" variant="ghost" onClick={() => resend(row.id)}>Gui lai</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
