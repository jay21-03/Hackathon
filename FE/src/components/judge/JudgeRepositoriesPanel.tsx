import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ModuleSkeleton } from "../ui/ModuleSkeleton";
import { useToast } from "../feedback/ToastProvider";
import {
  ACCESS_STATUS_LABELS,
  PROVISION_STATUS_LABELS,
  accessStatusTone,
  provisionStatusTone
} from "../../services/repositoryProvisioningService";
import {
  fetchJudgeRepositoriesForRound,
  type JudgeRepositoryResponse
} from "../../services/judgeRepositoryService";
import { resolveApiError } from "../../utils/apiError";

interface JudgeRepositoriesPanelProps {
  roundId: number | null;
  boardId: number | null;
}

function filterForBoard(repositories: JudgeRepositoryResponse[], boardId: number | null) {
  if (!boardId) return repositories;
  return repositories.filter((item) => item.boardId === boardId);
}

export function JudgeRepositoriesPanel({ roundId, boardId }: JudgeRepositoriesPanelProps) {
  const { notify } = useToast();
  const query = useQuery({
    queryKey: ["judge", "repositories", roundId],
    queryFn: () => fetchJudgeRepositoriesForRound(roundId!),
    enabled: roundId != null
  });

  const repositories = useMemo(
    () => filterForBoard(query.data ?? [], boardId),
    [query.data, boardId]
  );

  async function copyCloneUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      notify("Đã copy clone URL.", "success");
    } catch {
      notify("Không copy được URL.", "danger");
    }
  }

  if (!roundId) return null;
  if (query.isLoading) return <ModuleSkeleton rows={2} />;

  if (query.isError) {
    return (
      <div className="rounded-xl border border-error/30 bg-error-container/20 p-md">
        <p className="font-body-sm text-error">
          {resolveApiError(query.error, "Không tải được danh sách repository.")}
        </p>
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <section className="rounded-xl border border-outline-variant bg-surface-container p-md">
        <h3 className="font-headline-sm text-on-surface">Repository</h3>
        <p className="mt-sm font-body-sm text-on-surface-variant">
          Chưa có repository GitHub được cấp cho các đội trên bảng này.
        </p>
      </section>
    );
  }

  const missingGithub = repositories.some((item) => !item.judgeHasGithubUsername);
  const missingAccess = repositories.some(
    (item) =>
      item.provisionStatus === "CREATED" &&
      item.judgeHasGithubUsername &&
      item.judgeGithubAccessGranted === false
  );

  return (
    <section className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-md">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <h3 className="font-headline-sm text-on-surface">Repository</h3>
        <p className="font-label-sm text-on-surface-variant">{repositories.length} repo trên bảng</p>
      </div>

      {missingGithub ? (
        <div className="rounded-lg border border-warning-container bg-warning-container/25 p-sm">
          <p className="font-body-sm text-on-surface">
            Bạn cần cập nhật GitHub username trong{" "}
            <Link to="/judge/profile" className="text-primary hover:underline">
              hồ sơ
            </Link>{" "}
            để được cấp quyền xem repository.
          </p>
        </div>
      ) : null}

      {missingAccess ? (
        <div className="rounded-lg border border-warning-container bg-warning-container/25 p-sm">
          <p className="font-body-sm text-on-surface">
            Bạn chưa được cấp quyền xem một số repository. Vui lòng liên hệ Ban tổ chức để cấp quyền
            read/pull trên GitHub.
          </p>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse font-body-sm">
          <thead>
            <tr className="border-b border-outline-variant text-left">
              <th className="px-sm py-2 font-label-sm text-on-surface-variant">Đội</th>
              <th className="px-sm py-2 font-label-sm text-on-surface-variant">Đề</th>
              <th className="px-sm py-2 font-label-sm text-on-surface-variant">Truy cập</th>
              <th className="px-sm py-2 font-label-sm text-on-surface-variant">Quyền GK</th>
              <th className="px-sm py-2 font-label-sm text-on-surface-variant">Cấp repo</th>
              <th className="px-sm py-2 font-label-sm text-on-surface-variant">GitHub</th>
            </tr>
          </thead>
          <tbody>
            {repositories.map((item) => (
              <tr key={item.id} className="border-b border-outline-variant/50 last:border-b-0">
                <td className="px-sm py-2 text-on-surface">{item.teamName ?? `Đội #${item.teamId}`}</td>
                <td className="px-sm py-2 text-on-surface-variant">{item.problemTitle ?? "—"}</td>
                <td className="px-sm py-2">
                  <Badge tone={accessStatusTone(item.accessStatus)}>
                    {ACCESS_STATUS_LABELS[item.accessStatus]}
                  </Badge>
                </td>
                <td className="px-sm py-2">
                  {!item.judgeHasGithubUsername ? (
                    <Badge tone="warning">Thiếu username</Badge>
                  ) : item.judgeGithubAccessGranted === true ? (
                    <Badge tone="success">Đã cấp quyền</Badge>
                  ) : item.judgeGithubAccessGranted === false ? (
                    <Badge tone="warning">Chờ cấp quyền</Badge>
                  ) : (
                    <Badge tone="neutral">Chưa xác định</Badge>
                  )}
                </td>
                <td className="px-sm py-2">
                  <Badge tone={provisionStatusTone(item.provisionStatus)}>
                    {PROVISION_STATUS_LABELS[item.provisionStatus]}
                  </Badge>
                </td>
                <td className="px-sm py-2">
                  <div className="flex flex-wrap gap-1">
                    {item.repositoryUrl ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(item.repositoryUrl!, "_blank", "noopener,noreferrer")}
                        disabled={
                          item.provisionStatus !== "CREATED" ||
                          (item.judgeHasGithubUsername && item.judgeGithubAccessGranted === false)
                        }
                      >
                        Mở GitHub
                      </Button>
                    ) : null}
                    {item.cloneUrl ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void copyCloneUrl(item.cloneUrl!)}
                      >
                        Copy clone URL
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
