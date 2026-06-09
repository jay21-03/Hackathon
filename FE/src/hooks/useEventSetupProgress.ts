import { useQuery } from "@tanstack/react-query";
import type { OrganizerSetupContext } from "../domain/organizerSetupSteps";
import { resolveOrganizerSetupSteps } from "../domain/organizerSetupSteps";
import { queryKeys } from "../lib/queryKeys";
import { fetchBoardProblems, fetchEventRounds, fetchRoundBoards } from "../services/contestApi";
import { fetchRubric } from "../services/scoringApi";
import { useEventTeams } from "./useEventTeams";

export function useEventSetupProgress(eventId: number | null, currentPath?: string) {
  const { teams, loading: teamsLoading } = useEventTeams(eventId);

  const setupQuery = useQuery({
    queryKey: [...queryKeys.rounds.byEvent(eventId), "setup-progress"],
    enabled: Boolean(eventId),
    queryFn: async () => {
      const rounds = await fetchEventRounds(eventId!);
      const round = rounds[0];
      const boards = round ? await fetchRoundBoards(round.id) : [];
      let hasProblem = false;
      let hasRubric = false;
      if (boards[0]) {
        const problems = await fetchBoardProblems(boards[0].id);
        hasProblem = problems.length > 0;
      }
      if (round) {
        try {
          const rubric = await fetchRubric(round.id);
          hasRubric = (rubric?.criteria?.length ?? 0) > 0;
        } catch {
          hasRubric = false;
        }
      }
      return { boardsCount: boards.length, hasProblem, hasRubric };
    }
  });

  const ctx: OrganizerSetupContext = {
    hasTeams: teams.length > 0,
    hasBoards: (setupQuery.data?.boardsCount ?? 0) > 0,
    hasProblem: setupQuery.data?.hasProblem ?? false,
    hasRubric: setupQuery.data?.hasRubric ?? false
  };

  return {
    steps: resolveOrganizerSetupSteps(ctx, currentPath),
    context: ctx,
    loading: teamsLoading || setupQuery.isLoading
  };
}
