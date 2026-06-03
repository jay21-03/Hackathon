import { useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoProblem } from "../../services/readModelService";

export function ProblemManagementPage() {
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
            <span className="font-label-sm normal-case text-on-surface-variant">Release at</span>
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
            <Button type="button" variant="ghost" onClick={() => setStatus("DRAFT")}>
              Luu ban nhap
            </Button>
            <Button type="button" onClick={() => setStatus("PUBLISHED")} data-testid="publish-problem">
              Cong bo de
            </Button>
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
