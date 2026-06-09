import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventRound } from "../../hooks/useEventRound";
import { useMyProblem } from "../../hooks/useMyProblem";
import { useMySubmission } from "../../hooks/useMySubmission";
import { RoundCountdown } from "../ui/RoundCountdown";

export function ParticipantDeadlineStrip() {
  const { eventId } = useActiveEvent();
  const { roundId, countdown, loading: roundLoading } = useEventRound(eventId);
  const { problemState } = useMyProblem(eventId);
  const { submission } = useMySubmission(eventId);

  const hasAny =
    Boolean(countdown) || Boolean(problemState?.closeAt) || Boolean(submission?.deadlineAt);
  if (!hasAny) return null;

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container p-md space-y-sm">
      <h2 className="font-label-md text-on-surface">Mốc thời gian</h2>
      <RoundCountdown roundId={roundId} countdown={countdown} loading={roundLoading} />
      {problemState?.closeAt ? (
        <p className="font-body-sm text-on-surface-variant">
          Đóng đề:{" "}
          {new Date(problemState.closeAt).toLocaleString("vi-VN", {
            dateStyle: "medium",
            timeStyle: "short"
          })}
        </p>
      ) : null}
      {submission?.deadlineAt ? (
        <p className="font-body-sm text-on-surface-variant">
          Hạn nộp bài:{" "}
          {new Date(submission.deadlineAt).toLocaleString("vi-VN", {
            dateStyle: "medium",
            timeStyle: "short"
          })}
        </p>
      ) : null}
    </section>
  );
}
