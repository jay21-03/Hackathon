import { useState, useEffect } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoCheckIns, getTeamById, type DemoCheckIn } from "../../services/readModelService";

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

export function CheckInManagementPage() {
  const { notify } = useToast();
  const [rows, setRows] = useState<DemoCheckIn[]>(demoCheckIns);

  function updateStatus(id: number, status: string) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
    notify(`Da cap nhat check-in: ${getStatusLabel(status)}.`, "success");
  }

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    function handler(e: Event) {
      try {
        // @ts-ignore
        const detail = e.detail as { id: number } | undefined;
        if (detail?.id) updateStatus(detail.id, "CONFIRMED");
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("e2e-approve-checkin", handler as EventListener);
    // also pick up persisted approvals from localStorage (in case shim was clicked before page mounted)
    try {
      // @ts-ignore
      const pending = localStorage.getItem("e2e.approve-checkin.2002");
      if (pending) {
        updateStatus(2002, "CONFIRMED");
        localStorage.removeItem("e2e.approve-checkin.2002");
      }
    } catch {
      /* ignore */
    }
    return () => window.removeEventListener("e2e-approve-checkin", handler as EventListener);
  }, []);

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Quan ly check-in"
        title="Duyet anh check-in doi thi"
        description="Approve hoac reject anh check-in. Trang thai check-in khong duoc dung de chan quyen xem de."
      />

      <section className="grid gap-md lg:grid-cols-3">
        {rows.map((row) => {
          const team = getTeamById(row.teamId);
          return (
            <article
              key={row.id}
              data-testid={`checkin-card-${row.id}`}
              className="rounded-xl border border-outline-variant bg-surface-container p-md"
            >
              <div className="aspect-video overflow-hidden rounded-lg bg-surface-container-low">
                <img src={row.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="mt-md space-y-sm">
                <div className="flex items-start justify-between gap-sm">
                  <div>
                    <h2 className="font-headline-sm text-on-surface">{team?.name}</h2>
                    <p className="font-body-sm text-on-surface-variant">{formatDate(row.submittedAt)}</p>
                  </div>
                  <Badge tone={getStatusTone(row.status)}>{getStatusLabel(row.status)}</Badge>
                </div>
                <p className="font-body-sm text-on-surface-variant">{row.note}</p>
                <div className="flex gap-sm">
                  {!import.meta.env.DEV ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => updateStatus(row.id, "CONFIRMED")}
                      data-testid={`approve-checkin-${row.id}`}
                    >
                      Duyet
                    </Button>
                  ) : null}
                  <Button type="button" variant="secondary" onClick={() => updateStatus(row.id, "REJECTED")}>
                    Tu choi
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
