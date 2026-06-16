import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { queryKeys } from "../lib/queryKeys";
import type { BoardWithSlots } from "../pages/organizer/boardManagementUtils";
import {
  fetchBoardSlots,
  fetchEventRounds,
  fetchRoundBoards,
  type RoundResponse
} from "../services/contestApi";
import { fetchEventDetail } from "../services/eventsApi";
import {
  fetchEventTeamSummary,
  fetchEventTeams,
  type TeamDetailResponse
} from "../services/registrationService";
import { resolveApiError } from "../utils/apiError";
import { resolveDefaultRoundId } from "../utils/pickActiveRound";

/** State + React Query loaders cho trang Bảng thi — handlers UI vẫn ở page. */
export function useBoardManagement(eventId: number | null) {
  const queryClient = useQueryClient();
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [slotTeamPick, setSlotTeamPick] = useState<Record<number, string>>({});
  const [boardEdits, setBoardEdits] = useState<
    Record<number, { name: string; boardOrder: number; description: string }>
  >({});

  const roundsQuery = useQuery({
    queryKey: queryKeys.rounds.byEvent(eventId),
    queryFn: () => fetchEventRounds(eventId!),
    enabled: Boolean(eventId)
  });

  const eventDetailQuery = useQuery({
    queryKey: queryKeys.events.detail(eventId ?? ""),
    queryFn: () => fetchEventDetail(String(eventId)),
    enabled: Boolean(eventId)
  });

  const teamSummaryQuery = useQuery({
    queryKey: queryKeys.teams.summary(eventId ?? 0),
    queryFn: () => fetchEventTeamSummary(eventId!),
    enabled: Boolean(eventId)
  });

  const teamsQuery = useQuery({
    queryKey: [...queryKeys.teams.byEvent(eventId ?? 0), "board-mgmt", "confirmed"],
    queryFn: async () => {
      const paged = await fetchEventTeams(eventId!, { status: "CONFIRMED", size: 1000 });
      return Array.isArray(paged) ? paged : paged.items;
    },
    enabled: Boolean(eventId)
  });

  const boardDataQuery = useQuery({
    queryKey: queryKeys.boards.roundDetail(eventId, selectedRoundId),
    queryFn: async (): Promise<BoardWithSlots[]> => {
      const boardList = await fetchRoundBoards(selectedRoundId!);
      return Promise.all(
        boardList.map(async (board) => ({
          board,
          slots: await fetchBoardSlots(board.id)
        }))
      );
    },
    enabled: Boolean(selectedRoundId)
  });

  const rounds = useMemo(
    () => (roundsQuery.data ?? []) as RoundResponse[],
    [roundsQuery.data]
  );
  const boards = useMemo(() => boardDataQuery.data ?? [], [boardDataQuery.data]);
  const teams = useMemo(() => teamsQuery.data ?? [], [teamsQuery.data]);

  useEffect(() => {
    if (!eventId) {
      setSelectedRoundId(null);
      return;
    }
    if (rounds.length === 0) {
      setSelectedRoundId(null);
      return;
    }
    setSelectedRoundId((prev) => resolveDefaultRoundId(rounds, prev));
  }, [eventId, rounds]);

  useEffect(() => {
    if (!boardDataQuery.data) return;
    const withSlots = boardDataQuery.data;
    const picks: Record<number, string> = {};
    for (const { slots } of withSlots) {
      for (const slot of slots) {
        if (slot.teamId) picks[slot.id] = String(slot.teamId);
      }
    }
    setSlotTeamPick(picks);
    setBoardEdits(
      Object.fromEntries(
        withSlots.map(({ board }) => [
          board.id,
          {
            name: board.name,
            boardOrder: board.boardOrder,
            description: board.description ?? ""
          }
        ])
      )
    );
  }, [boardDataQuery.data]);

  const teamMap = useMemo(
    () => Object.fromEntries(teams.map((team) => [team.id, team.name])),
    [teams]
  );

  const confirmedTeams = useMemo(
    () => teams.filter((team) => team.status === "CONFIRMED"),
    [teams]
  );

  const confirmedTeamCount =
    teamSummaryQuery.data?.confirmedCount ?? confirmedTeams.length;

  const assignedTeamIds = useMemo(
    () =>
      new Set(
        boards.flatMap(({ slots }) => slots.map((s) => s.teamId).filter((id): id is number => id != null))
      ),
    [boards]
  );

  const invalidate = useCallback(
    async (roundId?: number) => {
      const targetRoundId = roundId ?? selectedRoundId;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.rounds.byEvent(eventId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.byEvent(eventId ?? 0) }),
        targetRoundId
          ? queryClient.invalidateQueries({
              queryKey: queryKeys.boards.roundDetail(eventId, targetRoundId)
            })
          : Promise.resolve()
      ]);
    },
    [eventId, queryClient, selectedRoundId]
  );

  const loading = eventId
    ? roundsQuery.isLoading ||
      teamsQuery.isLoading ||
      (selectedRoundId != null && boardDataQuery.isLoading)
    : false;

  const queryError =
    roundsQuery.error ?? teamsQuery.error ?? (selectedRoundId ? boardDataQuery.error : null);
  const error = queryError
    ? resolveApiError(queryError, "Không tải được thông tin bảng thi.")
    : null;

  return {
    rounds,
    selectedRoundId,
    setSelectedRoundId,
    boards,
    teams: teams as TeamDetailResponse[],
    loading,
    error,
    slotTeamPick,
    setSlotTeamPick,
    boardEdits,
    setBoardEdits,
    invalidate,
    eventDetail: eventDetailQuery.data ?? null,
    teamMap,
    confirmedTeams,
    confirmedTeamCount,
    assignedTeamIds
  };
}
