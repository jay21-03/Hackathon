import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { queryKeys } from "../../lib/queryKeys";
import {
  fetchBoardProblems,
  fetchEventRounds,
  fetchRoundBoards,
  type BoardResponse,
  type ProblemResponse,
  type RoundResponse
} from "../../services/contestApi";
import {
  ACCESS_STATUS_LABELS,
  PROVISION_STATUS_LABELS,
  accessStatusTone,
  fetchEventRepositoriesPaged,
  fetchProblemRepoTemplate,
  lockProblemRepositories,
  provisionProblemRepositories,
  provisionStatusTone,
  formatRepositoryTimestamp,
  retryTeamRepository,
  saveProblemRepoTemplate,
  type TeamRepositoryResponse
} from "../../services/repositoryProvisioningService";
import { grantRoundJudgeAccess } from "../../services/judgeRepositoryService";
import { GITHUB_REPO_TEMPLATE_DEFAULTS } from "../../config/githubRepoDefaults";
import { enableAiReview } from "../../config/features";
import { repoTemplateSchema } from "../../domain/schemas";
import { applyApiFormErrors, resolveApiError } from "../../utils/apiError";
import { zodFieldErrors } from "../../utils/zodFieldErrors";
import { resolveDefaultRoundId } from "../../utils/pickActiveRound";
import {
  buildRoundNameById,
  formatBoardResponseLabel,
  formatRepositoryBoardLabel
} from "../../utils/boardLabels";
import { resolveRoundDisplayName } from "../../utils/awardLabels";

function isNotFoundError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("404") || message.toLowerCase().includes("not found") || message.includes("Chưa có mẫu");
}

export function RepositoryManagementPage({ embedded = false }: { embedded?: boolean }) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [boardId, setBoardId] = useState<number | null>(null);
  const [problemId, setProblemId] = useState<number | null>(null);
  const [templateOwner, setTemplateOwner] = useState(GITHUB_REPO_TEMPLATE_DEFAULTS.templateOwner);
  const [templateRepo, setTemplateRepo] = useState(GITHUB_REPO_TEMPLATE_DEFAULTS.templateRepo);
  const [defaultBranch, setDefaultBranch] = useState(GITHUB_REPO_TEMPLATE_DEFAULTS.defaultBranch);
  const [templateEnabled, setTemplateEnabled] = useState<boolean>(GITHUB_REPO_TEMPLATE_DEFAULTS.enabled);
  const [templateErrors, setTemplateErrors] = useState<Record<string, string>>({});
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [locking, setLocking] = useState(false);
  const [grantingJudgeAccess, setGrantingJudgeAccess] = useState(false);
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED" | "FAILED" | "PENDING">("ALL");
  const [repoSearch, setRepoSearch] = useState("");
  const [repoSearchDebounced, setRepoSearchDebounced] = useState("");
  const [repoPage, setRepoPage] = useState(0);
  const repoPageSize = 50;

  const roundsQuery = useQuery({
    queryKey: queryKeys.rounds.byEvent(eventId),
    queryFn: () => fetchEventRounds(eventId!),
    enabled: Boolean(eventId)
  });

  const rounds = useMemo(() => (roundsQuery.data ?? []) as RoundResponse[], [roundsQuery.data]);
  const activeRoundId = resolveDefaultRoundId(rounds, selectedRoundId);
  const roundNameById = useMemo(() => buildRoundNameById(rounds), [rounds]);

  useEffect(() => {
    if (rounds.length === 0) {
      setSelectedRoundId(null);
      return;
    }
    setSelectedRoundId((prev) => resolveDefaultRoundId(rounds, prev));
  }, [rounds]);

  const boardsQuery = useQuery({
    queryKey: [...queryKeys.boards.all, "repos", eventId, selectedRoundId],
    queryFn: () => fetchRoundBoards(selectedRoundId!),
    enabled: Boolean(selectedRoundId)
  });

  const boards = useMemo(() => boardsQuery.data ?? [], [boardsQuery.data]);
  const configBoardId = boardId ?? boards[0]?.id ?? null;

  useEffect(() => {
    setBoardId((prev) => (prev && boards.some((b) => b.id === prev) ? prev : null));
  }, [boards, activeRoundId]);

  useEffect(() => {
    setRepoPage(0);
  }, [activeRoundId, boardId, statusFilter, repoSearchDebounced]);

  useEffect(() => {
    const timer = window.setTimeout(() => setRepoSearchDebounced(repoSearch.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [repoSearch]);

  const problemQuery = useQuery({
    queryKey: [...queryKeys.boards.all, "repo-problem", configBoardId],
    queryFn: async () => {
      const list = await fetchBoardProblems(configBoardId!);
      return (list[0] ?? null) as ProblemResponse | null;
    },
    enabled: Boolean(configBoardId)
  });

  const problem = problemQuery.data ?? null;

  useEffect(() => {
    setProblemId(problem?.id ?? null);
  }, [problem]);

  const templateQuery = useQuery({
    queryKey: queryKeys.repositories.template(problemId),
    queryFn: () => fetchProblemRepoTemplate(problemId!),
    enabled: Boolean(problemId),
    retry: false
  });

  useEffect(() => {
    if (templateQuery.data) {
      setTemplateOwner(templateQuery.data.templateOwner ?? GITHUB_REPO_TEMPLATE_DEFAULTS.templateOwner);
      setTemplateRepo(templateQuery.data.templateRepo ?? GITHUB_REPO_TEMPLATE_DEFAULTS.templateRepo);
      setDefaultBranch(templateQuery.data.defaultBranch ?? GITHUB_REPO_TEMPLATE_DEFAULTS.defaultBranch);
      setTemplateEnabled(templateQuery.data.enabled !== false);
      return;
    }
    if (templateQuery.isError && isNotFoundError(templateQuery.error)) {
      setTemplateOwner(GITHUB_REPO_TEMPLATE_DEFAULTS.templateOwner);
      setTemplateRepo(GITHUB_REPO_TEMPLATE_DEFAULTS.templateRepo);
      setDefaultBranch(GITHUB_REPO_TEMPLATE_DEFAULTS.defaultBranch);
      setTemplateEnabled(GITHUB_REPO_TEMPLATE_DEFAULTS.enabled);
    }
  }, [templateQuery.data, templateQuery.isError, templateQuery.error]);

  const reposQuery = useQuery({
    queryKey: [
      ...queryKeys.repositories.byEvent(eventId),
      "paged",
      repoPage,
      activeRoundId,
      boardId,
      statusFilter,
      repoSearchDebounced
    ],
    queryFn: () =>
      fetchEventRepositoriesPaged(eventId!, {
        page: repoPage,
        size: repoPageSize,
        roundId: activeRoundId,
        boardId,
        accessStatus: statusFilter,
        q: repoSearchDebounced || null
      }),
    enabled: Boolean(eventId),
    refetchInterval: (query) => {
      const rows = query.state.data?.items ?? [];
      const needsPoll = rows.some(
        (row) =>
          row.provisionStatus === "PENDING" ||
          row.provisionStatus === "FAILED" ||
          row.accessStatus === "PENDING"
      );
      return needsPoll ? 20_000 : false;
    }
  });

  const pagedRepos = reposQuery.data;
  const filteredRepos = pagedRepos?.items ?? [];
  const repoTotalPages = pagedRepos?.totalPages ?? 0;
  const repoTotal = pagedRepos?.total ?? 0;
  const repoStats = pagedRepos?.stats;

  const stats = useMemo(
    () => ({
      total: repoStats?.total ?? repoTotal,
      open: repoStats?.open ?? 0,
      failed: repoStats?.failed ?? 0,
      closed: repoStats?.closed ?? 0
    }),
    [repoStats, repoTotal]
  );

  const githubIssueCount = repoStats?.githubIssueCount ?? 0;

  const githubIssuesQuery = useQuery({
    queryKey: [
      ...queryKeys.repositories.byEvent(eventId),
      "github-issues",
      activeRoundId,
      boardId
    ],
    queryFn: () =>
      fetchEventRepositoriesPaged(eventId!, {
        page: 0,
        size: Math.min(Math.max(githubIssueCount, 1), 100),
        roundId: activeRoundId,
        boardId,
        accessStatus: "FAILED"
      }),
    enabled: Boolean(eventId) && githubIssueCount > 0
  });

  const githubProfileIssues = useMemo(() => {
    const pattern = /github|username|thiếu|invalid/i;
    return (githubIssuesQuery.data?.items ?? []).filter(
      (row) =>
        row.provisionStatus === "FAILED" &&
        row.lastError &&
        pattern.test(row.lastError)
    );
  }, [githubIssuesQuery.data?.items]);

  async function invalidateRepos() {
    if (!eventId) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.repositories.byEvent(eventId) });
    if (problemId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.repositories.template(problemId) });
    }
  }

  async function handleSaveTemplate() {
    if (!problemId) return;
    const parsed = repoTemplateSchema.safeParse({
      templateOwner,
      templateRepo,
      defaultBranch: defaultBranch.trim() || "main",
      enabled: templateEnabled
    });
    if (!parsed.success) {
      setTemplateErrors(zodFieldErrors(parsed.error));
      notify(parsed.error.issues[0]?.message ?? "Mẫu repository không hợp lệ.", "warning");
      return;
    }
    setTemplateErrors({});
    setSavingTemplate(true);
    try {
      await saveProblemRepoTemplate(problemId, parsed.data);
      await invalidateRepos();
      notify("Đã lưu mẫu repository.", "success");
    } catch (err) {
      applyApiFormErrors(err, setTemplateErrors);
      notify(resolveApiError(err, "Không lưu được mẫu repository."), "danger");
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleProvision(force = false) {
    if (!problemId) return;
    setProvisioning(true);
    try {
      const result = await provisionProblemRepositories(problemId, force);
      await invalidateRepos();
      notify(
        `Đã cấp repo: ${result.createdCount} tạo mới, ${result.skippedCount} bỏ qua, ${result.failedCount} lỗi.`,
        result.failedCount > 0 ? "warning" : "success"
      );
    } catch (err) {
      notify(resolveApiError(err, "Cấp repository thất bại."), "danger");
    } finally {
      setProvisioning(false);
    }
  }

  async function handleLockProblem() {
    if (!problemId) return;
    setLocking(true);
    try {
      const result = await lockProblemRepositories(problemId);
      await invalidateRepos();
      notify(
        `Đã khóa push ${result.lockedCount}/${result.totalRepositories} repository sau khi đề đóng.`,
        result.failedCount > 0 ? "warning" : "success"
      );
    } catch (err) {
      notify(resolveApiError(err, "Khóa repository thất bại — đề phải qua giờ đóng."), "danger");
    } finally {
      setLocking(false);
    }
  }

  async function handleGrantJudgeAccess() {
    if (!selectedRoundId) return;
    setGrantingJudgeAccess(true);
    try {
      const result = await grantRoundJudgeAccess(selectedRoundId);
      notify(
        `Cấp quyền giám khảo: ${result.grantedCount} thành công, ${result.skippedCount} bỏ qua, ${result.failedCount} lỗi.`,
        result.failedCount > 0 ? "warning" : "success"
      );
    } catch (err) {
      notify(resolveApiError(err, "Cấp quyền giám khảo thất bại."), "danger");
    } finally {
      setGrantingJudgeAccess(false);
    }
  }

  async function handleRetry(repositoryId: number) {
    setRetryingId(repositoryId);
    try {
      await retryTeamRepository(repositoryId);
      await invalidateRepos();
      notify("Đã thử lại cấp repository.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Thử lại thất bại."), "danger");
    } finally {
      setRetryingId(null);
    }
  }

  const loading =
    eventLoading ||
    roundsQuery.isLoading ||
    boardsQuery.isLoading ||
    (Boolean(configBoardId) && problemQuery.isLoading);

  if (loading) {
    return <ModuleSkeleton rows={6} />;
  }

  if (!eventId) {
    return (
      <EmptyState
        icon="source"
        title="Chưa có cuộc thi"
        description="Chọn cuộc thi để quản lý repository GitHub."
      />
    );
  }

  const templateMissing = templateQuery.isError && isNotFoundError(templateQuery.error);
  const templateLoadError =
    templateQuery.isError && !templateMissing ? resolveApiError(templateQuery.error, "Không tải mẫu.") : null;

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <PageHeader
          eyebrow="GitHub"
          title="Repository đội thi"
          description="Cấu hình mẫu repo theo đề, tự cấp khi mở đề và khóa push khi hết giờ đóng đề."
          actions={<OrganizerContextBar />}
        />
      ) : null}

      {boards.length === 0 ? (
        <EmptyState
          icon="grid_view"
          title="Chưa có bảng thi"
          description="Tạo vòng và bảng trước khi cấu hình repository."
        />
      ) : (
        <section className="grid gap-lg lg:grid-cols-[1fr_320px]">
          <div className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
            {rounds.length > 0 ? (
              <label className="flex flex-col gap-xs">
                <span className="font-label-sm normal-case text-on-surface-variant">Vòng thi</span>
                <select
                  className="form-input"
                  value={selectedRoundId ?? ""}
                  onChange={(e) => setSelectedRoundId(Number(e.target.value))}
                >
                  {rounds.map((round) => (
                    <option key={round.id} value={round.id}>
                      {round.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="flex flex-col gap-xs">
              <span className="font-label-sm normal-case text-on-surface-variant">Bảng thi</span>
              <select
                className="form-input"
                value={boardId ?? ""}
                onChange={(e) => setBoardId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Tất cả bảng vòng này</option>
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {formatBoardResponseLabel(board, roundNameById)}
                  </option>
                ))}
              </select>
            </label>

            {!boardId && configBoardId ? (
              <p className="font-body-sm text-on-surface-variant">
                Cấu hình mẫu đang dùng bảng{" "}
                <strong className="text-on-surface">
                  {formatBoardResponseLabel(
                    boards.find((item) => item.id === configBoardId) ?? {
                      id: configBoardId,
                      name: `Bảng #${configBoardId}`,
                      roundId: activeRoundId ?? 0,
                      boardOrder: 0,
                      status: "ACTIVE"
                    },
                    roundNameById
                  )}
                </strong>
                . Chọn một bảng cụ thể để cấu hình mẫu cho bảng đó.
              </p>
            ) : null}

            {!problem ? (
              <p className="font-body-sm text-on-surface-variant">
                Bảng này chưa có đề — tạo đề trong mục Đề thi trước.
              </p>
            ) : (
              <>
                <p className="font-body-sm text-on-surface-variant">
                  Đề: <strong className="text-on-surface">{problem.title}</strong>
                  {problem.releaseAt
                    ? ` — mở lúc ${new Date(problem.releaseAt).toLocaleString("vi-VN")}`
                    : ""}
                </p>

                {templateLoadError ? <RetryPanel message={templateLoadError} onRetry={() => void templateQuery.refetch()} /> : null}

                <div className="grid gap-md md:grid-cols-2">
                  <label className="flex flex-col gap-xs">
                    <span className="font-label-sm normal-case text-on-surface-variant">Org / user GitHub (mẫu)</span>
                    <input
                      className="form-input"
                      placeholder="my-org"
                      value={templateOwner}
                      onChange={(e) => setTemplateOwner(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-xs">
                    <span className="font-label-sm normal-case text-on-surface-variant">Tên repo mẫu</span>
                    <input
                      className="form-input"
                      placeholder="hackathon-starter"
                      value={templateRepo}
                      onChange={(e) => setTemplateRepo(e.target.value)}
                    />
                  </label>
                </div>

                <div className="grid gap-md md:grid-cols-2">
                  <label className="flex flex-col gap-xs">
                    <span className="font-label-sm normal-case text-on-surface-variant">Nhánh mặc định</span>
                    <input
                      className="form-input"
                      value={defaultBranch}
                      onChange={(e) => setDefaultBranch(e.target.value)}
                    />
                  </label>
                  <label className="flex items-center gap-sm pt-6 font-body-sm text-on-surface">
                    <input
                      type="checkbox"
                      checked={templateEnabled}
                      onChange={(e) => setTemplateEnabled(e.target.checked)}
                    />
                    Bật tự động cấp repository cho đề này
                  </label>
                </div>

                {templateMissing ? (
                  <p className="font-body-sm text-on-surface-variant">
                    Chưa có mẫu — lưu form để tạo cấu hình template.
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-sm">
                  <Button type="button" disabled={savingTemplate} onClick={() => void handleSaveTemplate()}>
                    {savingTemplate ? "Đang lưu" : templateMissing ? "Tạo mẫu" : "Cập nhật mẫu"}
                  </Button>
                  <ConfirmAction
                    title="Cấp repository cho các đội?"
                    message="Tạo repo riêng cho mỗi đội đã xác nhận trên bảng này. Thành viên cần có GitHub username trong hồ sơ."
                    confirmLabel="Cấp repo"
                    onConfirm={() => void handleProvision(false)}
                  >
                    <Button type="button" variant="secondary" disabled={provisioning || !templateEnabled}>
                      {provisioning ? "Đang cấp repo…" : "Cấp repo ngay"}
                    </Button>
                  </ConfirmAction>
                  <ConfirmAction
                    title="Cấp repo bỏ qua giờ mở đề?"
                    message="Chỉ dùng khi test hoặc cấp thủ công trước giờ mở đề."
                    confirmLabel="Cấp bắt buộc"
                    onConfirm={() => void handleProvision(true)}
                  >
                    <Button type="button" variant="secondary" disabled={provisioning}>
                      Cấp bắt buộc
                    </Button>
                  </ConfirmAction>
                  <ConfirmAction
                    title="Cấp quyền xem repo cho giám khảo?"
                    message="Thêm giám khảo được phân công vào repo với quyền chỉ đọc. Giám khảo cần có GitHub username trong hồ sơ."
                    confirmLabel="Cấp quyền"
                    onConfirm={() => void handleGrantJudgeAccess()}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={grantingJudgeAccess || !selectedRoundId}
                    >
                      {grantingJudgeAccess ? "Đang cấp quyền" : "Cấp quyền GK"}
                    </Button>
                  </ConfirmAction>
                  <ConfirmAction
                    title="Khóa push sau khi đề đóng?"
                    message="Thu quyền ghi (push) trên GitHub và đánh dấu repo đã khóa. Chỉ thực hiện khi đã qua giờ đóng đề."
                    confirmLabel="Khóa push"
                    onConfirm={() => void handleLockProblem()}
                  >
                    <Button type="button" variant="danger" disabled={locking || !problemId}>
                      {locking ? "Đang khóa" : "Khóa push"}
                    </Button>
                  </ConfirmAction>
                </div>
              </>
            )}
          </div>

          <aside className="rounded-xl border border-outline-variant bg-surface-container p-lg">
            <h2 className="font-headline-sm text-on-surface">Thống kê (bảng đang chọn)</h2>
            <dl className="mt-md space-y-sm font-body-sm text-on-surface-variant">
              <div className="flex justify-between">
                <dt>Tổng repo</dt>
                <dd className="font-label-md text-on-surface">{stats.total}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Đang mở</dt>
                <dd className="font-label-md text-on-surface">{stats.open}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Đã khóa</dt>
                <dd className="font-label-md text-on-surface">{stats.closed}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Lỗi</dt>
                <dd className="font-label-md text-on-surface">{stats.failed}</dd>
              </div>
            </dl>
            <p className="mt-md font-body-sm text-on-surface-variant">
              Hệ thống tự cấp repository khi đến giờ mở đề và khóa quyền push khi hết giờ đóng đề.
            </p>
          </aside>
        </section>
      )}

      {githubIssueCount > 0 ? (
        <section className="rounded-xl border border-warning/40 bg-warning-container/25 p-md space-y-sm">
          <h2 className="font-title-sm text-on-surface">
            Đội thiếu / sai GitHub username ({githubIssueCount})
          </h2>
          <p className="font-body-sm text-on-surface-variant">
            Các đội dưới đây chưa được cấp repository do thành viên thiếu hoặc sai GitHub username.
            {githubIssueCount > githubProfileIssues.length
              ? ` Hiển thị ${githubProfileIssues.length}/${githubIssueCount} — dùng bộ lọc Lỗi để xem thêm.`
              : null}
          </p>
          {githubIssuesQuery.isLoading ? (
            <p className="font-body-sm text-on-surface-variant">Đang tải danh sách…</p>
          ) : githubProfileIssues.length > 0 ? (
            <ul className="space-y-xs font-body-sm text-on-surface">
              {githubProfileIssues.map((row) => (
                <li key={row.id} className="rounded-lg border border-outline-variant/60 bg-surface px-sm py-xs">
                  <strong>{row.teamName ?? `Đội #${row.teamId}`}</strong>
                  <span className="text-on-surface-variant"> — {row.lastError}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-body-sm text-on-surface-variant">
              Có {githubIssueCount} lỗi liên quan GitHub — chọn bộ lọc Lỗi để xem chi tiết.
            </p>
          )}
        </section>
      ) : null}

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="flex flex-wrap items-center justify-between gap-md">
          <div>
            <h2 className="font-title-md text-on-surface">Danh sách repository</h2>
            <p className="mt-xs font-body-sm text-on-surface-variant">
              Phạm vi:{" "}
              <strong className="text-on-surface">
                {boardId
                  ? (() => {
                      const board = boards.find((item) => item.id === boardId);
                      return board
                        ? formatBoardResponseLabel(board, roundNameById)
                        : `Bảng #${boardId}`;
                    })()
                  : resolveRoundDisplayName(activeRoundId, roundNameById)}
              </strong>
              {repoTotal > 0 ? (
                <span className="block pt-1 text-on-surface-variant">
                  {repoTotal} repository · trang {repoPage + 1}/{Math.max(repoTotalPages, 1)}
                </span>
              ) : null}
            </p>
          </div>
          <label className="mt-md flex min-w-[14rem] flex-col gap-1 font-label-sm text-on-surface-variant">
            Tìm theo tên đội
            <input
              type="search"
              className="form-input"
              value={repoSearch}
              onChange={(e) => setRepoSearch(e.target.value)}
              placeholder="Nhập tên đội…"
            />
          </label>
          <select
            className="form-input w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="OPEN">Đang mở</option>
            <option value="PENDING">Chờ</option>
            <option value="CLOSED">Đã khóa</option>
            <option value="FAILED">Lỗi</option>
          </select>
        </div>

        {reposQuery.isError ? (
          <div className="mt-md">
            <RetryPanel
              message={resolveApiError(reposQuery.error, "Không tải danh sách repository.")}
              onRetry={() => void reposQuery.refetch()}
            />
          </div>
        ) : reposQuery.isLoading ? (
          <ModuleSkeleton rows={3} />
        ) : filteredRepos.length === 0 ? (
          <p className="mt-md font-body-sm text-on-surface-variant">Chưa có repository nào.</p>
        ) : (
          <div className="mt-md overflow-x-auto">
            <table className="w-full min-w-[720px] text-left font-body-sm">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant">
                  <th className="py-2 pr-3">Đội</th>
                  {!boardId ? <th className="py-2 pr-3">Vòng · Bảng</th> : null}
                  <th className="py-2 pr-3">Repo</th>
                  <th className="py-2 pr-3">Cấp repo</th>
                  <th className="py-2 pr-3">Truy cập</th>
                  <th className="py-2 pr-3">Lần push cuối</th>
                  <th className="py-2 pr-3">Lỗi</th>
                  {enableAiReview ? <th className="py-2 pr-3">AI Review</th> : null}
                  <th className="py-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepos.map((row) => (
                  <tr key={row.id} className="border-b border-outline-variant/60">
                    <td className="py-3 pr-3 text-on-surface">{row.teamName ?? `Đội #${row.teamId}`}</td>
                    {!boardId ? (
                      <td className="py-3 pr-3 text-on-surface-variant">
                        {formatRepositoryBoardLabel(row, boards, roundNameById)}
                      </td>
                    ) : null}
                    <td className="py-3 pr-3">
                      {row.repositoryUrl ? (
                        <a
                          href={row.repositoryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          {row.githubRepoName ?? row.repositoryName ?? "Xem repo"}
                        </a>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <Badge tone={provisionStatusTone(row.provisionStatus)}>
                        {PROVISION_STATUS_LABELS[row.provisionStatus]}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3">
                      <Badge tone={accessStatusTone(row.accessStatus)}>
                        {ACCESS_STATUS_LABELS[row.accessStatus]}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3 text-on-surface-variant">
                      {formatRepositoryTimestamp(row.lastPushAt) ?? "—"}
                    </td>
                    <td className="max-w-[200px] truncate py-3 pr-3 text-error" title={row.lastError ?? ""}>
                      {row.lastError ?? "—"}
                    </td>
                    {enableAiReview ? (
                      <td className="py-3 pr-3">
                        {row.provisionStatus === "CREATED" ? (
                          <Link
                            to={`/organizer/ai-reviews?teamId=${row.teamId}`}
                            className="font-body-sm text-primary underline-offset-2 hover:underline"
                          >
                            Rubric
                          </Link>
                        ) : (
                          <span className="text-on-surface-variant">—</span>
                        )}
                      </td>
                    ) : null}
                    <td className="py-3">
                      {row.provisionStatus === "FAILED" || row.accessStatus === "FAILED" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={retryingId === row.id}
                          onClick={() => void handleRetry(row.id)}
                        >
                          {retryingId === row.id ? "Đang thử" : "Thử lại"}
                        </Button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {repoTotalPages > 1 ? (
          <div className="mt-md flex flex-wrap items-center justify-between gap-sm">
            <p className="font-body-sm text-on-surface-variant">
              Trang {repoPage + 1}/{repoTotalPages} · {repoTotal} repository
            </p>
            <div className="flex gap-sm">
              <Button
                type="button"
                variant="ghost"
                disabled={repoPage <= 0 || reposQuery.isFetching}
                onClick={() => setRepoPage((p) => Math.max(0, p - 1))}
              >
                Trước
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={repoPage >= repoTotalPages - 1 || reposQuery.isFetching}
                onClick={() => setRepoPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
