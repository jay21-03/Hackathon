import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { AiReviewHistoryPanel } from "../../components/ai-review/AiReviewHistoryPanel";
import { AiReviewView } from "../../components/ai-review/AiReviewView";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { queryKeys } from "../../lib/queryKeys";
import {
  fetchAiReviewBulkJob,
  fetchEventAiReviews,
  fetchLatestTeamAiReview,
  fetchTeamAiReviewHistory,
  triggerEventAiReviewsAsync,
  triggerTeamAiReview,
  type AiReviewResponse
} from "../../services/aiReviewApi";
import { resolveApiError } from "../../utils/apiError";

function statusTone(status: AiReviewResponse["status"]) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "FAILED") return "danger" as const;
  return "warning" as const;
}

export function AiReviewManagementPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const [runningTeamId, setRunningTeamId] = useState<number | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [bulkProgress, setBulkProgress] = useState<string | null>(null);

  const selectedTeamId = useMemo(() => {
    const raw = searchParams.get("teamId");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

  const reviewsQuery = useQuery({
    queryKey: [...queryKeys.events.detail(eventId ?? ""), "ai-reviews"],
    queryFn: () => fetchEventAiReviews(eventId!),
    enabled: Boolean(eventId)
  });

  const detailQuery = useQuery({
    queryKey: ["organizer", "ai-review-detail", selectedTeamId],
    queryFn: () => fetchLatestTeamAiReview(selectedTeamId!),
    enabled: selectedTeamId != null
  });

  useEffect(() => {
    if (!selectedTeamId || reviewsQuery.isLoading) return;
    const exists = (reviewsQuery.data ?? []).some((item) => item.teamId === selectedTeamId);
    if (!exists && (reviewsQuery.data ?? []).length > 0) {
      setSearchParams({}, { replace: true });
    }
  }, [reviewsQuery.data, reviewsQuery.isLoading, selectedTeamId, setSearchParams]);

  const historyQuery = useQuery({
    queryKey: ["organizer", "ai-review-history", selectedTeamId],
    queryFn: () => fetchTeamAiReviewHistory(selectedTeamId!),
    enabled: selectedTeamId != null
  });

  const filteredReviews = useMemo(() => {
    return (reviewsQuery.data ?? []).filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (search.trim()) {
        const label = (item.teamName ?? `Đội #${item.teamId}`).toLowerCase();
        if (!label.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [reviewsQuery.data, search, statusFilter]);

  async function pollBulkJob(jobId: string) {
    if (!eventId) return;
    for (let i = 0; i < 120; i++) {
      const job = await fetchAiReviewBulkJob(eventId, jobId);
      setBulkProgress(`${job.processed}/${job.total} đội`);
      if (job.status === "COMPLETED" || job.status === "FAILED") {
        await queryClient.invalidateQueries({
          queryKey: [...queryKeys.events.detail(eventId), "ai-reviews"]
        });
        const message =
          job.status === "FAILED"
            ? job.errorMessage ?? "Job AI hàng loạt thất bại."
            : `Hoàn tất ${job.succeededCount}/${job.total} đội` +
              (job.failedCount > 0 ? ` — ${job.failedCount} lỗi.` : ".");
        notify(message, job.failedCount > 0 || job.status === "FAILED" ? "warning" : "success");
        setBulkProgress(null);
        return;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    notify("Job AI vẫn đang chạy — làm mới trang sau vài phút.", "warning");
    setBulkProgress(null);
  }

  async function handleRunAll() {
    if (!eventId) return;
    setRunningAll(true);
    try {
      const job = await triggerEventAiReviewsAsync(eventId);
      setBulkProgress(`0/${job.total} đội`);
      await pollBulkJob(job.jobId);
    } catch (err) {
      notify(resolveApiError(err, "Không chạy được đánh giá AI hàng loạt."), "danger");
    } finally {
      setRunningAll(false);
    }
  }

  async function handleRunReview(teamId: number) {
    setRunningTeamId(teamId);
    try {
      await triggerTeamAiReview(teamId);
      await queryClient.invalidateQueries({
        queryKey: [...queryKeys.events.detail(eventId ?? ""), "ai-reviews"]
      });
      await queryClient.invalidateQueries({ queryKey: ["organizer", "ai-review-detail", teamId] });
      setSearchParams({ teamId: String(teamId) }, { replace: true });
      notify("Đã chạy đánh giá AI cho đội.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Không chạy được đánh giá AI."), "danger");
    } finally {
      setRunningTeamId(null);
    }
  }

  function selectTeam(teamId: number) {
    setSearchParams({ teamId: String(teamId) }, { replace: true });
  }

  if (eventLoading || reviewsQuery.isLoading) return <ModuleSkeleton rows={5} />;

  const allReviews = reviewsQuery.data ?? [];
  const reviews = filteredReviews;
  const selectedReview = allReviews.find((item) => item.teamId === selectedTeamId) ?? null;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Vận hành"
        title="Đánh giá AI"
        description="Theo dõi tiêu chí kỹ thuật (R1) và demo (R2), phân tích mã nguồn đội. Chu kỳ tự động: 5 phút."
        actions={
          <div className="flex flex-wrap items-center gap-sm">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              loading={runningAll}
              disabled={!eventId || reviews.length === 0}
              onClick={() => void handleRunAll()}
            >
              Chạy tất cả đội {bulkProgress ? `(${bulkProgress})` : ""}
            </Button>
            <OrganizerContextBar />
          </div>
        }
      />

      {reviews.length === 0 ? (
        <EmptyState
          icon="psychology"
          title="Chưa có đội có mã nguồn"
          description="Cấp mã nguồn cho đội trước, đảm bảo dịch vụ đánh giá AI đã được bật, rồi bấm «Chạy tất cả đội» hoặc «Chạy lại» từng đội."
        />
      ) : (
        <>
          <section className="flex flex-wrap gap-md rounded-xl border border-outline-variant bg-surface-container p-md">
            <label className="flex min-w-[10rem] flex-col gap-1 font-label-sm text-on-surface-variant">
              Lọc trạng thái
              <select
                className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả</option>
                <option value="PENDING">Chưa chạy / đang xử lý</option>
                <option value="COMPLETED">Hoàn tất</option>
                <option value="FAILED">Lỗi</option>
              </select>
            </label>
            <label className="flex min-w-[12rem] flex-1 flex-col gap-1 font-label-sm text-on-surface-variant">
              Tìm đội
              <input
                className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                placeholder="Tên đội…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </section>
          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
            <table className="min-w-full text-left">
              <thead className="table-header-bg">
                <tr className="font-label-sm text-on-surface-variant">
                  <th className="px-md py-sm">Đội</th>
                  <th className="px-md py-sm">Loại</th>
                  <th className="px-md py-sm">Trạng thái</th>
                  <th className="px-md py-sm">RAG</th>
                  <th className="px-md py-sm">Tóm tắt</th>
                  <th className="px-md py-sm">Cập nhật</th>
                  <th className="px-md py-sm">Thao tác</th>
                </tr>
              </thead>
              <tbody className="table-divider">
                {reviews.map((review) => {
                  const isSelected = review.teamId === selectedTeamId;
                  return (
                    <tr
                      key={review.id ?? `team-${review.teamId}`}
                      className={`font-body-sm text-on-surface ${isSelected ? "bg-surface-container-high" : ""}`}
                    >
                      <td className="px-md py-md">
                        <button
                          type="button"
                          className="text-left font-label-sm text-primary underline-offset-2 hover:underline"
                          onClick={() => selectTeam(review.teamId)}
                        >
                          {review.teamName ?? `Đội #${review.teamId}`}
                        </button>
                      </td>
                      <td className="px-md py-md">
                        {review.reviewKind === "TEAM_AGGREGATE" ? "Tổng hợp" : "Per-push"}
                      </td>
                      <td className="px-md py-md">
                        {review.status ? (
                          <Badge tone={statusTone(review.status)}>{review.status}</Badge>
                        ) : (
                          <Badge tone="neutral">Chưa chạy</Badge>
                        )}
                      </td>
                      <td className="px-md py-md">{review.ragLevel ?? "—"}</td>
                      <td className="max-w-md px-md py-md text-on-surface-variant">
                        {review.summary ?? "—"}
                      </td>
                      <td className="px-md py-md">
                        {review.reviewedAt ? new Date(review.reviewedAt).toLocaleString("vi-VN") : "—"}
                      </td>
                      <td className="px-md py-md">
                        <div className="flex flex-wrap gap-xs">
                          <Button type="button" size="sm" variant="ghost" onClick={() => selectTeam(review.teamId)}>
                            Rubric
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            loading={runningTeamId === review.teamId}
                            onClick={() => void handleRunReview(review.teamId)}
                          >
                            Chạy lại
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {selectedTeamId ? (
            <section className="space-y-sm">
              <h2 className="font-title-sm text-on-surface">
                Chi tiết rubric — {selectedReview?.teamName ?? `Đội #${selectedTeamId}`}
              </h2>
              <AiReviewHistoryPanel
                reviews={historyQuery.data ?? []}
                loading={historyQuery.isLoading}
                selectedId={detailQuery.data?.id ?? selectedReview?.id ?? null}
              />
              <AiReviewView
                review={detailQuery.data ?? selectedReview}
                loading={detailQuery.isLoading}
                detailedRubric
              />
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
