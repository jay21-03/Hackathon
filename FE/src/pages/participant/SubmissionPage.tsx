import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { repositoryUrlSchema } from "../../domain/schemas";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useMySubmission } from "../../hooks/useMySubmission";
import { useMyTeam } from "../../hooks/useMyTeam";
import { queryKeys } from "../../lib/queryKeys";
import { saveSubmissionDraft, submitSubmission } from "../../services/submissionApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { mapOrganizerErrorMessage } from "../../utils/organizerErrors";
import { zodFirstError } from "../../utils/formValidation";

const blockReasonLabels: Record<string, string> = {
  NO_TEAM: "Chưa có đội thi.",
  TEAM_NOT_CONFIRMED: "Đội chưa được xác nhận.",
  NOT_ASSIGNED: "Chưa được phân bảng.",
  NO_PROBLEM: "Ban tổ chức chưa cấu hình đề cho bảng của bạn.",
  NOT_RELEASED: "Đề chưa mở — chưa thể nộp bài.",
  PROBLEM_CLOSED: "Đề đã đóng — không thể nộp bài.",
  PROBLEM_UNAVAILABLE: "Chưa thể nộp bài trong thời điểm hiện tại.",
  SUBMISSION_DEADLINE_PASSED: "Đã qua hạn nộp bài.",
  SUBMISSION_ALREADY_SUBMITTED: "Bài đã nộp — không thể sửa hoặc nộp lại.",
  INVALID_REPOSITORY_URL: "Link phải là GitHub hoặc GitLab hợp lệ.",
  REPOSITORY_URL_REQUIRED: "Nhập link repository trước khi nộp."
};

function mapSubmissionError(error: unknown, fallback: string) {
  return mapOrganizerErrorMessage(getApiErrorMessage(error, fallback));
}

function statusLabel(status: string | null | undefined) {
  if (status === "SUBMITTED") return "Đã nộp";
  if (status === "DRAFT") return "Bản nháp";
  return "Chưa nộp";
}

function statusTone(status: string | null | undefined): "success" | "warning" | "neutral" {
  if (status === "SUBMITTED") return "success";
  if (status === "DRAFT") return "warning";
  return "neutral";
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
  const [busy, setBusy] = useState<"draft" | "submit" | null>(null);

  useEffect(() => {
    if (submission) {
      setRepositoryUrl(submission.repositoryUrl ?? "");
      setRepositoryName(submission.repositoryName ?? "");
    }
  }, [submission]);

  function validateUrl(value: string) {
    const parsed = repositoryUrlSchema.safeParse(value);
    if (!parsed.success) {
      setUrlError(zodFirstError(parsed.error));
      return false;
    }
    setUrlError(null);
    return true;
  }

  async function invalidateSubmission() {
    if (!eventId) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.submission.my(eventId) });
  }

  async function handleSaveDraft() {
    if (!eventId || !validateUrl(repositoryUrl)) return;
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
      notify(mapSubmissionError(err, "Lưu nháp thất bại."), "danger");
    } finally {
      setBusy(null);
    }
  }

  async function handleSubmit() {
    if (!eventId || !validateUrl(repositoryUrl)) return;
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
        <EmptyState icon="upload" title="Chưa có đội thi" description="Đăng ký đội trước khi nộp bài." />
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
  const displayStatus = statusLabel(submission?.status ?? null);

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Bài nộp"
        title={team.name}
        description="Gửi link repository GitHub hoặc GitLab trước deadline."
        actions={<Badge tone={statusTone(submission?.status ?? null)}>{displayStatus}</Badge>}
      />

      {blocked ? (
        <div className="rounded-xl border border-warning/40 bg-warning-container/30 p-md">
          <p className="font-body-sm text-on-surface-variant">
            {blockReasonLabels[blocked] ?? blocked}
          </p>
        </div>
      ) : null}

      {submission?.deadlineAt ? (
        <p className="font-body-sm text-on-surface-variant">
          Hạn nộp:{" "}
          {new Date(submission.deadlineAt).toLocaleString("vi-VN", {
            dateStyle: "medium",
            timeStyle: "short"
          })}
        </p>
      ) : null}

      {submission?.submittedAt ? (
        <p className="font-body-sm text-on-surface-variant">
          Nộp lúc:{" "}
          {new Date(submission.submittedAt).toLocaleString("vi-VN", {
            dateStyle: "medium",
            timeStyle: "short"
          })}
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
                if (urlError) validateUrl(e.target.value);
              }}
              onBlur={() => repositoryUrl && validateUrl(repositoryUrl)}
            />
            {urlError ? <span className="text-error">{urlError}</span> : null}
          </label>

          <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
            Tên dự án (tùy chọn)
            <input
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
              value={repositoryName}
              disabled={!editable || busy !== null}
              onChange={(e) => setRepositoryName(e.target.value)}
            />
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
              message="Sau khi nộp, ban tổ chức và giám khảo sẽ dùng link này. Bạn vẫn có thể cập nhật trước deadline."
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
    </div>
  );
}
