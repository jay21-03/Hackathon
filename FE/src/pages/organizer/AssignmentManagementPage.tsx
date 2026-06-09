import { useMemo, useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { NextStepPanel } from "../../components/ui/NextStepPanel";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useAssignmentManagement } from "../../hooks/useAssignmentManagement";
import { useEventSetupProgress } from "../../hooks/useEventSetupProgress";
import {
  assignJudge,
  assignMentor,
  removeJudge,
  removeMentor
} from "../../services/assignmentService";
import { type RoundResponse } from "../../services/contestApi";
import { resolveApiError } from "../../utils/apiError";
import { getStatusLabel, getStatusTone } from "../../domain/status";

function roundTypeLabel(roundType: string) {
  return roundType === "FINAL" ? "Chung kết" : "Vòng bảng";
}

function formatRoundWindow(round: RoundResponse) {
  const start = new Date(round.startAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
  const end = new Date(round.endAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
  return `${start} → ${end}`;
}

export function AssignmentManagementPage() {
  const { notify } = useToast();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { steps: setupSteps } = useEventSetupProgress(eventId, "/organizer/assignments");
  const {
    rounds,
    boards,
    users,
    byBoard,
    mentors,
    judges,
    loading,
    error,
    invalidate
  } = useAssignmentManagement(eventId);
  const [busyBoardId, setBusyBoardId] = useState<number | null>(null);
  const [mentorPick, setMentorPick] = useState<Record<number, string>>({});
  const [judgePick, setJudgePick] = useState<Record<number, string>>({});
  const [roundFilter, setRoundFilter] = useState<number | "">("");

  const userNameById = useMemo(
    () => Object.fromEntries(users.map((user) => [user.id, user.fullName])),
    [users]
  );

  const boardsByRound = useMemo(() => {
    const sorted = [...rounds].sort((a, b) => a.roundOrder - b.roundOrder);
    const filteredRounds =
      roundFilter === "" ? sorted : sorted.filter((round) => round.id === roundFilter);
    return filteredRounds.map((round) => ({
      round,
      boards: boards
        .filter((board) => board.roundId === round.id)
        .sort((a, b) => a.boardOrder - b.boardOrder)
    }));
  }, [boards, rounds, roundFilter]);

  async function handleAssignMentor(boardId: number) {
    const userId = Number(mentorPick[boardId] ?? "");
    if (!userId) {
      notify("Chọn mentor.", "warning");
      return;
    }
    setBusyBoardId(boardId);
    try {
      await assignMentor(boardId, userId);
      await invalidate();
      notify("Đã gán mentor.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Gán mentor thất bại."), "danger");
    } finally {
      setBusyBoardId(null);
    }
  }

  async function handleAssignJudge(boardId: number) {
    const userId = Number(judgePick[boardId] ?? "");
    if (!userId) {
      notify("Chọn giám khảo.", "warning");
      return;
    }
    setBusyBoardId(boardId);
    try {
      await assignJudge(boardId, userId);
      await invalidate();
      notify("Đã gán giám khảo.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Gán giám khảo thất bại."), "danger");
    } finally {
      setBusyBoardId(null);
    }
  }

  async function handleRemoveMentor(boardId: number, mentorId: number) {
    setBusyBoardId(boardId);
    try {
      await removeMentor(boardId, mentorId);
      await invalidate();
      notify("Đã gỡ mentor.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Gỡ mentor thất bại."), "danger");
    } finally {
      setBusyBoardId(null);
    }
  }

  async function handleRemoveJudge(boardId: number, judgeId: number) {
    setBusyBoardId(boardId);
    try {
      await removeJudge(boardId, judgeId);
      await invalidate();
      notify("Đã gỡ giám khảo.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Gỡ giám khảo thất bại."), "danger");
    } finally {
      setBusyBoardId(null);
    }
  }

  if (eventLoading || loading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Phân công"
        title="Mentor và giám khảo theo bảng"
        description="Xem người đã gán, gỡ hoặc thêm mentor / giám khảo cho từng bảng."
        actions={<EventSelector events={events} eventId={eventId} onChange={setEventId} />}
      />

      <WorkflowSteps
        title="Quy trình thiết lập"
        description="Cùng thứ tự với sidebar — trạng thái tính từ dữ liệu thật."
        steps={setupSteps}
        activeHref="/organizer/assignments"
      />

      {rounds.length > 1 ? (
        <label className="flex max-w-md flex-col gap-1 font-label-sm text-on-surface-variant">
          Lọc theo vòng
          <select
            className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
            value={roundFilter}
            onChange={(e) => setRoundFilter(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Tất cả vòng</option>
            {rounds.map((round) => (
              <option key={round.id} value={round.id}>
                {round.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <NextStepPanel
        action={{
          title: "Bước tiếp: Cấu hình tiêu chí chấm",
          description: "Thiết lập rubric trước khi giám khảo bắt đầu chấm điểm.",
          to: "/organizer/rubric",
          cta: "Đi tới Tiêu chí chấm"
        }}
      />

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface">{error}</p>
        </div>
      ) : null}

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Bảng thi" value={boards.length} helper={`${rounds.length} vòng`} icon="view_module" />
        <StatCard label="Mentor" value={mentors.length} helper="Tài khoản có vai trò MENTOR" icon="groups" tone="success" />
        <StatCard label="Giám khảo" value={judges.length} helper="Tài khoản có vai trò JUDGE" icon="gavel" tone="warning" />
      </section>

      {boards.length === 0 ? (
        <p className="font-body-sm text-on-surface-variant">
          Chưa có bảng thi — tạo vòng và bảng tại mục Bảng thi trước.
        </p>
      ) : (
        <section className="space-y-lg">
          {boardsByRound.map(({ round, boards: roundBoards }) => (
            <div key={round.id} className="space-y-md">
              <div className="rounded-xl border border-outline-variant bg-surface-container-low px-lg py-md">
                <div className="flex flex-wrap items-start justify-between gap-sm">
                  <div>
                    <p className="font-label-sm text-on-surface-variant">
                      Vòng {round.roundOrder} · {roundTypeLabel(round.roundType)}
                    </p>
                    <h2 className="font-headline-sm text-on-surface">{round.name}</h2>
                    <p className="mt-xs font-body-sm text-on-surface-variant">{formatRoundWindow(round)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-sm">
                    <Badge tone={getStatusTone(round.status)}>{getStatusLabel(round.status)}</Badge>
                    <span className="font-body-sm text-on-surface-variant">
                      {roundBoards.length} bảng
                    </span>
                  </div>
                </div>
              </div>

              {roundBoards.length === 0 ? (
                <p className="px-md font-body-sm text-on-surface-variant">
                  Vòng này chưa có bảng — thêm bảng tại mục Bảng thi.
                </p>
              ) : (
                <div className="space-y-md pl-0 md:pl-md">
                  {roundBoards.map((board) => {
                    const assigned = byBoard[board.id] ?? { mentors: [], judges: [] };
                    const busy = busyBoardId === board.id;
                    return (
                      <article
                        key={board.id}
                        className="rounded-xl border border-outline-variant bg-surface-container p-lg space-y-md"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-sm">
                          <div>
                            <p className="font-label-sm text-on-surface-variant">
                              {round.name} · Bảng thứ {board.boardOrder}
                            </p>
                            <h3 className="font-headline-sm text-on-surface">{board.name}</h3>
                            <p className="font-body-sm text-on-surface-variant">Mã bảng #{board.id}</p>
                          </div>
                          <Badge tone={getStatusTone(board.status)}>{getStatusLabel(board.status)}</Badge>
                        </div>

                        <div className="grid gap-md lg:grid-cols-2">
                          <div className="space-y-sm">
                            <p className="font-label-md text-on-surface">Mentor đã gán</p>
                            {assigned.mentors.length === 0 ? (
                              <p className="font-body-sm text-on-surface-variant">Chưa có mentor.</p>
                            ) : (
                              <ul className="flex flex-wrap gap-sm">
                                {assigned.mentors.map((row) => (
                                  <li
                                    key={row.id}
                                    className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-high px-sm py-xs font-body-sm"
                                  >
                                    {userNameById[row.assigneeId] ?? `User #${row.assigneeId}`}
                                    <button
                                      type="button"
                                      className="text-error hover:underline font-label-sm"
                                      disabled={busy}
                                      onClick={() => handleRemoveMentor(board.id, row.assigneeId)}
                                    >
                                      Gỡ
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                            <div className="flex flex-wrap gap-sm items-center pt-xs">
                              <select
                                className="form-input min-w-[180px]"
                                value={mentorPick[board.id] ?? ""}
                                onChange={(e) =>
                                  setMentorPick((current) => ({ ...current, [board.id]: e.target.value }))
                                }
                              >
                                <option value="">Thêm mentor</option>
                                {mentors.map((mentor) => (
                                  <option key={mentor.id} value={mentor.id}>
                                    {mentor.fullName}
                                  </option>
                                ))}
                              </select>
                              <Button
                                type="button"
                                size="sm"
                                disabled={busy}
                                onClick={() => handleAssignMentor(board.id)}
                              >
                                Gán
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-sm">
                            <p className="font-label-md text-on-surface">Giám khảo đã gán</p>
                            {assigned.judges.length === 0 ? (
                              <p className="font-body-sm text-on-surface-variant">Chưa có giám khảo.</p>
                            ) : (
                              <ul className="flex flex-wrap gap-sm">
                                {assigned.judges.map((row) => (
                                  <li
                                    key={row.id}
                                    className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-high px-sm py-xs font-body-sm"
                                  >
                                    {userNameById[row.assigneeId] ?? `User #${row.assigneeId}`}
                                    <button
                                      type="button"
                                      className="text-error hover:underline font-label-sm"
                                      disabled={busy}
                                      onClick={() => handleRemoveJudge(board.id, row.assigneeId)}
                                    >
                                      Gỡ
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                            <div className="flex flex-wrap gap-sm items-center pt-xs">
                              <select
                                className="form-input min-w-[180px]"
                                value={judgePick[board.id] ?? ""}
                                onChange={(e) =>
                                  setJudgePick((current) => ({ ...current, [board.id]: e.target.value }))
                                }
                              >
                                <option value="">Thêm giám khảo</option>
                                {judges.map((judge) => (
                                  <option key={judge.id} value={judge.id}>
                                    {judge.fullName}
                                  </option>
                                ))}
                              </select>
                              <Button
                                type="button"
                                size="sm"
                                disabled={busy}
                                onClick={() => handleAssignJudge(board.id)}
                              >
                                Gán
                              </Button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
