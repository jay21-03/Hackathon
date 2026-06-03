import { useState } from "react";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { repositoryUrlSchema } from "../../domain/schemas";
import { demoTeams } from "../../services/demoDataService";
import { isValidRepositoryUrl } from "../../utils/validation";

export function SubmissionPage() {
  const { notify } = useToast();
  const team = demoTeams[0];
  const [repoUrl, setRepoUrl] = useState(team.repoUrl ?? "");
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED">("DRAFT");
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  function validate() {
    const parsed = repositoryUrlSchema.safeParse(repoUrl);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Repository chua hop le.");
      return false;
    }
    setError("");
    return true;
  }

  function saveDraft() {
    if (!validate()) {
      notify("Link kho ma nguon chua hop le.", "warning");
      return;
    }
    setStatus("DRAFT");
    setActionMessage("Da luu ban nhap bai nop.");
    notify("Da luu ban nhap bai nop.", "success");
  }

  function submitFinal() {
    if (!validate()) return;
    setStatus("SUBMITTED");
    setActionMessage("Da nop bai chinh thuc.");
    notify("Da nop bai chinh thuc.", "success");
  }

  const validRepo = isValidRepositoryUrl(repoUrl);

  return (
    <div className="mx-auto max-w-4xl space-y-lg">
      <section className="flex flex-col gap-md border-b border-outline-variant pb-lg md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-label-sm normal-case text-primary">Bai nop</p>
          <h1 className="font-headline-lg text-on-surface">{team.name}</h1>
          <p className="mt-xs font-body-md text-on-surface-variant">
            Cap nhat kho ma nguon de ban to chuc, mentor va AI Review theo doi tien do.
          </p>
        </div>
        <Badge tone={getStatusTone(status)}>{getStatusLabel(status)}</Badge>
      </section>

      <div className="grid gap-lg lg:grid-cols-[1fr_300px]">
        <section className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">
              Repository URL
            </span>
            <input
              data-testid="repo-url"
              value={repoUrl}
              onChange={(event) => {
                setRepoUrl(event.target.value);
                setError("");
              }}
              className="form-input"
              placeholder="https://github.com/org/project"
            />
          </label>

          {error && (
            <p data-testid="repo-error" className="font-body-sm text-error">
              {error}
            </p>
          )}

          {actionMessage && (
            <div
              data-testid="submission-status-message"
              className="rounded-lg border border-secondary/30 bg-secondary-container/30 p-md"
            >
              <p className="font-body-sm text-on-surface">{actionMessage}</p>
            </div>
          )}

          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
            <p className="font-label-md text-on-surface">Trang thai danh gia AI</p>
            <p className="mt-xs font-body-sm text-on-surface-variant">
              AI Review chi dung de tham khao va khong anh huong den ranking.
            </p>
            <div className="mt-md flex items-center gap-sm">
              <Icon name="psychology" className="text-primary" />
              <span className="font-body-sm text-on-surface">
                Diem goi y hien tai: {team.aiReviewScore}/100
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-sm">
            <Button type="button" variant="ghost" onClick={saveDraft} data-testid="save-submission">
              Luu ban nhap
            </Button>
            <ConfirmAction
              title="Xac nhan nop bai"
              message="Sau khi nop chinh thuc, ban van co the cap nhat theo quy dinh cua ban to chuc neu cuoc thi cho phep."
              confirmLabel="Nop chinh thuc"
              onConfirm={submitFinal}
            >
              <button
                type="button"
                data-testid="submit-submission"
                disabled={!validRepo}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-2.5 font-label-md text-on-primary-container transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Nop chinh thuc
                <Icon name="send" className="text-[18px]" />
              </button>
            </ConfirmAction>
          </div>
        </section>

        <aside className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <h2 className="font-headline-sm text-on-surface">Nghiep vu can dung</h2>
          <div className="mt-md space-y-sm font-body-sm text-on-surface-variant">
            <p>Check-in khong chan quyen xem de thi.</p>
            <p>De thi chi mo theo thoi gian ban to chuc cau hinh.</p>
            <p>Repository dung de chay AI Review va ho tro mentor.</p>
            <p>Ranking chi tinh diem judge da submit.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
