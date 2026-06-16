import { useQuery } from "@tanstack/react-query";
import { enableScoring } from "../config/features";
import type { OrganizerSetupContext } from "../domain/organizerSetupSteps";
import { resolveOrganizerSetupSteps } from "../domain/organizerSetupSteps";
import { queryKeys } from "../lib/queryKeys";
import { fetchBoardJudges, fetchBoardMentors } from "../services/assignmentService";
import {
  fetchBoardProblems,
  fetchBoardSlots,
  fetchEventRounds,
  fetchRoundBoards
} from "../services/contestApi";
import { fetchRubric } from "../services/scoringApi";
import { pickActiveRound } from "../utils/pickActiveRound";
import { useEventTeamSummary } from "./useEventTeamSummary";

export function useEventSetupProgress(eventId: number | null, currentPath?: string) {
  const { summary, loading: summaryLoading } = useEventTeamSummary(eventId);

  const setupQuery = useQuery({
    queryKey: [...queryKeys.rounds.byEvent(eventId), "setup-progress"],
    enabled: Boolean(eventId),
    queryFn: async () => {
      const rounds = await fetchEventRounds(eventId!);
      const round = pickActiveRound(rounds) ?? rounds[0];
      const boards = round ? await fetchRoundBoards(round.id) : [];
      let slotsCount = 0;
      for (const board of boards) {
        const slots = await fetchBoardSlots(board.id);
        slotsCount += slots.length;
      }
      let hasProblem = false;
      let hasRubric = !enableScoring;
      let hasStaff = false;
      if (boards[0]) {
        const [problems, mentors, judges] = await Promise.all([
          fetchBoardProblems(boards[0].id),
          fetchBoardMentors(boards[0].id),
          fetchBoardJudges(boards[0].id)
        ]);
        hasProblem = problems.length > 0;
        hasStaff = mentors.length > 0 && judges.length > 0;
      }
      if (round && enableScoring) {
        try {
          const rubric = await fetchRubric(round.id);
          hasRubric = (rubric?.criteria?.length ?? 0) > 0;
        } catch {
          hasRubric = false;
        }
      }
      return { boardsCount: boards.length, slotsCount, hasProblem, hasRubric, hasStaff };
    }
  });

  const confirmedCount = summary?.confirmedCount ?? 0;
  const ctx: OrganizerSetupContext = {
    hasTeams: confirmedCount > 0,
    hasBoards: (setupQuery.data?.boardsCount ?? 0) > 0,
    hasSlots: (setupQuery.data?.slotsCount ?? 0) > 0,
    hasProblem: setupQuery.data?.hasProblem ?? false,
    hasRubric: setupQuery.data?.hasRubric ?? !enableScoring,
    hasStaff: setupQuery.data?.hasStaff ?? false
  };

  return {
    steps: resolveOrganizerSetupSteps(ctx, currentPath),
    context: ctx,
    loading: summaryLoading || setupQuery.isLoading
  };
}
