import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { assignJudge, assignMentor } from "../../services/assignmentService";
import {
  fetchEventRounds,
  fetchRoundBoards,
  type BoardResponse,
  type RoundResponse
} from "../../services/contestApi";
import { fetchAdminUsers, type UserSummaryResponse } from "../../services/userService";
import { getStatusLabel, getStatusTone } from "../../domain/status";

export function AssignmentManagementPage() {
  const { notify } = useToast();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent();
  const [rounds, setRounds] = useState<RoundResponse[]>([]);
  const [boards, setBoards] = useState<BoardResponse[]>([]);
  const [users, setUsers] = useState<UserSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningBoardId, setAssigningBoardId] = useState<number | null>(null);

  const mentors = useMemo(
    () => users.filter((user) => user.roles.includes("MENTOR")),
    [users]
  );
  const judges = useMemo(
    () => users.filter((user) => user.roles.includes("JUDGE")),
    [users]
  );

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
        setRounds(roundList);
        setUsers(userList);
        const allBoards: BoardResponse[] = [];
        for (const round of roundList) {
          const roundBoards = await fetchRoundBoards(round.id);
          allBoards.push(...roundBoards);
        }
        setBoards(allBoards);
      })
      .catch(() => {
        if (!cancelled) setError("Khong tai duoc du lieu phan cong.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function handleAssignMentor(boardId: number, userId: number) {
    setAssigningBoardId(boardId);
    try {
      await assignMentor(boardId, userId);
      notify("Da gan mentor.", "success");
    } catch {
      notify("Gan mentor that bai.", "danger");
    } finally {
      setAssigningBoardId(null);
    }
  }

  async function handleAssignJudge(boardId: number, userId: number) {
    setAssigningBoardId(boardId);
    try {
      await assignJudge(boardId, userId);
      notify("Da gan giam khao.", "success");
    } catch {
      notify("Gan giam khao that bai.", "danger");
    } finally {
      setAssigningBoardId(null);
    }
  }

  if (eventLoading || loading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Phan cong"
        title="Mentor va giam khao theo bang"
        description="Gan mentor va giam khao cho tung bang thi."
        actions={<EventSelector events={events} eventId={eventId} onChange={setEventId} />}
      />

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface">{error}</p>
        </div>
      ) : null}

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Bang thi" value={boards.length} helper={`${rounds.length} vong`} icon="view_module" />
        <StatCard label="Mentor" value={mentors.length} helper="Tai khoan co vai tro MENTOR" icon="groups" tone="success" />
        <StatCard label="Giam khao" value={judges.length} helper="Tai khoan co vai tro JUDGE" icon="gavel" tone="warning" />
      </section>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="table-header-bg">
              <tr className="font-label-sm text-on-surface-variant">
                <th className="px-md py-sm">Bang</th>
                <th className="px-md py-sm">Trang thai</th>
                <th className="px-md py-sm">Gan mentor</th>
                <th className="px-md py-sm">Gan giam khao</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {boards.map((board) => (
                <tr key={board.id} className="font-body-sm text-on-surface">
                  <td className="px-md py-md font-label-md">{board.name}</td>
                  <td className="px-md py-md">
                    <Badge tone={getStatusTone(board.status)}>{getStatusLabel(board.status)}</Badge>
                  </td>
                  <td className="px-md py-md">
                    <div className="flex flex-wrap gap-1">
                      {mentors.slice(0, 3).map((mentor) => (
                        <Button
                          key={mentor.id}
                          size="sm"
                          variant="ghost"
                          disabled={assigningBoardId === board.id}
                          onClick={() => handleAssignMentor(board.id, mentor.id)}
                        >
                          {mentor.fullName.split(" ").slice(-1)[0]}
                        </Button>
                      ))}
                    </div>
                  </td>
                  <td className="px-md py-md">
                    <div className="flex flex-wrap gap-1">
                      {judges.slice(0, 3).map((judge) => (
                        <Button
                          key={judge.id}
                          size="sm"
                          variant="ghost"
                          disabled={assigningBoardId === board.id}
                          onClick={() => handleAssignJudge(board.id, judge.id)}
                        >
                          {judge.fullName.split(" ").slice(-1)[0]}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
