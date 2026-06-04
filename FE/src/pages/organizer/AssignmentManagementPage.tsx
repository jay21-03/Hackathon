import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import {
  assignJudge,
  assignMentor,
  fetchBoardJudges,
  fetchBoardMentors,
  removeJudge,
  removeMentor,
  type AssignmentResponse
} from "../../services/assignmentService";
import {
  fetchEventRounds,
  fetchRoundBoards,
  type BoardResponse,
  type RoundResponse
} from "../../services/contestApi";
import { fetchAdminUsers, type UserSummaryResponse } from "../../services/userService";
import { getStatusLabel, getStatusTone } from "../../domain/status";

type BoardAssignments = {
  mentors: AssignmentResponse[];
  judges: AssignmentResponse[];
};

export function AssignmentManagementPage() {
  const { notify } = useToast();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent();
  const [rounds, setRounds] = useState<RoundResponse[]>([]);
  const [boards, setBoards] = useState<BoardResponse[]>([]);
  const [users, setUsers] = useState<UserSummaryResponse[]>([]);
  const [byBoard, setByBoard] = useState<Record<number, BoardAssignments>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyBoardId, setBusyBoardId] = useState<number | null>(null);
  const [mentorPick, setMentorPick] = useState<Record<number, string>>({});
  const [judgePick, setJudgePick] = useState<Record<number, string>>({});

  const mentors = useMemo(
    () => users.filter((user) => user.roles.includes("MENTOR")),
    [users]
  );
  const judges = useMemo(
    () => users.filter((user) => user.roles.includes("JUDGE")),
    [users]
  );
  const userNameById = useMemo(
    () => Object.fromEntries(users.map((user) => [user.id, user.fullName])),
    [users]
  );

  const loadBoardAssignments = useCallback(async (boardList: BoardResponse[]) => {
    const entries = await Promise.all(
      boardList.map(async (board) => {
        const [mentorList, judgeList] = await Promise.all([
          fetchBoardMentors(board.id),
          fetchBoardJudges(board.id)
        ]);
        return [board.id, { mentors: mentorList, judges: judgeList }] as const;
      })
    );
    setByBoard(Object.fromEntries(entries));
  }, []);

  const reload = useCallback(async () => {
    if (!eventId) return;
    const roundList = await fetchEventRounds(eventId);
    const allBoards: BoardResponse[] = [];
    for (const round of roundList) {
      allBoards.push(...(await fetchRoundBoards(round.id)));
    }
    setRounds(roundList);
    setBoards(allBoards);
    await loadBoardAssignments(allBoards);
  }, [eventId, loadBoardAssignments]);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchEventRounds(eventId), fetchAdminUsers()])
      .then(async ([roundList, userList]) => {
        if (cancelled) return;
        setUsers(userList);
        const allBoards: BoardResponse[] = [];
        for (const round of roundList) {
          allBoards.push(...(await fetchRoundBoards(round.id)));
        }
        setRounds(roundList);
        setBoards(allBoards);
        await loadBoardAssignments(allBoards);
      })
      .catch(() => {
        if (!cancelled) setError("Không tải được dữ liệu phân công.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, loadBoardAssignments]);

  async function handleAssignMentor(boardId: number) {
    const userId = Number(mentorPick[boardId] ?? "");
    if (!userId) {
      notify("Chọn mentor.", "warning");
      return;
    }
    setBusyBoardId(boardId);
    try {
      await assignMentor(boardId, userId);
      await reload();
      notify("Đã gán mentor.", "success");
    } catch {
      notify("Gán mentor thất bại.", "danger");
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
      await reload();
      notify("Đã gán giám khảo.", "success");
    } catch {
      notify("Gán giám khảo thất bại.", "danger");
    } finally {
      setBusyBoardId(null);
    }
  }

  async function handleRemoveMentor(boardId: number, mentorId: number) {
    setBusyBoardId(boardId);
    try {
      await removeMentor(boardId, mentorId);
      await reload();
      notify("Đã gỡ mentor.", "success");
    } catch {
      notify("Gỡ mentor thất bại.", "danger");
    } finally {
      setBusyBoardId(null);
    }
  }

  async function handleRemoveJudge(boardId: number, judgeId: number) {
    setBusyBoardId(boardId);
    try {
      await removeJudge(boardId, judgeId);
      await reload();
      notify("Đã gỡ giám khảo.", "success");
    } catch {
      notify("Gỡ giám khảo thất bại.", "danger");
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
          Chưa có bảng thi — tạo vòng và bảng tại trang Quản lý bảng chấm trước.
        </p>
      ) : (
        <section className="space-y-md">
          {boards.map((board) => {
            const assigned = byBoard[board.id] ?? { mentors: [], judges: [] };
            const busy = busyBoardId === board.id;
            return (
              <article
                key={board.id}
                className="rounded-xl border border-outline-variant bg-surface-container p-lg space-y-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-sm">
                  <div>
                    <h2 className="font-headline-sm text-on-surface">{board.name}</h2>
                    <p className="font-body-sm text-on-surface-variant">Bảng #{board.id}</p>
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
                      <Button type="button" size="sm" disabled={busy} onClick={() => handleAssignMentor(board.id)}>
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
                      <Button type="button" size="sm" disabled={busy} onClick={() => handleAssignJudge(board.id)}>
                        Gán
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
