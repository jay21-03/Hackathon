import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventSetupProgress } from "../../hooks/useEventSetupProgress";
import { enableScoring } from "../../config/features";
import { queryKeys } from "../../lib/queryKeys";
import {
  fetchEventRankings,
  fetchPublishReadiness,
  publishBoardRanking,
  publishEventRankings
} from "../../services/rankingApi";
import { createIdempotencyKey } from "../../utils/idempotency";
import { invalidateAfterPublish } from "../../lib/invalidateRankingQueries";
import { resolveApiError } from "../../utils/apiError";
import { buildRankingWorkflowSteps } from "../../utils/rankingWorkflow";
import { sortBoardRankings } from "../../utils/sortContestData";
import { formatBoardRankingLabel, groupBoardRankingsByRound } from "../../utils/boardLabels";

export function PublishResultsPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { context: setupContext, loading: setupLoading } = useEventSetupProgress(
    eventId,
    "/organizer/publish-results"
  );
  const [publishing, setPublishing] = useState(false);
  const [publishingBoardId, setPublishingBoardId] = useState<number | null>(null);

  const rankingsQuery = useQuery({
    queryKey: queryKeys.rankings.event(eventId),
    queryFn: () => fetchEventRankings(eventId!),
    enabled: Boolean(eventId)
  });

  const readinessQuery = useQuery({
    queryKey: [...queryKeys.rankings.event(eventId), "publish-readiness"],
    queryFn: () => fetchPublishReadiness(eventId!),
    enabled: Boolean(eventId)
  });

  const boards = rankingsQuery.data?.boards ?? [];
  const sortedBoards = useMemo(() => sortBoardRankings(boards), [boards]);
  const boardsByRound = useMemo(() => groupBoardRankingsByRound(sortedBoards), [sortedBoards]);
  const boardLabelById = useMemo(
    () => Object.fromEntries(sortedBoards.map((board) => [board.boardId, formatBoardRankingLabel(board)])),
    [sortedBoards]
  );
  const draftBoards = useMemo(
    () => boards.filter((b) => !b.published && b.teamCount > 0),
    [boards]
  );
  const publishedBoards = useMemo(() => boards.filter((b) => b.published), [boards]);

  async function invalidateRankings() {
    await invalidateAfterPublish(queryClient, eventId);
    await queryClient.invalidateQueries({
      queryKey: [...queryKeys.rankings.event(eventId), "publish-readiness"]
    });
  }

  const publishReady = readinessQuery.data?.ready !== false;

  function isBoardPublishReady(boardId: number) {
    const board = readinessQuery.data?.boards.find((row) => row.boardId === boardId);
    return board?.ready ?? publishReady;
  }

  function notifyPublishBlocked() {
    const readiness = readinessQuery.data;
    if (!readiness) {
      notify("Chưa đủ điều kiện công bố.", "warning");
      return;
    }
    const messages = [
      ...readiness.blockers,
      ...readiness.boards.flatMap((board) =>
        board.blockers.map((blocker) => `${boardLabelById[board.boardId] ?? board.boardName}: ${blocker}`)
      )
    ];
    notify(messages.length ? messages.join(" · ") : "Chưa đủ điều kiện công bố.", "warning");
  }

  async function handlePublishAll() {
    if (!eventId) return;
    if (!publishReady) {
      notifyPublishBlocked();
      return;
    }
    setPublishing(true);
    try {
      const result = await publishEventRankings(eventId, createIdempotencyKey("publish-all"));
      await invalidateRankings();
      const count = result.newlyPublishedBoards ?? result.boardsCalculated;
      if (result.message === "ALREADY_PUBLISHED" || count === 0) {
        notify("Tất cả bảng đã được công bố trước đó.", "warning");
      } else {
        notify(`Đã công bố ${count} bảng mới.`, "success");
      }
    } catch (err) {
      notify(resolveApiError(err, "Công bố thất bại."), "danger");
    } finally {
      setPublishing(false);
    }
  }

  async function handlePublishBoard(boardId: number) {
    if (!isBoardPublishReady(boardId)) {
      const board = readinessQuery.data?.boards.find((row) => row.boardId === boardId);
      const messages = board?.blockers ?? readinessQuery.data?.blockers ?? [];
      notify(
        messages.length ? messages.join(" · ") : "Bảng này chưa đủ điều kiện công bố.",
        "warning"
      );
      return;
    }
    setPublishingBoardId(boardId);
    try {
      await publishBoardRanking(boardId, createIdempotencyKey(`publish-board-${boardId}`));
      await invalidateRankings();
      notify("Đã công bố bảng này.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Công bố thất bại."), "danger");
    } finally {
      setPublishingBoardId(null);
    }
  }

  if (eventLoading || setupLoading || rankingsQuery.isLoading) {
    return <ModuleSkeleton rows={5} variant="table" />;
  }

  if (!setupContext.hasBoards || (enableScoring && !setupContext.hasRubric)) {
    return (
      <div className="space-y-lg">
        {!embedded ? (
          <PageHeader
            eyebrow="Công bố"
            title="Công bố kết quả"
            description="Hoàn tất chấm điểm và tính xếp hạng trước khi công bố."
            actions={<OrganizerContextBar />}
          />
        ) : null}
        <EmptyState
          icon="campaign"
          title="Chưa sẵn sàng công bố"
          description={
            !setupContext.hasBoards
              ? "Cần tạo bảng thi và gán đội trước."
              : "Thiết lập tiêu chí chấm và hoàn tất chấm điểm trước khi công bố."
          }
          action={
            <Link
              to={
                !setupContext.hasBoards
                  ? "/organizer/boards"
                  : "/organizer/boards#board-step-rubric"
              }
            >
              <Button type="button" variant="ghost">
                {!setupContext.hasBoards ? "Đến Bảng thi" : "Đến Tiêu chí chấm"}
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <>
          <PageHeader
            eyebrow="Công bố"
            title="Công bố kết quả"
            description="Sau khi công bố, thí sinh và khách xem được tại trang kết quả công khai — không cần đăng nhập."
            actions={<OrganizerContextBar />}
          />
          <WorkflowSteps
            title="Quy trình kết quả"
            description="Hoàn tất chấm điểm → tính xếp hạng → công bố → xuất báo cáo."
            steps={buildRankingWorkflowSteps("publish")}
          />
        </>
      ) : null}

      {rankingsQuery.error ? (
        <RetryPanel
          message={resolveApiError(rankingsQuery.error, "Không tải được dữ liệu công bố.")}
          onRetry={() => void rankingsQuery.refetch()}
        />
      ) : null}

      {readinessQuery.data && !readinessQuery.data.ready ? (
        <section className="rounded-xl border border-warning-container bg-warning-container/20 p-lg">
          <h2 className="font-headline-sm text-on-surface">Chưa đủ điều kiện công bố</h2>
          <ul className="mt-sm list-disc space-y-xs pl-md font-body-sm text-on-surface-variant">
            {readinessQuery.data.blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
            {readinessQuery.data.boards.flatMap((board) =>
              board.blockers.map((blocker) => (
                <li key={`${board.boardId}-${blocker}`}>
                  {boardLabelById[board.boardId] ?? board.boardName}: {blocker}
                </li>
              ))
            )}
          </ul>
        </section>
      ) : null}

      {boards.length === 0 ? (
        <EmptyState
          icon="campaign"
          title="Chưa có xếp hạng để công bố"
          description="Tính xếp hạng cho từng bảng trước khi công bố kết quả."
          action={
            <Link to={embedded ? "/organizer/results-hub#results-step-ranking" : "/organizer/ranking"}>
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

          <section className="space-y-lg">
            {boardsByRound.map((group) => (
              <div key={group.key} className="space-y-md">
                <h2 className="font-headline-sm text-on-surface">{group.roundName}</h2>
                {group.boards.map((board) => (
              <details
                key={board.boardId}
                className="rounded-xl border border-outline-variant bg-surface-container px-md py-sm"
                open={!board.published && board.entries.length > 0}
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-md py-xs [&::-webkit-details-marker]:hidden">
                  <div>
                    <p className="font-label-md text-on-surface">{board.boardName}</p>
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
                        disabled={!isBoardPublishReady(board.boardId)}
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
              </div>
            ))}
          </section>

          {draftBoards.length > 0 ? (
            <ConfirmAction
              title="Công bố tất cả bảng nháp?"
              message={`${draftBoards.length} bảng sẽ hiển thị công khai cho thí sinh và khách.`}
              confirmLabel="Công bố tất cả"
              onConfirm={() => void handlePublishAll()}
            >
              <Button type="button" loading={publishing} disabled={!publishReady}>
                Công bố tất cả bảng đã tính ({draftBoards.length})
              </Button>
            </ConfirmAction>
          ) : null}
        </>
      )}
    </div>
  );
}
