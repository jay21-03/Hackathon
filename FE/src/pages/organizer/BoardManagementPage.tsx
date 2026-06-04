import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import {
  fetchBoardSlots,
  fetchEventRounds,
  fetchRoundBoards,
  randomAssignTeams,
  type BoardResponse,
  type BoardSlotResponse,
  type RoundResponse
} from "../../services/contestApi";
import { fetchEventTeams, type TeamDetailResponse } from "../../services/registrationService";
import { getStatusLabel, getStatusTone } from "../../domain/status";

interface BoardWithSlots {
  board: BoardResponse;
  slots: BoardSlotResponse[];
}

export function BoardManagementPage() {
  const { notify } = useToast();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent();
  const [rounds, setRounds] = useState<RoundResponse[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [boards, setBoards] = useState<BoardWithSlots[]>([]);
  const [teams, setTeams] = useState<TeamDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teamMap = useMemo(
    () => Object.fromEntries(teams.map((team) => [team.id, team.name])),
    [teams]
  );

  async function loadBoardData(roundId: number) {
    const [boardList, teamList] = await Promise.all([
      fetchRoundBoards(roundId),
      eventId ? fetchEventTeams(eventId) : Promise.resolve([])
    ]);
    const withSlots = await Promise.all(
      boardList.map(async (board) => ({
        board,
        slots: await fetchBoardSlots(board.id)
      }))
    );
    setBoards(withSlots);
    setTeams(teamList);
  }

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchEventRounds(eventId)
      .then((roundList) => {
        if (cancelled) return;
        setRounds(roundList);
        const roundId = roundList[0]?.id ?? null;
        setSelectedRoundId(roundId);
        if (roundId) return loadBoardData(roundId);
      })
      .catch(() => {
        if (!cancelled) setError("Khong tai duoc thong tin bang thi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    if (!selectedRoundId) return;
    loadBoardData(selectedRoundId).catch(() => setError("Khong tai duoc slot bang thi."));
  }, [selectedRoundId]);

  async function handleRandomAssign() {
    if (!selectedRoundId) return;
    setAssigning(true);
    try {
      const result = await randomAssignTeams(selectedRoundId);
      await loadBoardData(selectedRoundId);
      notify(`Da phan cong ${result?.assignedCount ?? 0} doi.`, "success");
    } catch {
      notify("Phan cong ngau nhien that bai.", "danger");
    } finally {
      setAssigning(false);
    }
  }

  if (eventLoading || loading) return <ModuleSkeleton rows={4} />;

  const confirmedUnassigned = teams.filter(
    (team) => team.status === "CONFIRMED"
  ).length;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Bang thi va phan cong"
        title="Quan ly bang cham"
        description="Moi doi chi nam trong mot slot cua cung mot vong."
        actions={
          <>
            <EventSelector events={events} eventId={eventId} onChange={setEventId} />
            {rounds.length > 0 ? (
              <select
                value={selectedRoundId ?? ""}
                onChange={(event) => setSelectedRoundId(Number(event.target.value))}
                className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-label-md"
              >
                {rounds.map((round) => (
                  <option key={round.id} value={round.id}>
                    {round.name}
                  </option>
                ))}
              </select>
            ) : null}
            <Button type="button" disabled={!selectedRoundId || assigning} onClick={handleRandomAssign}>
              Phan cong ngau nhien
            </Button>
          </>
        }
      />

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface">{error}</p>
        </div>
      ) : null}

      {boards.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <p className="font-body-md text-on-surface-variant">
            Chua co bang thi cho vong nay. Tao bang trong phan thiet lap cuoc thi truoc.
          </p>
        </div>
      ) : (
        <section className="grid gap-md lg:grid-cols-2">
          {boards.map(({ board, slots }) => (
            <article key={board.id} className="rounded-xl border border-outline-variant bg-surface-container p-lg">
              <div className="flex items-start justify-between gap-md">
                <div>
                  <h2 className="font-headline-sm text-on-surface">{board.name}</h2>
                  <p className="font-body-sm text-on-surface-variant">Bang #{board.id}</p>
                </div>
                <Badge tone={getStatusTone(board.status)}>{getStatusLabel(board.status)}</Badge>
              </div>
              <div className="mt-md space-y-sm">
                {slots.length === 0 ? (
                  <p className="font-body-sm text-on-surface-variant">Chua co slot.</p>
                ) : (
                  slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm"
                    >
                      <span className="font-label-md">Vi tri #{slot.teamNumber}</span>
                      <span className="font-body-sm text-on-surface-variant">
                        {slot.teamId ? teamMap[slot.teamId] ?? `Doi #${slot.teamId}` : "Trong"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      <p className="font-body-sm text-on-surface-variant">
        {confirmedUnassigned} doi da xac nhan trong su kien (co the phan cong vao slot trong).
      </p>
    </div>
  );
}
