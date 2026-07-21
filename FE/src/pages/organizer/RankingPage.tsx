import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventBoards } from "../../hooks/useEventBoards";
import { useScoreProgress } from "../../hooks/useScoreProgress";
import { queryKeys } from "../../lib/queryKeys";
import {
  calculateBoardRanking,
  calculateRoundRanking,
  fetchBoardRanking,
  unpublishBoardRanking,
  type BoardRanking
} from "../../services/rankingApi";
import { resolveApiError } from "../../utils/apiError";
import {
  formatBoardRankingLabel
} from "../../utils/boardLabels";
import { buildRankingWorkflowSteps } from "../../utils/rankingWorkflow";
import { resolveDefaultBoardId, resolveDefaultRoundId } from "../../utils/pickActiveRound";

type RankingFilterState = {
  roundId: number | null;
  boardId: number | null;
};
const RANKING_FILTER_STORAGE_KEY = "seal.organizerRanking.filters";

function loadRankingFilters(): RankingFilterState {
  try {
    const raw = window.localStorage.getItem(RANKING_FILTER_STORAGE_KEY);
    if (!raw) return { roundId: null, boardId: null };
    const parsed = JSON.parse(raw) as Partial<RankingFilterState>;
    return {
      roundId: typeof parsed.roundId === "number" ? parsed.roundId : null,
      boardId: typeof parsed.boardId === "number" ? parsed.boardId : null
    };
  } catch {
    return { roundId: null, boardId: null };
  }
}

export function RankingPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { rounds, boards, loading: boardsLoading } = useEventBoards(eventId);
  const [initialFilters] = useState(loadRankingFilters);
  const [boardId, setBoardId] = useState<number | null>(initialFilters.boardId);
  const [roundId, setRoundId] = useState<number | null>(initialFilters.roundId);
  const [calculating, setCalculating] = useState(false);
  const autoCalculatedBoards = useRef(new Set<number>());

  const activeRoundId = resolveDefaultRoundId(rounds, roundId);
  const boardsInRound = useMemo(
    () => (activeRoundId != null ? boards.filter((b) => b.roundId === activeRoundId) : []),
    [boards, activeRoundId]
  );
  const activeBoardId = resolveDefaultBoardId(boardsInRound, rounds, boardId);

  useEffect(() => {
    window.localStorage.setItem(
      RANKING_FILTER_STORAGE_KEY,
      JSON.stringify({ roundId: activeRoundId, boardId: activeBoardId })
    );
  }, [activeBoardId, activeRoundId]);

  useEffect(() => {
    setRoundId((prev) => resolveDefaultRoundId(rounds, prev));
  }, [rounds]);

  useEffect(() => {
    setBoardId((prev) => {
      if (prev && boardsInRound.some((b) => b.id === prev)) return prev;
      return resolveDefaultBoardId(boardsInRound, rounds, null);
    });
  }, [boardsInRound, rounds]);

  const rankingQuery = useQuery({
    queryKey: queryKeys.rankings.board(activeBoardId),
    queryFn: () => fetchBoardRanking(activeBoardId!),
    enabled: Boolean(activeBoardId)
  });

  const { progress } = useScoreProgress(activeBoardId);

  const requiredJudgesByTeam = Object.fromEntries(
    (progress?.teams ?? []).map((t) => [t.teamId, t.requiredJudgeCount])
  );

  const scoringComplete =
    (progress?.summary.completionPercent ?? 0) >= 100 ||
    ((progress?.summary.expectedSheets ?? 0) === 0 && (progress?.summary.judgeCount ?? 0) > 0);

  const invalidateRankingQueries = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.rankings.all });
  }, [queryClient]);

  const handleCalculateBoard = useCallback(
    async (force = false, options?: { silent?: boolean }) => {
      if (!activeBoardId) return null;
      setCalculating(true);
      try {
        const result = await calculateBoardRanking(activeBoardId, force);
        await invalidateRankingQueries();
        const teamCount = result.entries?.length ?? 0;
        if (!options?.silent) {
          if (teamCount === 0) {
            notify(
              "Chưa có đội nào đủ điều kiện — cần ít nhất một phiếu chấm đã nộp trên bảng này.",
              "warning"
            );
          } else {
            notify(`Đã tính xếp hạng cho ${teamCount} đội.`, "success");
          }
        } else if (teamCount > 0) {
          notify(`Đã tự động tính xếp hạng cho ${teamCount} đội.`, "success");
        }
        return result;
      } catch (err) {
        if (!options?.silent) {
          notify(resolveApiError(err, "Tính xếp hạng thất bại."), "danger");
        }
        return null;
      } finally {
        setCalculating(false);
      }
    },
    [activeBoardId, invalidateRankingQueries, notify]
  );

  const hasRankingData = (rankingQuery.data?.entries.length ?? 0) > 0;

  useEffect(() => {
    if (
      !activeBoardId ||
      rankingQuery.isLoading ||
      calculating ||
      hasRankingData ||
      !scoringComplete
    ) {
      return;
    }
    if (autoCalculatedBoards.current.has(activeBoardId)) return;
    autoCalculatedBoards.current.add(activeBoardId);
    void handleCalculateBoard(false, { silent: true });
  }, [
    activeBoardId,
    calculating,
    handleCalculateBoard,
    hasRankingData,
    rankingQuery.isLoading,
    scoringComplete
  ]);

  async function handleUnpublishBoard() {
    if (!activeBoardId) return;
    setCalculating(true);
    try {
      await unpublishBoardRanking(activeBoardId);
      await invalidateRankingQueries();
      notify("Đã thu hồi công bố xếp hạng. Có thể tính lại rồi công bố lại.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Thu hồi công bố thất bại."), "danger");
    } finally {
      setCalculating(false);
    }
  }

  async function handleCalculateRound(force = false) {
    const targetRound = activeRoundId;
    if (!targetRound) return;
    setCalculating(true);
    try {
      const result = await calculateRoundRanking(targetRound, force);
      await invalidateRankingQueries();
      if (result.message === "NO_BOARDS_CALCULATED" || result.boardsCalculated === 0) {
        notify(
          force
            ? "Không bảng nào được tính — kiểm tra phiếu chấm đã nộp đủ chưa."
            : "Không bảng nào được tính — bảng đã công bố bị bỏ qua (dùng «Tính lại cả vòng») hoặc chưa đủ phiếu chấm.",
          "warning"
        );
      } else {
        notify(`Đã tính ${result.boardsCalculated} bảng, ${result.teamsRanked} đội.`, "success");
      }
    } catch (err) {
      notify(resolveApiError(err, "Tính xếp hạng thất bại."), "danger");
    } finally {
      setCalculating(false);
    }
  }

  if (eventLoading || boardsLoading) {
    return <ModuleSkeleton rows={6} variant="table" />;
  }

  if (boards.length === 0) {
    return (
      <div className="space-y-lg">
        {!embedded ? (
          <PageHeader
            eyebrow="Kết quả"
            title="Bảng xếp hạng"
            description="Cần có bảng thi và phiếu chấm đã nộp trước khi tính xếp hạng."
          />
        ) : null}
        <EmptyState
          icon="leaderboard"
          title="Chưa có bảng thi"
          description="Tạo bảng, gán đội và hoàn tất chấm điểm trước khi tính xếp hạng."
          action={
            <ButtonLink to="/organizer/boards" icon={null}>
              Thiết lập bảng thi
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const ranking: BoardRanking | undefined = rankingQuery.data;
  const hasRanking = (ranking?.entries.length ?? 0) > 0;
  const incompleteEntries =
    ranking?.entries.filter((row) => {
      const required = requiredJudgesByTeam[row.teamId];
      return required != null && row.submittedJudgeCount < required;
    }) ?? [];

  return (
    <div className={embedded ? "space-y-md" : "space-y-lg"}>
      {!embedded ? (
        <>
          <PageHeader
            eyebrow="Kết quả"
            title="Bảng xếp hạng"
            description="Tính điểm trung bình từ phiếu chấm đã nộp. Đội không có repository được tính 0 điểm và xếp cuối."
            actions={
              <Badge tone={ranking?.published ? "success" : hasRanking ? "warning" : "neutral"}>
                {ranking?.published ? "Đã công bố" : hasRanking ? "Bản nháp" : "Chưa tính"}
              </Badge>
            }
          />
          <WorkflowSteps
            title="Quy trình kết quả"
            description="Hoàn tất chấm điểm trước khi tính và công bố."
            steps={buildRankingWorkflowSteps("ranking")}
          />
        </>
      ) : null}

      <section
        className={`grid gap-md rounded-xl border border-outline-variant bg-surface-container p-md ${
          embedded
            ? "sm:grid-cols-2 xl:grid-cols-[minmax(10rem,1fr)_minmax(10rem,1fr)_auto_auto_auto]"
            : "lg:grid-cols-[auto_minmax(10rem,1fr)_minmax(10rem,1fr)_auto_auto_auto]"
        } items-end`}
      >
        {!embedded ? (
          <div className="sm:col-span-2 lg:col-span-1">
            <OrganizerContextBar />
          </div>
        ) : null}
        <label className="flex min-w-0 flex-col gap-1 font-label-sm text-on-surface-variant">
          Vòng
          <select
            className="w-full min-w-0 rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
            value={activeRoundId ?? ""}
            onChange={(e) => setRoundId(e.target.value ? Number(e.target.value) : null)}
            disabled={!rounds.length}
          >
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 font-label-sm text-on-surface-variant">
          Bảng
          <select
            className="w-full min-w-0 rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
            value={activeBoardId ?? ""}
            onChange={(e) => setBoardId(e.target.value ? Number(e.target.value) : null)}
            disabled={!boardsInRound.length}
          >
            {boardsInRound.length === 0 ? <option value="">Chưa có bảng trong vòng này</option> : null}
            {boardsInRound.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          loading={calculating}
          disabled={!activeBoardId || !scoringComplete || ranking?.published}
          title={
            ranking?.published
              ? "Bảng đã công bố — dùng «Thu hồi công bố» hoặc «Tính lại bảng»."
              : !scoringComplete
                ? "Còn phiếu chưa nộp — xem Tiến độ chấm."
                : undefined
          }
          onClick={() => void handleCalculateBoard()}
        >
          Tính bảng này
        </Button>
        <Button
          type="button"
          variant="secondary"
          loading={calculating}
          disabled={!rounds.length || !scoringComplete}
          title={!scoringComplete ? "Còn phiếu chưa nộp — xem Tiến độ chấm." : undefined}
          onClick={() => void handleCalculateRound()}
        >
          Tính cả vòng
        </Button>
        {rounds.length > 0 ? (
          <ConfirmAction
            title="Tính lại cả vòng?"
            message="Tính lại sẽ ghi đè xếp hạng nháp. Bảng đã công bố cũng được tính lại và bỏ trạng thái công bố."
            confirmLabel="Tính lại cả vòng"
            onConfirm={() => void handleCalculateRound(true)}
          >
            <Button type="button" variant="ghost">
              Tính lại cả vòng
            </Button>
          </ConfirmAction>
        ) : null}
        {ranking?.published ? (
          <>
            <ConfirmAction
              title="Thu hồi công bố xếp hạng?"
              message="Kết quả công khai sẽ ẩn BXH bảng này. Có thể tính lại rồi công bố lại."
              confirmLabel="Thu hồi công bố"
              onConfirm={() => void handleUnpublishBoard()}
            >
              <Button type="button" variant="secondary" loading={calculating}>
                Thu hồi công bố
              </Button>
            </ConfirmAction>
            <ConfirmAction
              title="Tính lại xếp hạng?"
              message="Bảng đã công bố — tính lại sẽ ghi đè bản nháp và bỏ trạng thái công bố."
              confirmLabel="Tính lại"
              onConfirm={() => void handleCalculateBoard(true)}
            >
              <Button type="button" variant="ghost">
                Tính lại bảng
              </Button>
            </ConfirmAction>
          </>
        ) : null}
      </section>

      {rankingQuery.isLoading ? <ModuleSkeleton rows={5} /> : null}
      {rankingQuery.error ? (
        <RetryPanel
          message={resolveApiError(rankingQuery.error, "Không tải được bảng xếp hạng.")}
          onRetry={() => void rankingQuery.refetch()}
        />
      ) : null}

      {incompleteEntries.length > 0 ? (
        <div className="rounded-xl border border-warning/40 bg-warning-container/30 p-md">
          <p className="font-body-sm text-on-surface">
            {incompleteEntries.length} đội chưa đủ phiếu chấm từ mọi giám khảo - cần hoàn tất trước khi tính lại xếp hạng.{" "}
            <Link
              to={embedded ? "/organizer/results-hub#results-step-scoring" : "/organizer/scoring"}
              className="text-primary hover:underline"
            >
              Xem tiến độ chấm
            </Link>
          </p>
        </div>
      ) : null}

      {!rankingQuery.isLoading && !hasRanking ? (
        <EmptyState
          icon="leaderboard"
          title="Chưa có xếp hạng"
          description={
            scoringComplete
              ? "Phiếu chấm đã đủ — bấm «Tính bảng này» để tạo bảng xếp hạng. Hệ thống cũng tự tính khi bạn mở bước này."
              : "Cần giám khảo nộp phiếu chấm trước. Sau đó bấm «Tính bảng này» để tạo BXH."
          }
          action={
            <div className="flex flex-wrap items-center justify-center gap-sm">
              <Button
                type="button"
                loading={calculating}
                disabled={!activeBoardId || !scoringComplete}
                onClick={() => void handleCalculateBoard()}
              >
                Tính xếp hạng ngay
              </Button>
              <Link
                to={embedded ? "/organizer/results-hub#results-step-scoring" : "/organizer/scoring"}
                className="font-label-md text-primary hover:underline"
              >
                Kiểm tra tiến độ chấm →
              </Link>
            </div>
          }
        />
      ) : null}

      {hasRanking && ranking ? (
        <>
          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
            <div className="border-b border-outline-variant px-sm py-2 font-label-sm text-on-surface-variant">
              {formatBoardRankingLabel(ranking)}
              {ranking.calculatedAt ? (
                <span className="ml-2">
                  Tính lúc {new Date(ranking.calculatedAt).toLocaleString("vi-VN")}
                </span>
              ) : null}
              {(ranking.hiddenTeamCount ?? 0) > 0 ? (
                <p className="mt-xs text-warning">
                  Đã ẩn {ranking.hiddenTeamCount} đội không còn đủ điều kiện. Nên thu hồi công bố (nếu
                  đang công bố) rồi tính lại bảng để hạng liên tục; gợi ý giải sẽ dồn hạng trong đội còn
                  hợp lệ.
                </p>
              ) : null}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="table-header-bg">
                  <tr className="font-label-sm text-on-surface-variant">
                    <th className="px-sm py-2">Hạng</th>
                    <th className="px-sm py-2">Đội</th>
                    <th className="px-sm py-2">Vị trí</th>
                    <th className="px-sm py-2">Điểm TB</th>
                    <th className="px-sm py-2">Trạng thái</th>
                    <th className="px-sm py-2">Giám khảo đã nộp</th>
                  </tr>
                </thead>
                <tbody className="table-divider">
                  {ranking.entries.map((row) => {
                    const required = requiredJudgesByTeam[row.teamId];
                    const incomplete =
                      required != null && row.submittedJudgeCount < required;
                    return (
                      <tr
                        key={row.teamId}
                        className={`font-body-sm text-on-surface ${incomplete ? "bg-warning-container/20" : ""}`}
                      >
                        <td className="px-sm py-2 font-headline-sm">{row.rank}</td>
                        <td className="px-sm py-2 font-label-md">{row.teamName}</td>
                        <td className="px-sm py-2">{row.slotNumber ?? "—"}</td>
                        <td className="px-sm py-2">{Number(row.averageScore).toFixed(2)}</td>
                        <td className="px-sm py-2">
                          {row.rankingStatus === "REPO_NOT_READY" ? (
                            <Badge tone="warning">Thiếu repository</Badge>
                          ) : row.rankingStatus === "NOT_SCORED" ? (
                            <Badge tone="warning">Chưa có phiếu</Badge>
                          ) : (
                            <Badge tone="success">Đã chấm</Badge>
                          )}
                          {row.ineligibleReason ? (
                            <p className="mt-xs max-w-xs font-body-xs text-on-surface-variant">
                              {row.ineligibleReason}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-sm py-2">
                          {row.submittedJudgeCount}
                          {required != null ? ` / ${required}` : ""}
                          {incomplete ? (
                            <Badge tone="warning" className="ml-sm">
                              Thiếu giám khảo
                            </Badge>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

        </>
      ) : null}
    </div>
  );
}
