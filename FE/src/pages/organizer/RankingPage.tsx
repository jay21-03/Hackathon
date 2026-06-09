import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { NextStepPanel } from "../../components/ui/NextStepPanel";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventBoards } from "../../hooks/useEventBoards";
import { useEventRounds } from "../../hooks/useEventRounds";
import { useScoreProgress } from "../../hooks/useScoreProgress";
import { queryKeys } from "../../lib/queryKeys";
import {
  calculateBoardRanking,
  calculateRoundRanking,
  fetchBoardRanking,
  type BoardRanking
} from "../../services/rankingApi";
import { resolveApiError } from "../../utils/apiError";
import { buildRankingWorkflowSteps } from "../../utils/rankingWorkflow";

export function RankingPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { rounds, loading: roundsLoading } = useEventRounds(eventId);
  const { boards, loading: boardsLoading } = useEventBoards(eventId);
  const [boardId, setBoardId] = useState<number | null>(null);
  const [roundId, setRoundId] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);

  const activeBoardId =
    boardId != null && boards.some((b) => b.id === boardId) ? boardId : boards[0]?.id ?? null;

  const rankingQuery = useQuery({
    queryKey: queryKeys.rankings.board(activeBoardId),
    queryFn: () => fetchBoardRanking(activeBoardId!),
    enabled: Boolean(activeBoardId)
  });

  const { progress } = useScoreProgress(activeBoardId);

  const requiredJudgesByTeam = Object.fromEntries(
    (progress?.teams ?? []).map((t) => [t.teamId, t.requiredJudgeCount])
  );

  async function invalidateRankingQueries() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.rankings.all });
  }

  async function handleCalculateBoard(force = false) {
    if (!activeBoardId) return;
    setCalculating(true);
    try {
      await calculateBoardRanking(activeBoardId, force);
      await invalidateRankingQueries();
      notify("Đã tính xếp hạng cho bảng.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Tính xếp hạng thất bại."), "danger");
    } finally {
      setCalculating(false);
    }
  }

  async function handleCalculateRound(force = false) {
    const targetRound =
      roundId != null && rounds.some((r) => r.id === roundId) ? roundId : rounds[0]?.id ?? null;
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

  if (eventLoading || roundsLoading || boardsLoading) {
    return <ModuleSkeleton rows={6} variant="table" />;
  }

  if (boards.length === 0) {
    return (
      <div className="space-y-lg">
        <PageHeader
          eyebrow="Kết quả"
          title="Bảng xếp hạng"
          description="Cần có bảng thi và phiếu chấm đã nộp trước khi tính xếp hạng."
        />
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
    <div className="space-y-lg">
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

      <section className="flex flex-wrap items-end gap-md rounded-xl border border-outline-variant bg-surface-container p-md">
        <EventSelector events={events} eventId={eventId} onChange={setEventId} />
        <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
          Bảng
          <select
            className="min-w-[10rem] rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
            value={activeBoardId ?? ""}
            onChange={(e) => setBoardId(e.target.value ? Number(e.target.value) : null)}
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
          Vòng (tính hàng loạt)
          <select
            className="min-w-[10rem] rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
            value={roundId ?? rounds[0]?.id ?? ""}
            onChange={(e) => setRoundId(e.target.value ? Number(e.target.value) : null)}
          >
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
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
            <Link to="/organizer/scoring" className="text-primary hover:underline">
              Xem tiến độ chấm
            </Link>
          </p>
        </div>
      ) : null}

      {!rankingQuery.isLoading && !hasRanking ? (
        <EmptyState
          icon="leaderboard"
          title="Chưa có xếp hạng"
          description="Cần phiếu chấm đã nộp và đội trên bảng. Bấm «Tính bảng này» sau khi giám khảo nộp điểm."
          action={
            <Link to="/organizer/scoring" className="font-label-md text-primary hover:underline">
              Kiểm tra tiến độ chấm →
            </Link>
          }
        />
      ) : null}

      {hasRanking && ranking ? (
        <>
          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
            <div className="border-b border-outline-variant px-md py-sm font-label-sm text-on-surface-variant">
              {ranking.boardName}
              {ranking.roundName ? ` · ${ranking.roundName}` : ""}
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

          <NextStepPanel
            action={{
              title: hasRanking ? "Tiếp theo: công bố kết quả" : "Chưa sẵn sàng công bố",
              description: ranking.published
                ? "Bảng đã công bố — thí sinh có thể xem tại trang kết quả."
                : "Xem lại bảng xếp hạng rồi công bố cho thí sinh và khách.",
              to: "/organizer/publish-results",
              cta: "Đến công bố kết quả"
            }}
            variant={ranking.published ? "success" : "primary"}
          />
        </>
      ) : null}
    </div>
  );
}
