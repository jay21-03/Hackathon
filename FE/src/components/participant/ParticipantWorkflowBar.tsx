import { WorkflowSteps } from "../ui/WorkflowSteps";
import { buildParticipantWorkflowSteps, type ParticipantWorkflowPhase } from "../../domain/participantWorkflow";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useMyBoard } from "../../hooks/useMyBoard";
import { useMySubmission } from "../../hooks/useMySubmission";
import { useMyTeam } from "../../hooks/useMyTeam";
import { usePublicEventResults } from "../../hooks/usePublicEventResults";

interface ParticipantWorkflowBarProps {
  active: ParticipantWorkflowPhase;
}

export function ParticipantWorkflowBar({ active }: ParticipantWorkflowBarProps) {
  const { eventId } = useActiveEvent();
  const { team } = useMyTeam(eventId);
  const { board } = useMyBoard(eventId);
  const { submission } = useMySubmission(eventId);
  const { resultsPublished } = usePublicEventResults(eventId);

  const isConfirmed = team?.status === "CONFIRMED";
  const hasBoard = Boolean(board?.assigned);
  const hasSubmitted = submission?.status === "SUBMITTED";

  return (
    <WorkflowSteps
      title="Các bước tiếp theo"
      description="Bấm từng bước để mở trang tương ứng."
      steps={buildParticipantWorkflowSteps({
        active,
        isConfirmed: Boolean(isConfirmed),
        hasBoard,
        hasSubmitted,
        resultsPublished,
        teamStatus: team?.status
      })}
    />
  );
}
