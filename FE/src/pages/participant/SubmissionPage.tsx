import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { ParticipantWorkflowBar } from "../../components/participant/ParticipantWorkflowBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { submissionFormSchema } from "../../domain/schemas";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useMySubmission } from "../../hooks/useMySubmission";
import { useMyTeam } from "../../hooks/useMyTeam";
import { useParticipantTeamGuard } from "../../hooks/useParticipantTeamGuard";
import { useCommitUpdates } from "../../hooks/useCommitUpdates";
import { CommitConnectionBadge } from "../../components/ui/CommitConnectionBadge";
import { fetchMyProfile } from "../../services/profileService";
import { ParticipantTeamBlocked } from "../../components/participant/ParticipantTeamBlocked";
import { enableGithubProvisioning } from "../../config/features";
import { queryKeys } from "../../lib/queryKeys";
import {
  ACCESS_STATUS_LABELS,
  PROVISION_STATUS_LABELS,
  SUBMISSION_STATUS_LABELS,
  accessStatusTone,
  fetchMyTeamRepositories,
  formatRepositoryTimestamp,
  provisionStatusTone,
  refreshRepoCommit,
  shortCommitSha,
  submissionStatusTone,
  type TeamRepositoryResponse
} from "../../services/repositoryProvisioningService";
import { saveSubmissionDraft, submitSubmission } from "../../services/submissionApi";
import { applyApiFormErrors, resolveApiError } from "../../utils/apiError";

const blockReasonLabels: Record<string, string> = {
  NO_TEAM: "Chưa có đội thi.",
  TEAM_WAITLIST: "Đội đang trong danh sách chờ.",
  TEAM_REJECTED: "Hồ sơ đội đã bị từ chối.",
  TEAM_DISQUALIFIED: "Đội đã bị loại.",
  TEAM_NOT_CONFIRMED: "Đội chưa được xác nhận.",
  ROUND_NOT_STARTED: "Vòng thi chưa bắt đầu — repository sẽ mở khi đến thời gian thi.",
  NOT_ASSIGNED: "Chưa được phân bảng.",
  NO_PROBLEM: "Ban tổ chức chưa cấu hình đề cho bảng của bạn.",
  NOT_RELEASED: "Đề chưa mở — repository sẽ được cấp khi ban tổ chức mở đề.",
  PROBLEM_CLOSED: "Hết giờ làm bài — kiểm tra trạng thái push bên dưới.",
  PROBLEM_UNAVAILABLE: "Chưa thể nộp bài trong thời điểm hiện tại.",
  SUBMISSION_DEADLINE_PASSED: "Đã qua hạn nộp bài.",
  SUBMISSION_ALREADY_SUBMITTED: "Bài đã được ghi nhận — không thể sửa hoặc nộp lại.",
  INVALID_REPOSITORY_URL: "Link phải là GitHub hoặc GitLab hợp lệ.",
  REPOSITORY_URL_REQUIRED: "Nhập link repository trước khi nộp."
};

function applySubmissionApiErrors(
  error: unknown,
  setUrlError: (value: string | null) => void,
  setNameError: (value: string | null) => void
) {
  applyApiFormErrors(error, (errors) => {
    if (errors.repositoryUrl) setUrlError(errors.repositoryUrl);
    if (errors.repositoryName) setNameError(errors.repositoryName);
  });
}

function mapSubmissionError(error: unknown, fallback: string) {
  return resolveApiError(error, fallback);
}

function statusLabel(status: string | null | undefined, autoFinalized = false) {
  if (status === "SUBMITTED") return autoFinalized ? "Đã chốt" : "Đã nộp";
  if (status === "DRAFT") return "Bản nháp";
  return "Chưa nộp";
}

function statusTone(status: string | null | undefined): "success" | "warning" | "neutral" {
  if (status === "SUBMITTED") return "success";
  if (status === "DRAFT") return "warning";
  return "neutral";
}

function isPastDeadline(deadlineAt: string | null | undefined) {
  return Boolean(deadlineAt && Date.now() >= new Date(deadlineAt).getTime());
}

function overviewAccessStatus(
  repo: TeamRepositoryResponse | null,
  submissionStatus: string | null | undefined,
  deadlineAt: string | null | undefined
) {
  if (submissionStatus === "SUBMITTED" || isPastDeadline(deadlineAt)) return "CLOSED";
  if (repo?.accessStatus) return repo.accessStatus;
  return null;
}

function pushGuidance(repo: TeamRepositoryResponse) {
  if (repo.accessStatus === "CLOSED") {
    return "Repository đã khóa push — ban tổ chức đã chốt bài.";
  }
  if (repo.accessStatus === "FAILED") {
    return "Không thể mở quyền push — liên hệ ban tổ chức.";
  }
  if (repo.provisionStatus === "PENDING") {
    return "Ban tổ chức sẽ tạo repository khi bắt đầu vòng thi.";
  }
  if (repo.provisionStatus === "FAILED") {
    return "Tạo repository thất bại — liên hệ ban tổ chức để cấp lại.";
  }
  if (repo.accessStatus === "OPEN") {
    return "Clone repository và push code trước hạn đóng đề — hệ thống tự chốt nộp khi hết giờ.";
  }
  return "Chờ ban tổ chức mở quyền push.";
}

function RepositoryDetailCard({
  repo,
  onCommitRefreshed
}: {
  repo: TeamRepositoryResponse;
  onCommitRefreshed: () => Promise<void>;
}) {
  const { notify } = useToast();
  const submissionStatus = repo.submissionStatus ?? null;
  const latestCommit = repo.latestCommit ?? null;
  const canRefreshCommit =
    repo.provisionStatus === "CREATED" &&
    (repo.accessStatus === "OPEN" || repo.accessStatus === "CLOSED");
  const [refreshingCommit, setRefreshingCommit] = useState(false);

  async function handleRefreshCommit() {
    setRefreshingCommit(true);
    try {
      await refreshRepoCommit(repo.id);
      await onCommitRefreshed();
      notify("Đã cập nhật commit mới nhất.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Không lấy được commit mới nhất."), "danger");
    } finally {
      setRefreshingCommit(false);
    }
  }

  return (
    <li className="space-y-sm rounded-lg border border-outline-variant/60 p-md">
      <div className="flex flex-wrap items-start justify-between gap-sm">
        <div className="min-w-0 flex-1">
          {repo.roundName ? (
            <p className="mb-xs font-label-sm text-on-surface-variant">
              {repo.roundName}
              {repo.currentRound ? " · Vòng hiện tại" : " · Vòng trước"}
            </p>
          ) : null}
          {repo.repositoryUrl ? (
            <a
              href={repo.repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="font-body-md text-primary underline-offset-2 hover:underline"
            >
              {repo.githubRepoName ?? repo.repositoryName ?? repo.repositoryUrl}
            </a>
          ) : (
            <span className="font-body-md text-on-surface-variant">Đang tạo repository…</span>
          )}
          {repo.githubOwner && repo.githubRepoName ? (
            <p className="mt-xs font-body-sm text-on-surface-variant">
              {repo.githubOwner}/{repo.githubRepoName}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-xs">
          <Badge tone={provisionStatusTone(repo.provisionStatus)}>
            {PROVISION_STATUS_LABELS[repo.provisionStatus]}
          </Badge>
          <Badge tone={accessStatusTone(repo.accessStatus)}>
            {ACCESS_STATUS_LABELS[repo.accessStatus]}
          </Badge>
          {submissionStatus ? (
            <Badge tone={submissionStatusTone(submissionStatus)}>
              {SUBMISSION_STATUS_LABELS[submissionStatus]}
            </Badge>
          ) : null}
        </div>
      </div>

      <p className="font-body-sm text-on-surface-variant">{pushGuidance(repo)}</p>

      {repo.lastError ? <p className="font-body-sm text-error">{repo.lastError}</p> : null}

      <dl className="grid gap-xs sm:grid-cols-2">
        {repo.provisionedAt ? (
          <div>
            <dt className="font-label-sm text-on-surface-variant">Cấp lúc</dt>
            <dd className="font-body-sm text-on-surface">{formatRepositoryTimestamp(repo.provisionedAt)}</dd>
          </div>
        ) : null}
        {repo.openedAt ? (
          <div>
            <dt className="font-label-sm text-on-surface-variant">Mở push</dt>
            <dd className="font-body-sm text-on-surface">{formatRepositoryTimestamp(repo.openedAt)}</dd>
          </div>
        ) : null}
        {repo.closedAt ? (
          <div>
            <dt className="font-label-sm text-on-surface-variant">Khóa push</dt>
            <dd className="font-body-sm text-on-surface">{formatRepositoryTimestamp(repo.closedAt)}</dd>
          </div>
        ) : null}
        {repo.submittedAt ? (
          <div>
            <dt className="font-label-sm text-on-surface-variant">Ghi nhận nộp</dt>
            <dd className="font-body-sm text-on-surface">{formatRepositoryTimestamp(repo.submittedAt)}</dd>
          </div>
        ) : null}
        {repo.lastPushAt ? (
          <div>
            <dt className="font-label-sm text-on-surface-variant">Lần push cuối</dt>
            <dd className="font-body-sm text-on-surface">{formatRepositoryTimestamp(repo.lastPushAt)}</dd>
          </div>
        ) : null}
      </dl>

      <div className="rounded-lg border border-outline-variant/60 bg-surface/50 p-sm">
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <h3 className="font-label-sm text-on-surface">Commit chốt nộp</h3>
          {canRefreshCommit ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={refreshingCommit}
              disabled={refreshingCommit}
              onClick={() => void handleRefreshCommit()}
            >
              Cập nhật commit
            </Button>
          ) : null}
        </div>
        {latestCommit ? (
          <dl className="mt-sm grid gap-xs sm:grid-cols-2">
            <div>
              <dt className="font-label-sm text-on-surface-variant">SHA</dt>
              <dd className="font-body-sm text-on-surface">
                {latestCommit.htmlUrl ? (
                  <a
                    href={latestCommit.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    {shortCommitSha(latestCommit.sha)}
                  </a>
                ) : (
                  shortCommitSha(latestCommit.sha)
                )}
                {latestCommit.branch ? (
                  <span className="ml-xs text-on-surface-variant">({latestCommit.branch})</span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="font-label-sm text-on-surface-variant">Thời gian commit</dt>
              <dd className="font-body-sm text-on-surface">
                {formatRepositoryTimestamp(latestCommit.committedAt) ?? "—"}
              </dd>
            </div>
            {latestCommit.authorName ? (
              <div>
                <dt className="font-label-sm text-on-surface-variant">Tác giả</dt>
                <dd className="font-body-sm text-on-surface">{latestCommit.authorName}</dd>
              </div>
            ) : null}
            {latestCommit.capturedAt ? (
              <div>
                <dt className="font-label-sm text-on-surface-variant">Ghi nhận lúc</dt>
                <dd className="font-body-sm text-on-surface">
                  {formatRepositoryTimestamp(latestCommit.capturedAt)}
                </dd>
              </div>
            ) : null}
            {latestCommit.message ? (
              <div className="sm:col-span-2">
                <dt className="font-label-sm text-on-surface-variant">Message</dt>
                <dd className="font-body-sm text-on-surface whitespace-pre-wrap">{latestCommit.message}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="mt-sm font-body-sm text-on-surface-variant">
            {submissionStatus === "SUBMITTED"
              ? "Chưa ghi nhận commit — thử «Cập nhật commit» hoặc liên hệ ban tổ chức."
              : canRefreshCommit
                ? "Chưa có commit — push code rồi bấm «Cập nhật commit» để xem trước khi hết giờ."
                : "Commit sẽ được hệ thống tự chốt khi hết giờ đóng đề."}
          </p>
        )}
      </div>
    </li>
  );
}

export function SubmissionPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, event, loading: eventLoading } = useActiveEvent();
  const { team, loading: teamLoading } = useMyTeam(eventId);
  const { submission, loading, error, refetch } = useMySubmission(eventId);
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [repositoryName, setRepositoryName] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"draft" | "submit" | null>(null);
  const teamGuard = useParticipantTeamGuard(team);

  const provisionedReposQuery = useQuery({
    queryKey: queryKeys.repositories.myTeam(team?.id ?? null, eventId),
    queryFn: () => fetchMyTeamRepositories(team!.id, eventId),
    enabled: enableGithubProvisioning && Boolean(team?.id && eventId),
    refetchInterval: (query) => {
      const repos = query.state.data ?? [];
      return repos.some((repo) => repo.accessStatus === "OPEN") ? 60_000 : false;
    }
  });

  const provisionedRepos = useMemo(() => provisionedReposQuery.data ?? [], [provisionedReposQuery.data]);
  const provisionedMode = enableGithubProvisioning;
  const currentRepos = provisionedRepos.filter((repo) => repo.currentRound);
  const historyRepos = provisionedRepos.filter((repo) => !repo.currentRound);
  const primaryRepo = currentRepos[0] ?? provisionedRepos[0] ?? null;

  const profileQuery = useQuery({
    queryKey: ["my-profile"],
    queryFn: fetchMyProfile,
    enabled: enableGithubProvisioning
  });

  const { connectionStatus } = useCommitUpdates({
    teamId: team?.id ?? null,
    eventId,
    enabled: enableGithubProvisioning && Boolean(team?.id)
  });

  const githubProfileBanner = useMemo(() => {
    if (!enableGithubProvisioning || !provisionedMode) return null;
    if (!profileQuery.data?.githubUsername?.trim()) {
      return "Bạn chưa có GitHub username hợp lệ — cập nhật hồ sơ để được cấp repository.";
    }
    const failedRepo = provisionedRepos.find(
      (repo) =>
        repo.provisionStatus === "FAILED" &&
        repo.lastError &&
        /github|username|thiếu|invalid/i.test(repo.lastError)
    );
    return failedRepo?.lastError ?? null;
  }, [profileQuery.data?.githubUsername, provisionedMode, provisionedRepos]);

  useEffect(() => {
    if (submission) {
      setRepositoryUrl(submission.repositoryUrl ?? "");
      setRepositoryName(submission.repositoryName ?? "");
    }
  }, [submission]);

  function validateSubmissionForm(urlValue: string, nameValue: string) {
    const parsed = submissionFormSchema.safeParse({
      repositoryUrl: urlValue,
      repositoryName: nameValue
    });
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setUrlError(errors.repositoryUrl?.[0] ?? null);
      setNameError(errors.repositoryName?.[0] ?? null);
      return false;
    }
    setUrlError(null);
    setNameError(null);
    return true;
  }

  async function invalidateSubmission() {
    if (!eventId) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.submission.my(eventId) });
  }

  async function invalidateProvisionedRepos() {
    if (!team?.id) return;
    await queryClient.invalidateQueries({
      queryKey: queryKeys.repositories.myTeam(team.id, eventId)
    });
  }

  async function handleSaveDraft() {
    if (!eventId || !validateSubmissionForm(repositoryUrl, repositoryName)) return;
    setBusy("draft");
    try {
      await saveSubmissionDraft({
        eventId,
        repositoryUrl: repositoryUrl.trim(),
        repositoryName: repositoryName.trim() || undefined
      });
      await invalidateSubmission();
      notify("Đã lưu bản nháp.", "success");
    } catch (err) {
      applySubmissionApiErrors(err, setUrlError, setNameError);
      notify(mapSubmissionError(err, "Lưu nháp thất bại."), "danger");
    } finally {
      setBusy(null);
    }
  }

  async function handleSubmit() {
    if (!eventId || !validateSubmissionForm(repositoryUrl, repositoryName)) return;
    setBusy("submit");
    try {
      await submitSubmission({
        eventId,
        repositoryUrl: repositoryUrl.trim(),
        repositoryName: repositoryName.trim() || undefined
      });
      await invalidateSubmission();
      notify("Đã nộp bài chính thức.", "success");
    } catch (err) {
      applySubmissionApiErrors(err, setUrlError, setNameError);
      notify(mapSubmissionError(err, "Nộp bài thất bại."), "danger");
    } finally {
      setBusy(null);
    }
  }

  if (eventLoading || teamLoading || loading) {
    return <ModuleSkeleton rows={4} />;
  }

  if (!team) {
    return (
      <div className="space-y-lg">
        <PageHeader eyebrow="Bài nộp" title="Chưa có đội" description="Đăng ký đội để nộp bài." />
        <EmptyState
          icon="upload"
          title="Chưa có đội thi"
          description="Đăng ký hoặc chọn cuộc thi trước khi nộp bài."
          action={<ButtonLink to="/events">Xem cuộc thi</ButtonLink>}
        />
      </div>
    );
  }

  if (teamGuard.blocked && teamGuard.message) {
    return (
      <div className="space-y-lg">
        <PageHeader eyebrow="Bài nộp" title={team.name} description={event?.name ?? ""} />
        <ParticipantTeamBlocked message={teamGuard.message} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-lg">
        <PageHeader eyebrow="Bài nộp" title={team.name} description={event?.name ?? ""} />
        <RetryPanel message={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  const blocked = submission?.blockReason;
  const editable = submission?.editable ?? false;
  const displayStatus = statusLabel(submission?.status ?? null, provisionedMode);
  const displayAccessStatus = overviewAccessStatus(
    primaryRepo,
    submission?.status ?? null,
    submission?.deadlineAt ?? null
  );
  const pageDescription = provisionedMode
    ? "Ban tổ chức cấp repository GitHub — push code trước hạn, không cần nộp link thủ công."
    : "Gửi link repository GitHub hoặc GitLab trước deadline.";

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Bài nộp"
        title={team.name}
        description={pageDescription}
        actions={
          <div className="flex flex-wrap items-center gap-sm">
            {provisionedMode ? <CommitConnectionBadge status={connectionStatus} /> : null}
            <Badge tone={statusTone(submission?.status ?? null)}>{displayStatus}</Badge>
          </div>
        }
      />

      <ParticipantWorkflowBar active="submission" />

      {githubProfileBanner ? (
        <div className="rounded-xl border border-warning/40 bg-warning-container/30 p-md">
          <p className="font-body-sm text-on-surface">{githubProfileBanner}</p>
          <Link to="/profile" className="mt-sm inline-block font-label-sm text-primary hover:underline">
            Cập nhật hồ sơ →
          </Link>
        </div>
      ) : null}

      {provisionedMode ? (
        <>
          <section className="rounded-xl border border-outline-variant bg-surface-container p-md">
            <h2 className="font-title-sm text-on-surface">Tổng quan bài nộp</h2>
            <p className="mt-xs font-body-sm text-on-surface-variant">
              Ban tổ chức cấp repository GitHub khi mở đề. Bạn push code trong thời gian mở — hệ thống tự chốt
              bài khi hết giờ đóng đề, không cần bấm nút xác nhận.
            </p>
            <dl className="mt-md grid gap-md sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-outline-variant/60 bg-surface px-3 py-2">
                <dt className="font-label-sm text-on-surface-variant">Trạng thái nộp</dt>
                <dd className="mt-xs">
                  <Badge tone={statusTone(submission?.status ?? null)}>{displayStatus}</Badge>
                </dd>
              </div>
              <div className="rounded-lg border border-outline-variant/60 bg-surface px-3 py-2">
                <dt className="font-label-sm text-on-surface-variant">Repository</dt>
                <dd className="mt-xs">
                  {primaryRepo ? (
                    <Badge tone={provisionStatusTone(primaryRepo.provisionStatus)}>
                      {PROVISION_STATUS_LABELS[primaryRepo.provisionStatus]}
                    </Badge>
                  ) : (
                    <Badge tone="warning">Chưa cấp</Badge>
                  )}
                </dd>
              </div>
              <div className="rounded-lg border border-outline-variant/60 bg-surface px-3 py-2">
                <dt className="font-label-sm text-on-surface-variant">Quyền push</dt>
                <dd className="mt-xs">
                  {displayAccessStatus ? (
                    <Badge tone={accessStatusTone(displayAccessStatus)}>
                      {ACCESS_STATUS_LABELS[displayAccessStatus]}
                    </Badge>
                  ) : (
                    <Badge tone="neutral">—</Badge>
                  )}
                </dd>
              </div>
              <div className="rounded-lg border border-outline-variant/60 bg-surface px-3 py-2">
                <dt className="font-label-sm text-on-surface-variant">Hạn nộp</dt>
                <dd className="mt-xs font-body-sm text-on-surface">
                  {submission?.deadlineAt
                    ? formatRepositoryTimestamp(submission.deadlineAt)
                    : "Chưa cấu hình"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-outline-variant bg-surface-container p-md">
            <h2 className="font-title-sm text-on-surface">Repository vòng hiện tại</h2>
            <p className="mt-xs font-body-sm text-on-surface-variant">
              Mỗi vòng thi có repository riêng. Vào chung kết, ban tổ chức cấp repo mới — repo vòng trước chỉ để
              tham khảo.
            </p>
            {provisionedReposQuery.isLoading ? (
              <p className="mt-sm font-body-sm text-on-surface-variant">Đang tải repository…</p>
            ) : currentRepos.length === 0 && historyRepos.length === 0 ? (
              <div className="mt-md">
                <EmptyState
                  icon="upload"
                  title="Chưa có repository"
                  description="Ban tổ chức sẽ tạo repository GitHub khi mở đề vòng hiện tại."
                />
              </div>
            ) : currentRepos.length === 0 ? (
              <div className="mt-md">
                <EmptyState
                  icon="hourglass_empty"
                  title="Chưa cấp repo vòng này"
                  description="Đội đã vào vòng mới — chờ ban tổ chức cấp repository cho vòng chung kết."
                />
              </div>
            ) : (
              <ul className="mt-md space-y-md">
                {currentRepos.map((repo) => (
                  <RepositoryDetailCard
                    key={repo.id}
                    repo={repo}
                    onCommitRefreshed={invalidateProvisionedRepos}
                  />
                ))}
              </ul>
            )}
          </section>

          {historyRepos.length > 0 ? (
            <section className="rounded-xl border border-outline-variant bg-surface-container p-md">
              <h2 className="font-title-sm text-on-surface">Repository các vòng trước</h2>
              <ul className="mt-md space-y-md">
                {historyRepos.map((repo) => (
                  <RepositoryDetailCard
                    key={repo.id}
                    repo={repo}
                    onCommitRefreshed={invalidateProvisionedRepos}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {blocked ? (
            <div className="rounded-xl border border-warning/40 bg-warning-container/30 p-md">
              <p className="font-body-sm text-on-surface-variant">
                {blockReasonLabels[blocked] ?? blocked}
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <>
          {blocked ? (
            <div className="rounded-xl border border-warning/40 bg-warning-container/30 p-md">
              <p className="font-body-sm text-on-surface-variant">
                {blockReasonLabels[blocked] ?? blocked}
              </p>
            </div>
          ) : null}

          {submission?.deadlineAt ? (
            <p className="font-body-sm text-on-surface-variant">
              Hạn nộp: {formatRepositoryTimestamp(submission.deadlineAt)}
            </p>
          ) : null}

          {submission?.submittedAt ? (
            <p className="font-body-sm text-on-surface-variant">
              Ghi nhận lúc: {formatRepositoryTimestamp(submission.submittedAt)}
            </p>
          ) : null}

          {!blocked ? (
            <section className="max-w-xl space-y-md rounded-xl border border-outline-variant bg-surface-container p-md">
              <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
                Link repository (GitHub / GitLab) *
                <input
                  type="url"
                  className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                  placeholder="https://github.com/org/repo"
                  value={repositoryUrl}
                  disabled={!editable || busy !== null}
                  onChange={(e) => {
                    setRepositoryUrl(e.target.value);
                    if (urlError || nameError) {
                      validateSubmissionForm(e.target.value, repositoryName);
                    }
                  }}
                  onBlur={() =>
                    repositoryUrl && validateSubmissionForm(repositoryUrl, repositoryName)
                  }
                />
                {urlError ? <span className="text-error">{urlError}</span> : null}
              </label>

              <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
                Tên dự án (tùy chọn)
                <input
                  className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                  value={repositoryName}
                  disabled={!editable || busy !== null}
                  onChange={(e) => {
                    setRepositoryName(e.target.value);
                    if (nameError) validateSubmissionForm(repositoryUrl, e.target.value);
                  }}
                  onBlur={() => validateSubmissionForm(repositoryUrl, repositoryName)}
                />
                {nameError ? <span className="text-error">{nameError}</span> : null}
              </label>

              <div className="flex flex-wrap gap-md">
                <Button
                  type="button"
                  variant="secondary"
                  loading={busy === "draft"}
                  disabled={!editable || busy !== null}
                  onClick={() => void handleSaveDraft()}
                >
                  Lưu bản nháp
                </Button>
                <ConfirmAction
                  title="Nộp bài chính thức"
                  message="Sau khi nộp, ban tổ chức và giám khảo sẽ dùng link này. Bạn không thể sửa hoặc nộp lại sau khi đã nộp chính thức."
                  confirmLabel="Nộp bài"
                  onConfirm={() => void handleSubmit()}
                >
                  <Button type="button" loading={busy === "submit"} disabled={!editable || busy !== null}>
                    Nộp chính thức
                  </Button>
                </ConfirmAction>
              </div>

              {submission?.status === "DRAFT" ? (
                <p className="font-body-sm text-on-surface-variant">
                  Bản nháp chưa được coi là đã nộp — bấm «Nộp chính thức» khi sẵn sàng.
                </p>
              ) : null}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
