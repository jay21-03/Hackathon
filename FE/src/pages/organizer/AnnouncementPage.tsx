import { useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoAnnouncements, type DemoAnnouncement } from "../../services/demoDataService";

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

export function AnnouncementPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<DemoAnnouncement[]>(demoAnnouncements);

  function publish(id: number) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status: "PUBLISHED" } : row)));
    notify("Da cong bo thong bao.", "success");
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Thong bao"
        title="Quan ly noi dung thong bao"
        description="Soan, hen lich va cong bo thong bao theo nhom nguoi nhan."
      />
      <section className="grid gap-md lg:grid-cols-3">
        {rows.map((row) => (
          <article key={row.id} className="rounded-xl border border-outline-variant bg-surface-container p-lg">
            <div className="flex items-start justify-between gap-md">
              <h2 className="font-headline-sm text-on-surface">{row.title}</h2>
              <Badge tone={getStatusTone(row.status)}>{getStatusLabel(row.status)}</Badge>
            </div>
            <p className="mt-sm font-body-sm text-on-surface-variant">Nguoi nhan: {row.audience}</p>
            <p className="font-body-sm text-on-surface-variant">Lich gui: {formatDate(row.scheduledAt)}</p>
            <Button type="button" className="mt-md w-full" onClick={() => publish(row.id)}>
              Cong bo
            </Button>
          </article>
        ))}
      </section>
    </div>
  );
}
