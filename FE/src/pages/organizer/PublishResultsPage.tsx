import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { NextStepPanel } from "../../components/ui/NextStepPanel";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { queryKeys } from "../../lib/queryKeys";
import {
  fetchEventRankings,
  publishBoardRanking,
  publishEventRankings
} from "../../services/rankingApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { mapOrganizerErrorMessage } from "../../utils/organizerErrors";
import { buildRankingWorkflowSteps } from "../../utils/rankingWorkflow";

export function PublishResultsPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const [publishing, setPublishing] = useState(false);
  const [publishingBoardId, setPublishingBoardId] = useState<number | null>(null);

  const rankingsQuery = useQuery({
    queryKey: queryKeys.rankings.event(eventId),
    queryFn: () => fetchEventRankings(eventId!),
    enabled: Boolean(eventId)
  });

  async function invalidateRankings() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.rankings.event(eventId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.rankings.all });
  }

  async function handlePublishAll() {
    if (!eventId) return;
    setPublishing(true);
    try {
      const result = await publishEventRankings(eventId);
      await invalidateRankings();
      const count = result.newlyPublishedBoards ?? result.boardsCalculated;
      if (result.message === "ALREADY_PUBLISHED" || count === 0) {
        notify("Tất cả bảng đã được công bố trước đó.", "warning");
      } else {
        notify(`Đã công bố ${count} bảng mới.`, "success");
      }
    } catch (err) {
      notify(mapOrganizerErrorMessage(getApiErrorMessage(err, "Công bố thất bại.")), "danger");
    } finally {
      setPublishing(false);
    }
  }

  async function handlePublishBoard(boardId: number) {
    setPublishingBoardId(boardId);
    try {
      await publishBoardRanking(boardId);
      await invalidateRankings();
      notify("Đã công bố bảng này.", "success");
    } catch (err) {
      notify(mapOrganizerErrorMessage(getApiErrorMessage(err, "Công bố thất bại.")), "danger");
    } finally {
      setPublishingBoardId(null);
    }
  }

  if (eventLoading || rankingsQuery.isLoading) {
    return <ModuleSkeleton rows={5} variant="table" />;
  }

  const data = rankingsQuery.data;
  const boards = data?.boards ?? [];
  const draftBoards = boards.filter((b) => !b.published && b.teamCount > 0);
  const publishedBoards = boards.filter((b) => b.published);

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Công bố"
        title="Công bố kết quả"
        description="Sau khi công bố, thí sinh và khách xem được tại trang kết quả công khai — không cần đăng nhập."
        actions={<EventSelector events={events} eventId={eventId} onChange={setEventId} />}
      />

      <WorkflowSteps
        title="Quy trình kết quả"
        description="Hoàn tất chấm điểm → tính xếp hạng → công bố → xuất báo cáo."
        steps={buildRankingWorkflowSteps("publish")}
      />

      {rankingsQuery.error ? (
        <RetryPanel
          message={getApiErrorMessage(rankingsQuery.error)}
          onRetry={() => void rankingsQuery.refetch()}
        />
      ) : null}

      {boards.length === 0 ? (
        <EmptyState
          icon="campaign"
          title="Chưa có xếp hạng để công bố"
          description="Tính xếp hạng cho từng bảng trước khi công bố kết quả."
          action={
            <Link to="/organizer/ranking">
              <Button type="button" variant="ghost">
                Đến bảng xếp hạng
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <section className="grid gap-md md:grid-cols-2">
            <div className="rounded-xl border border-outline-variant bg-surface-container p-md">
              <p className="font-label-sm text-on-surface-variant">Bản nháp</p>
              <p className="font-headline-md text-on-surface">{draftBoards.length} bảng</p>
            </div>
            <div className="rounded-xl border border-outline-variant bg-surface-container p-md">
              <p className="font-label-sm text-on-surface-variant">Đã công bố</p>
              <p className="font-headline-md text-on-surface">{publishedBoards.length} bảng</p>
            </div>
          </section>

          <section className="space-y-md">
            {boards.map((board) => (
              <details
                key={board.boardId}
                className="rounded-xl border border-outline-variant bg-surface-container px-md py-sm"
                open={!board.published && board.entries.length > 0}
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-md py-xs [&::-webkit-details-marker]:hidden">
                  <div>
                    <p className="font-label-md text-on-surface">
                      {board.boardName}
                      {board.roundName ? ` · ${board.roundName}` : ""}
                    </p>
                    <p className="font-body-sm text-on-surface-variant">{board.teamCount} đội xếp hạng</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-sm">
                    <Badge tone={board.published ? "success" : "warning"}>
                      {board.published ? "Đã công bố" : "Nháp"}
                    </Badge>
                    {!board.published && board.teamCount > 0 ? (
                      <Button
                        type="button"
                        variant="secondary"
                        loading={publishingBoardId === board.boardId}
                        onClick={(e) => {
                          e.preventDefault();
                          void handlePublishBoard(board.boardId);
                        }}
                      >
                        Công bố bảng này
                      </Button>
                    ) : null}
                  </div>
                </summary>
                {board.entries.length > 0 ? (
                  <div className="mt-sm overflow-x-auto border-t border-outline-variant pt-sm">
                    <table className="min-w-full text-left">
                      <thead>
                        <tr className="font-label-sm text-on-surface-variant">
                          <th className="px-sm py-xs">Hạng</th>
                          <th className="px-sm py-xs">Đội</th>
                          <th className="px-sm py-xs">Điểm TB</th>
                          <th className="px-sm py-xs">GK đã nộp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {board.entries.map((row) => (
                          <tr key={row.teamId} className="font-body-sm text-on-surface">
                            <td className="px-sm py-xs">{row.rank}</td>
                            <td className="px-sm py-xs">{row.teamName}</td>
                            <td className="px-sm py-xs">{Number(row.averageScore).toFixed(2)}</td>
                            <td className="px-sm py-xs">{row.submittedJudgeCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </details>
            ))}
          </section>

          {draftBoards.length > 0 ? (
            <ConfirmAction
              title="Công bố tất cả bảng nháp?"
              message={`${draftBoards.length} bảng sẽ hiển thị công khai cho thí sinh và khách.`}
              confirmLabel="Công bố tất cả"
              onConfirm={() => void handlePublishAll()}
            >
              <Button type="button" loading={publishing}>
                Công bố tất cả bảng đã tính ({draftBoards.length})
              </Button>
            </ConfirmAction>
          ) : (
            <NextStepPanel
              variant="success"
              action={{
                title: "Đã công bố toàn bộ",
                description: "Xem trang công khai hoặc xuất CSV báo cáo.",
                to: eventId ? `/events/${eventId}/results` : "/events",
                cta: "Xem kết quả công khai"
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
