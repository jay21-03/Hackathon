import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EventSelector } from "../../components/ui/EventSelector";
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

export function ScoringProgressPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const eventIdParam = searchParams.get("eventId");
  const boardIdParam = searchParams.get("boardId");
  const deepLinkEventApplied = useRef(false);
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { rounds, boards, loading: boardsLoading, error: boardsError } = useEventBoards(eventId);
  const [boardId, setBoardId] = useState<number | null>(() => {
    if (!boardIdParam) return null;
    const parsed = Number(boardIdParam);
    return Number.isFinite(parsed) ? parsed : null;
  });
  const [reminding, setReminding] = useState(false);
  const { progress, loading: progressLoading, error: progressError } = useScoreProgress(boardId);

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
    const urlBoardId = boardIdParam ? Number(boardIdParam) : null;
    if (urlBoardId && boards.some((board) => board.id === urlBoardId)) {
      setBoardId(urlBoardId);
      return;
    }
    setBoardId((prev) => (prev && boards.some((b) => b.id === prev) ? prev : boards[0]?.id ?? null));
  }, [boards, boardIdParam]);

  useEffect(() => {
    if (!eventId || !boardId) return;
    const next = new URLSearchParams();
    next.set("eventId", String(eventId));
    next.set("boardId", String(boardId));
    setSearchParams(next, { replace: true });
  }, [eventId, boardId, setSearchParams]);

  async function handleRemindScoring() {
    if (!boardId) return;
    setReminding(true);
    try {
      await sendScoringReminder(boardId);
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

  const roundNameById = Object.fromEntries(rounds.map((r) => [r.id, r.name]));
  const judgeNameById = Object.fromEntries(
    (progress?.judges ?? []).map((j) => [j.judgeId, j.fullName])
  );
  const error = boardsError ?? progressError;
  const loading = boardsLoading || progressLoading;

  if (eventLoading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
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
                disabled={reminding || !boardId}
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

      <section className="flex flex-wrap items-end gap-md rounded-xl border border-outline-variant bg-surface-container p-md">
        <EventSelector events={events} eventId={eventId} onChange={setEventId} />
        <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
          Bảng thi
          <select
            className="min-w-[14rem] rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
            value={boardId ?? ""}
            onChange={(e) => setBoardId(e.target.value ? Number(e.target.value) : null)}
            disabled={!boards.length}
          >
            {boards.length === 0 ? <option value="">Chưa có bảng</option> : null}
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name} ({roundNameById[board.roundId] ?? `Vòng ${board.roundId}`})
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
      ) : !boardId ? (
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
                <table className="min-w-full border-collapse text-center">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-surface-container px-sm py-2 text-left font-label-sm text-on-surface-variant">
                        Đội
                      </th>
                      {progress.judges.map((judge) => (
                        <th
                          key={judge.judgeId}
                          className="min-w-[4rem] px-1 py-2 font-label-sm text-on-surface-variant"
                          title={`${judge.fullName}: ${judge.submittedCount}/${judge.totalTeams}`}
                        >
                          <span className="block max-w-[5rem] truncate">{judge.fullName}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {progress.teams.map((team) => (
                      <tr key={team.teamId}>
                        <td className="sticky left-0 z-10 bg-surface-container px-sm py-1 text-left font-label-sm text-on-surface">
                          <span className="block max-w-[8rem] truncate" title={team.teamName}>
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
                            <td key={judge.judgeId} className="px-1 py-1">
                              <span
                                className={`inline-flex h-8 w-10 items-center justify-center rounded-md font-label-sm ${cellTone(cell.status)}`}
                                title={cellTitle(cell, judgeNameById[judge.judgeId] ?? `Giám khảo #${judge.judgeId}`, team.teamName)}
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
              <table className="min-w-full text-left">
                <thead className="table-header-bg">
                  <tr className="font-label-sm text-on-surface-variant">
                    <th className="px-md py-sm">Giám khảo</th>
                    <th className="px-md py-sm">Đã nộp</th>
                    <th className="px-md py-sm">Tổng đội</th>
                  </tr>
                </thead>
                <tbody className="table-divider">
                  {progress.judges.map((judge) => (
                    <tr key={judge.judgeId} className="font-body-sm text-on-surface">
                      <td className="px-md py-md">{judge.fullName}</td>
                      <td className="px-md py-md">{judge.submittedCount}</td>
                      <td className="px-md py-md">{judge.totalTeams}</td>
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
              <table className="min-w-full text-left">
                <thead className="table-header-bg">
                  <tr className="font-label-sm text-on-surface-variant">
                    <th className="px-md py-sm">Đội</th>
                    <th className="px-md py-sm">Đã nộp / Cần</th>
                    <th className="px-md py-sm">Chi tiết giám khảo</th>
                  </tr>
                </thead>
                <tbody className="table-divider">
                  {progress.teams.map((team) => (
                    <tr key={team.teamId} className="font-body-sm text-on-surface">
                      <td className="px-md py-md font-label-md">{team.teamName}</td>
                      <td className="px-md py-md">
                        {team.submittedJudgeCount}/{team.requiredJudgeCount}
                      </td>
                      <td className="px-md py-md">
                        <div className="flex flex-wrap gap-1">
                          {team.judges.map((j) => (
                            <Badge
                              key={j.judgeId}
                              tone={
                                j.status === "SUBMITTED"
                                  ? "success"
                                  : j.status === "DRAFT"
                                    ? "warning"
                                    : "neutral"
                              }
                            >
                              {judgeNameById[j.judgeId] ?? `GK ${j.judgeId}`}:{" "}
                              {j.status === "SUBMITTED"
                                ? j.judgeTeamScore != null
                                  ? `${Number(j.judgeTeamScore).toFixed(1)}đ`
                                  : "Đã nộp"
                                : j.status === "DRAFT"
                                  ? "Nháp"
                                  : "Thiếu"}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {progress.teams.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-md py-md text-on-surface-variant">
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
