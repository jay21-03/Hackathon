import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useToast } from "../feedback/ToastProvider";
import { Button, ButtonLink } from "../ui/Button";
import { RetryPanel } from "../feedback/RetryPanel";
import { queryKeys } from "../../lib/queryKeys";
import {
  fetchProblemRepoTemplate,
  saveProblemRepoTemplate
} from "../../services/repositoryProvisioningService";
import { GITHUB_REPO_TEMPLATE_DEFAULTS } from "../../config/githubRepoDefaults";
import { repoTemplateSchema } from "../../domain/schemas";
import { applyApiFormErrors, resolveApiError } from "../../utils/apiError";
import { zodFieldErrors } from "../../utils/zodFieldErrors";

type Props = {
  problemId: number;
  problemTitle: string;
};

function isNotFoundError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("404") || message.toLowerCase().includes("not found") || message.includes("Chưa có mẫu");
}

export function ProblemRepoTemplateSection({ problemId, problemTitle }: Props) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [templateOwner, setTemplateOwner] = useState(GITHUB_REPO_TEMPLATE_DEFAULTS.templateOwner);
  const [templateRepo, setTemplateRepo] = useState(GITHUB_REPO_TEMPLATE_DEFAULTS.templateRepo);
  const [defaultBranch, setDefaultBranch] = useState(GITHUB_REPO_TEMPLATE_DEFAULTS.defaultBranch);
  const [enabled, setEnabled] = useState<boolean>(GITHUB_REPO_TEMPLATE_DEFAULTS.enabled);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const templateQuery = useQuery({
    queryKey: queryKeys.repositories.template(problemId),
    queryFn: () => fetchProblemRepoTemplate(problemId),
    retry: false
  });

  useEffect(() => {
    if (templateQuery.data) {
      setTemplateOwner(templateQuery.data.templateOwner ?? GITHUB_REPO_TEMPLATE_DEFAULTS.templateOwner);
      setTemplateRepo(templateQuery.data.templateRepo ?? GITHUB_REPO_TEMPLATE_DEFAULTS.templateRepo);
      setDefaultBranch(templateQuery.data.defaultBranch ?? GITHUB_REPO_TEMPLATE_DEFAULTS.defaultBranch);
      setEnabled(templateQuery.data.enabled !== false);
      return;
    }
    if (templateQuery.isError && isNotFoundError(templateQuery.error)) {
      setTemplateOwner(GITHUB_REPO_TEMPLATE_DEFAULTS.templateOwner);
      setTemplateRepo(GITHUB_REPO_TEMPLATE_DEFAULTS.templateRepo);
      setDefaultBranch(GITHUB_REPO_TEMPLATE_DEFAULTS.defaultBranch);
      setEnabled(GITHUB_REPO_TEMPLATE_DEFAULTS.enabled);
    }
  }, [templateQuery.data, templateQuery.isError, templateQuery.error]);

  const templateMissing = templateQuery.isError && isNotFoundError(templateQuery.error);

  async function handleSave() {
    const parsed = repoTemplateSchema.safeParse({
      templateOwner,
      templateRepo,
      defaultBranch: defaultBranch.trim() || "main",
      enabled
    });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      notify(parsed.error.issues[0]?.message ?? "Mẫu repository không hợp lệ.", "warning");
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      await saveProblemRepoTemplate(problemId, parsed.data);
      await queryClient.invalidateQueries({ queryKey: queryKeys.repositories.template(problemId) });
      notify("Đã lưu mẫu repository.", "success");
    } catch (err) {
      applyApiFormErrors(err, setFieldErrors);
      notify(resolveApiError(err, "Không lưu được mẫu repository."), "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <h2 className="font-title-md text-on-surface">Mẫu repository GitHub</h2>
          <p className="mt-xs font-body-sm text-on-surface-variant">
            Cho đề «{problemTitle}» — provision tự động khi đến thời gian mở đề.
          </p>
        </div>
        <ButtonLink to="/organizer/artifacts-hub#artifacts-step-repositories" variant="secondary">
          Quản lý repository
        </ButtonLink>
      </div>

      {templateQuery.isError && !templateMissing ? (
        <div className="mt-md">
          <RetryPanel
            message={resolveApiError(templateQuery.error, "Không tải mẫu repository.")}
            onRetry={() => void templateQuery.refetch()}
          />
        </div>
      ) : (
        <div className="mt-md grid gap-md md:grid-cols-2">
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">Template owner</span>
            <input
              className={`form-input${fieldErrors.templateOwner ? " border-error" : ""}`}
              value={templateOwner}
              onChange={(e) => {
                setTemplateOwner(e.target.value);
                setFieldErrors((prev) => ({ ...prev, templateOwner: "" }));
              }}
              placeholder="my-org"
            />
            {fieldErrors.templateOwner ? (
              <span className="font-body-sm text-error">{fieldErrors.templateOwner}</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">Template repo</span>
            <input
              className={`form-input${fieldErrors.templateRepo ? " border-error" : ""}`}
              value={templateRepo}
              onChange={(e) => {
                setTemplateRepo(e.target.value);
                setFieldErrors((prev) => ({ ...prev, templateRepo: "" }));
              }}
              placeholder="hackathon-starter"
            />
            {fieldErrors.templateRepo ? (
              <span className="font-body-sm text-error">{fieldErrors.templateRepo}</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">Nhánh mặc định</span>
            <input
              className={`form-input${fieldErrors.defaultBranch ? " border-error" : ""}`}
              value={defaultBranch}
              onChange={(e) => {
                setDefaultBranch(e.target.value);
                setFieldErrors((prev) => ({ ...prev, defaultBranch: "" }));
              }}
            />
            {fieldErrors.defaultBranch ? (
              <span className="font-body-sm text-error">{fieldErrors.defaultBranch}</span>
            ) : null}
          </label>
          <label className="flex items-center gap-sm pt-6 font-body-sm text-on-surface">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Bật provision cho đề này
          </label>
        </div>
      )}

      {templateMissing ? (
        <p className="mt-md font-body-sm text-on-surface-variant">Chưa có mẫu — lưu để tạo cấu hình.</p>
      ) : null}

      <Button className="mt-md" type="button" disabled={saving} onClick={() => void handleSave()}>
        {saving ? "Đang lưu" : templateMissing ? "Tạo mẫu" : "Cập nhật mẫu"}
      </Button>
    </section>
  );
}
