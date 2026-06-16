import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { Icon } from "../../components/ui/Icon";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { buildRankingWorkflowSteps } from "../../utils/rankingWorkflow";
import { useEventBoards } from "../../hooks/useEventBoards";
import { useScoreProgress } from "../../hooks/useScoreProgress";
import { queryKeys } from "../../lib/queryKeys";
import { sendScoringReminder, type JudgeSheetStatusDto } from "../../services/scoringApi";
import { resolveApiError } from "../../utils/apiError";
import { resolveDefaultBoardId, resolveDefaultRoundId } from "../../utils/pickActiveRound";

function cellTone(status: string): string {
  if (status === "SUBMITTED") return "bg-success-container text-on-success-container";
  if (status === "DRAFT") return "bg-warning-container text-on-warning-container";
  return "bg-surface-container-high text-on-surface-variant";
}

function cellLabel(cell: JudgeSheetStatusDto): string {
  if (cell.status === "SUBMITTED" && cell.judgeTeamScore != null) {
    return Number(cell.judgeTeamScore).toFixed(1);
  }
  if (cell.status === "SUBMITTED") return "✓";
  if (cell.status === "DRAFT") return "…";
  return "—";
}

function cellTitle(cell: JudgeSheetStatusDto, judgeName: string, teamName: string): string {
  const base = `${teamName} · ${judgeName}: ${cell.status}`;
  if (cell.status === "SUBMITTED" && cell.judgeTeamScore != null) {
    return `${base} — ${Number(cell.judgeTeamScore).toFixed(2)} điểm`;
  }
  return base;
}

export function ScoringProgressPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const eventIdParam = searchParams.get("eventId");
  const boardIdParam = searchParams.get("boardId");
  const deepLinkEventApplied = useRef(false);
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { rounds, boards, loading: boardsLoading, error: boardsError } = useEventBoards(eventId);
  const [roundId, setRoundId] = useState<number | null>(null);
  const [boardId, setBoardId] = useState<number | null>(() => {
    if (!boardIdParam) return null;
    const parsed = Number(boardIdParam);
    return Number.isFinite(parsed) ? parsed : null;
  });
  const [reminding, setReminding] = useState(false);

  const activeRoundId = resolveDefaultRoundId(rounds, roundId);
  const boardsInRound = useMemo(
    () => (activeRoundId != null ? boards.filter((b) => b.roundId === activeRoundId) : []),
    [boards, activeRoundId]
  );
  const activeBoardId = resolveDefaultBoardId(boardsInRound, rounds, boardId);

  const { progress, loading: progressLoading, error: progressError } = useScoreProgress(activeBoardId);

  useEffect(() => {
    if (!eventIdParam || deepLinkEventApplied.current || !events.length) return;
    const parsed = Number(eventIdParam);
    if (!Number.isFinite(parsed)) return;
    if (events.some((event) => event.id === parsed)) {
      setEventId(parsed);
      deepLinkEventApplied.current = true;
    }
  }, [eventIdParam, events, setEventId]);

  useEffect(() => {
    setRoundId((prev) => resolveDefaultRoundId(rounds, prev));
  }, [rounds]);

  useEffect(() => {
    const urlBoardId = boardIdParam ? Number(boardIdParam) : null;
    if (urlBoardId && boards.some((board) => board.id === urlBoardId)) {
      const matched = boards.find((board) => board.id === urlBoardId);
      if (matched) setRoundId(matched.roundId);
      setBoardId(urlBoardId);
      return;
    }
    setBoardId((prev) => {
      if (prev && boardsInRound.some((b) => b.id === prev)) return prev;
      return resolveDefaultBoardId(boardsInRound, rounds, null);
    });
  }, [boards, boardIdParam, boardsInRound, rounds]);

  useEffect(() => {
    if (!eventId || !activeBoardId) return;
    const next = new URLSearchParams();
    next.set("eventId", String(eventId));
    next.set("boardId", String(activeBoardId));
    setSearchParams(next, { replace: true });
  }, [eventId, activeBoardId, setSearchParams]);

  async function handleRemindScoring() {
    if (!activeBoardId) return;
    setReminding(true);
    try {
      await sendScoringReminder(activeBoardId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      notify("Đã gửi thông báo nhắc chấm cho giám khảo.", "success");
    } catch (err) {
      notify(
        resolveApiError(err, "Gửi nhắc chấm thất bại."),
        "danger"
      );
    } finally {
      setReminding(false);
    }
  }


  const judgeNameById = Object.fromEntries(
    (progress?.judges ?? []).map((j) => [j.judgeId, j.fullName])
  );
  const error = boardsError ?? progressError;
  const loading = boardsLoading || progressLoading;

  if (eventLoading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <>
          <PageHeader
            eyebrow="Chấm điểm"
            title="Tiến độ chấm"
            description="Theo dõi giám khảo đã nộp phiếu chấm cho từng đội trên bảng."
            actions={
              <div className="flex flex-wrap items-center gap-sm">
                {progress && progress.summary.completionPercent < 100 ? (
                  <Button
                    variant="secondary"
                    icon={<Icon name="notifications_active" />}
                    disabled={reminding || !activeBoardId}
                    onClick={() => void handleRemindScoring()}
                  >
                    {reminding ? "Đang gửi…" : "Nhắc chấm"}
                  </Button>
                ) : null}
                {progress ? (
                  <Badge tone={progress.summary.completionPercent >= 100 ? "success" : "warning"}>
                    {Number(progress.summary.completionPercent).toFixed(0)}% hoàn thành
                  </Badge>
                ) : null}
              </div>
            }
          />
          <WorkflowSteps
            title="Quy trình chấm & kết quả"
            description="Theo dõi tiến độ chấm trước khi tính xếp hạng."
            steps={buildRankingWorkflowSteps("scoring")}
          />
        </>
      ) : null}

      <section
        className={`grid gap-md rounded-xl border border-outline-variant bg-surface-container p-md ${
          embedded ? "sm:grid-cols-2" : "sm:grid-cols-[auto_minmax(12rem,1fr)_minmax(12rem,1fr)]"
        } items-end`}
      >
        {!embedded ? <OrganizerContextBar /> : null}
        <label className="flex min-w-0 flex-col gap-1 font-label-sm text-on-surface-variant">
          Vòng
          <select
            className="w-full min-w-0 rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
            value={activeRoundId ?? ""}
            onChange={(e) => setRoundId(e.target.value ? Number(e.target.value) : null)}
            disabled={!rounds.length}
          >
            {rounds.length === 0 ? <option value="">Chưa có vòng</option> : null}
            {rounds.map((round) => (
              <option key={round.id} value={round.id}>
                {round.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 font-label-sm text-on-surface-variant">
          Bảng thi
          <select
            className="w-full min-w-0 rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
            value={activeBoardId ?? ""}
            onChange={(e) => setBoardId(e.target.value ? Number(e.target.value) : null)}
            disabled={!boardsInRound.length}
          >
            {boardsInRound.length === 0 ? <option value="">Chưa có bảng trong vòng này</option> : null}
            {boardsInRound.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface-variant">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <ModuleSkeleton rows={5} />
      ) : !activeBoardId ? (
        <p className="font-body-sm text-on-surface-variant">Tạo bảng thi trước khi theo dõi tiến độ.</p>
      ) : progress ? (
        <>
          <section className="grid gap-md md:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Đội" value={progress.summary.teamCount} icon="groups" />
            <StatCard label="Giám khảo" value={progress.summary.judgeCount} icon="gavel" />
            <StatCard
              label="Đã nộp"
              value={`${progress.summary.submittedSheets}/${progress.summary.expectedSheets}`}
              icon="task_alt"
              tone="success"
            />
            <StatCard label="Nháp" value={progress.summary.draftSheets} icon="edit_note" tone="warning" />
            <StatCard label="Còn thiếu" value={progress.summary.missingSheets} icon="pending" tone="warning" />
          </section>

          {progress.judges.length > 0 && progress.teams.length > 0 ? (
            <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
              <h3 className="border-b border-outline-variant px-md py-sm font-title-sm text-on-surface">
                Ma trận tiến độ (đội × giám khảo)
              </h3>
              <div className="overflow-x-auto p-md">
                <table className="w-full min-w-[32rem] table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[11rem]" />
                    {progress.judges.map((judge) => (
                      <col key={judge.judgeId} className="w-[5.5rem]" />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-surface-container px-sm py-2 text-left font-label-sm text-on-surface-variant">
                        Đội
                      </th>
                      {progress.judges.map((judge) => (
                        <th
                          key={judge.judgeId}
                          className="px-1 py-2 text-center font-label-sm text-on-surface-variant"
                          title={`${judge.fullName}: ${judge.submittedCount}/${judge.totalTeams}`}
                        >
                          <span className="mx-auto block truncate" title={judge.fullName}>
                            {judge.fullName}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {progress.teams.map((team) => (
                      <tr key={team.teamId}>
                        <td className="sticky left-0 z-10 bg-surface-container px-sm py-1.5 text-left font-label-sm text-on-surface">
                          <span className="block truncate" title={team.teamName}>
                            {team.teamName}
                          </span>
                        </td>
                        {progress.judges.map((judge) => {
                          const cell =
                            team.judges.find((j) => j.judgeId === judge.judgeId) ?? {
                              judgeId: judge.judgeId,
                              status: "MISSING" as const,
                              sheetId: null,
                              judgeTeamScore: null
                            };
                          return (
                            <td key={judge.judgeId} className="px-1 py-1.5 text-center">
                              <span
                                className={`mx-auto inline-flex h-8 w-[3.25rem] items-center justify-center rounded-md font-label-sm ${cellTone(cell.status)}`}
                                title={cellTitle(
                                  cell,
                                  judge.fullName ?? judgeNameById[judge.judgeId] ?? `Giám khảo #${judge.judgeId}`,
                                  team.teamName
                                )}
                              >
                                {cellLabel(cell)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-sm font-body-sm text-on-surface-variant">
                  ✓/số = đã nộp · … = nháp · — = chưa chấm
                </p>
              </div>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
            <h3 className="border-b border-outline-variant px-md py-sm font-title-sm text-on-surface">
              Tiến độ theo giám khảo
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-left">
                <colgroup>
                  <col />
                  <col className="w-[6.5rem]" />
                  <col className="w-[6.5rem]" />
                </colgroup>
                <thead className="table-header-bg">
                  <tr className="font-label-sm text-on-surface-variant">
                    <th className="px-md py-sm">Giám khảo</th>
                    <th className="px-md py-sm text-right">Đã nộp</th>
                    <th className="px-md py-sm text-right">Tổng đội</th>
                  </tr>
                </thead>
                <tbody className="table-divider">
                  {progress.judges.map((judge) => (
                    <tr key={judge.judgeId} className="font-body-sm text-on-surface">
                      <td className="px-md py-md">
                        <span className="block truncate" title={judge.fullName}>
                          {judge.fullName}
                        </span>
                      </td>
                      <td className="px-md py-md text-right tabular-nums">{judge.submittedCount}</td>
                      <td className="px-md py-md text-right tabular-nums">{judge.totalTeams}</td>
                    </tr>
                  ))}
                  {progress.judges.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-md py-md text-on-surface-variant">
                        Chưa phân công giám khảo cho bảng này.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
            <h3 className="border-b border-outline-variant px-md py-sm font-title-sm text-on-surface">
              Tiến độ theo đội
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] table-fixed text-left">
                <colgroup>
                  <col className="w-[11rem]" />
                  <col className="w-[6.5rem]" />
                  {progress.judges.map((judge) => (
                    <col key={judge.judgeId} className="w-[10rem]" />
                  ))}
                </colgroup>
                <thead className="table-header-bg">
                  <tr className="font-label-sm text-on-surface-variant">
                    <th className="px-md py-sm">Đội</th>
                    <th className="px-md py-sm text-center">Đã nộp / Cần</th>
                    {progress.judges.map((judge) => (
                      <th
                        key={judge.judgeId}
                        className="px-md py-sm text-center"
                        title={judge.fullName}
                      >
                        <span className="block truncate">{judge.fullName}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="table-divider">
                  {progress.teams.map((team) => (
                    <tr key={team.teamId} className="font-body-sm text-on-surface">
                      <td className="px-md py-md font-label-md">
                        <span className="block truncate" title={team.teamName}>
                          {team.teamName}
                        </span>
                      </td>
                      <td className="px-md py-md text-center tabular-nums">
                        {team.submittedJudgeCount}/{team.requiredJudgeCount}
                      </td>
                      {progress.judges.map((judge) => {
                        const j =
                          team.judges.find((item) => item.judgeId === judge.judgeId) ?? {
                            judgeId: judge.judgeId,
                            status: "MISSING" as const,
                            sheetId: null,
                            judgeTeamScore: null
                          };
                        const scoreLabel =
                          j.status === "SUBMITTED"
                            ? j.judgeTeamScore != null
                              ? `${Number(j.judgeTeamScore).toFixed(1)} đ`
                              : "Đã nộp"
                            : j.status === "DRAFT"
                              ? "Nháp"
                              : "—";
                        return (
                          <td key={judge.judgeId} className="px-md py-md text-center">
                            <Badge
                              tone={
                                j.status === "SUBMITTED"
                                  ? "success"
                                  : j.status === "DRAFT"
                                    ? "warning"
                                    : "neutral"
                              }
                              className="mx-auto max-w-full truncate"
                            >
                              {scoreLabel}
                            </Badge>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {progress.teams.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2 + progress.judges.length}
                        className="px-md py-md text-on-surface-variant"
                      >
                        Chưa có đội trên bảng.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
