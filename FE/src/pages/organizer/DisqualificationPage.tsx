import { useState } from "react";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { PageHeader } from "../../components/ui/PageHeader";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoViolations, getTeamById, type DemoViolation } from "../../services/demoDataService";

export function DisqualificationPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<DemoViolation[]>(demoViolations);

  function disqualify(id: number) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status: "DISQUALIFIED" } : row)));
    notify("Da danh dau doi bi loai.", "success");
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Xu ly vi pham"
        title="Loai doi khi co vi pham"
        description="Thao tac loai doi can xac nhan vi anh huong den xep hang va ket qua cong khai."
      />
      <section className="grid gap-md lg:grid-cols-2">
        {rows.map((row) => {
          const team = getTeamById(row.teamId);
          return (
            <article key={row.id} className="rounded-xl border border-outline-variant bg-surface-container p-lg">
              <div className="flex items-start justify-between gap-md">
                <div>
                  <h2 className="font-headline-sm text-on-surface">{team?.name}</h2>
                  <p className="mt-xs font-body-sm text-on-surface-variant">{row.reason}</p>
                </div>
                <Badge tone={row.severity === "HIGH" ? "danger" : "warning"}>{row.severity}</Badge>
              </div>
              <div className="mt-md flex items-center justify-between gap-md">
                <Badge tone={getStatusTone(row.status)}>{getStatusLabel(row.status)}</Badge>
                <ConfirmAction
                  title="Xac nhan loai doi"
                  message="Doi bi loai se khong duoc tinh ranking va khong hien trong ket qua hop le."
                  confirmLabel="Loai doi"
                  onConfirm={() => disqualify(row.id)}
                >
                  <button className="btn-secondary" type="button">Loai doi</button>
                </ConfirmAction>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
