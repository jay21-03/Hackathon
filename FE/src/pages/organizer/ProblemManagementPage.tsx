import { useState } from "react";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoProblem } from "../../services/readModelService";

export function ProblemManagementPage() {
  const { notify } = useToast();
  const [title, setTitle] = useState(demoProblem.title);
  const [releaseAt, setReleaseAt] = useState(demoProblem.releaseAt.slice(0, 16));
  const [status, setStatus] = useState(demoProblem.status);

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Cau hinh de thi"
        title="Upload va hen gio mo de"
        description="Thi sinh chi xem duoc noi dung khi den thoi gian mo de. Check-in khong chan quyen xem de."
        actions={<Badge tone={getStatusTone(status)}>{getStatusLabel(status)}</Badge>}
      />

      <section className="grid gap-lg lg:grid-cols-[1fr_320px]">
        <form className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">Ten de thi</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="form-input" />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">Thoi gian mo de</span>
            <input
              value={releaseAt}
              onChange={(event) => setReleaseAt(event.target.value)}
              className="form-input"
              type="datetime-local"
              data-testid="problem-release-at"
            />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">Tom tat de thi</span>
            <textarea defaultValue={demoProblem.summary} className="form-input min-h-32" />
          </label>
          <div className="flex flex-wrap gap-sm">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStatus("DRAFT");
                notify("Da luu ban nhap de thi.", "success");
              }}
            >
              Luu ban nhap
            </Button>
            <ConfirmAction
              title="Cong bo de thi?"
              message="Sau khi cong bo, thi sinh se xem duoc de khi den thoi gian mo de. Check-in khong duoc dung de khoa quyen xem de."
              confirmLabel="Cong bo de"
              onConfirm={() => {
                setStatus("PUBLISHED");
                notify("Da cong bo de thi.", "success");
              }}
            >
              <Button type="button" data-testid="publish-problem">
                Cong bo de
              </Button>
            </ConfirmAction>
          </div>
        </form>

        <aside className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <h2 className="font-headline-sm text-on-surface">Quy tac can giu</h2>
          <div className="mt-md space-y-sm font-body-sm text-on-surface-variant">
            <p>De chi hien sau thoi gian mo de.</p>
            <p>Ban nhap khong hien cho participant.</p>
            <p>Check-in khong duoc dung de khoa de thi.</p>
            <p>Moi bang co the co de rieng khi noi he thong that.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
