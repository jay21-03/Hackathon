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
  type BoardRanking
} from "../../services/rankingApi";
import { resolveApiError } from "../../utils/apiError";
import {
  formatBoardRankingLabel
} from "../../utils/boardLabels";
import { buildRankingWorkflowSteps } from "../../utils/rankingWorkflow";
import { resolveDefaultBoardId, resolveDefaultRoundId } from "../../utils/pickActiveRound";

export function RankingPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { rounds, boards, loading: boardsLoading } = useEventBoards(eventId);
  const [boardId, setBoardId] = useState<number | null>(null);
  const [roundId, setRoundId] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const autoCalculatedBoards = useRef(new Set<number>());

  const activeRoundId = resolveDefaultRoundId(rounds, roundId);
  const boardsInRound = useMemo(
    () => (activeRoundId != null ? boards.filter((b) => b.roundId === activeRoundId) : []),
    [boards, activeRoundId]
  );
  const activeBoardId = resolveDefaultBoardId(boardsInRound, rounds, boardId);

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

  const scoringComplete = (progress?.summary.completionPercent ?? 0) >= 100;

  async function invalidateRankingQueries() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.rankings.all });
  }

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
    [activeBoardId, notify, queryClient]
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

  async function handleCalculateRound(force = false) {
    const targetRound = activeRoundId;
    if (!targetRound) return;
    setCalculating(true);
    try {
      const result = await calculateRoundRanking(targetRound, force);
      await invalidateRankingQueries();
      if (result.message === "NO_BOARDS_CALCULATED" || result.boardsCalculated === 0) {
        notify(
          "Không bảng nào được tính — có thể đã công bố (dùng «Tính lại cả vòng») hoặc thiếu phiếu chấm đã nộp.",
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
            description="Tính điểm trung bình từ phiếu chấm đã nộp. Đội bị loại không được xếp hạng."
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
        <Button type="button" loading={calculating} disabled={!activeBoardId} onClick={() => void handleCalculateBoard()}>
          Tính bảng này
        </Button>
        <Button
          type="button"
          variant="secondary"
          loading={calculating}
          disabled={!rounds.length}
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
            {incompleteEntries.length} đội chưa đủ phiếu chấm từ mọi giám khảo — vẫn được xếp hạng
            theo điểm đã có.{" "}
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
            <div className="border-b border-outline-variant px-md py-sm font-label-sm text-on-surface-variant">
              {formatBoardRankingLabel(ranking)}
              {ranking.calculatedAt ? (
                <span className="ml-2">
                  Tính lúc {new Date(ranking.calculatedAt).toLocaleString("vi-VN")}
                </span>
              ) : null}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="table-header-bg">
                  <tr className="font-label-sm text-on-surface-variant">
                    <th className="px-md py-sm">Hạng</th>
                    <th className="px-md py-sm">Đội</th>
                    <th className="px-md py-sm">Vị trí</th>
                    <th className="px-md py-sm">Điểm TB</th>
                    <th className="px-md py-sm">GK đã nộp</th>
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
                        <td className="px-md py-md font-headline-sm">{row.rank}</td>
                        <td className="px-md py-md font-label-md">{row.teamName}</td>
                        <td className="px-md py-md">{row.slotNumber ?? "—"}</td>
                        <td className="px-md py-md">{Number(row.averageScore).toFixed(2)}</td>
                        <td className="px-md py-md">
                          {row.submittedJudgeCount}
                          {required != null ? ` / ${required}` : ""}
                          {incomplete ? (
                            <Badge tone="warning" className="ml-sm">
                              Thiếu GK
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
