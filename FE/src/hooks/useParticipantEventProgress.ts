import { buildParticipantWorkflowSteps } from "../domain/participantWorkflow";
import { useMyBoard } from "./useMyBoard";
import { useMySubmission } from "./useMySubmission";
import { useMyTeam } from "./useMyTeam";
import { usePublicEventResults } from "./usePublicEventResults";

export type ProgressStepState = "done" | "active" | "blocked" | "next";

export function useParticipantEventProgress(eventId: number | null) {
  const { team, loading: teamLoading } = useMyTeam(eventId);
  const { board, loading: boardLoading } = useMyBoard(eventId);
  const { submission, loading: submissionLoading } = useMySubmission(eventId);
  const { resultsPublished, loading: resultsLoading } = usePublicEventResults(eventId);

  const isConfirmed = team?.status === "CONFIRMED";
  const hasBoard = Boolean(board?.assigned);
  const hasSubmitted = submission?.status === "SUBMITTED";

  const workflowSteps = buildParticipantWorkflowSteps({
    active: "team",
    isConfirmed: Boolean(isConfirmed),
    hasBoard,
    hasSubmitted,
    resultsPublished,
    teamStatus: team?.status
  });

  const steps: { label: string; state: ProgressStepState }[] = workflowSteps.map((step) => ({
    label: step.label,
    state: step.state as ProgressStepState
  }));

  return {
    team,
    board,
    submission,
    steps,
    loading: teamLoading || boardLoading || submissionLoading || resultsLoading,
    isConfirmed,
    hasBoard,
    hasSubmitted,
    resultsPublished
  };
}
