import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { ModuleSkeleton } from "../ui/ModuleSkeleton";
import { RetryPanel } from "../feedback/RetryPanel";
import { RoundCountdown } from "../ui/RoundCountdown";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventRound } from "../../hooks/useEventRound";
import { useMyBoard } from "../../hooks/useMyBoard";
import { useMyProblem } from "../../hooks/useMyProblem";
import { useMyTeam } from "../../hooks/useMyTeam";
import { useParticipantTeamGuard } from "../../hooks/useParticipantTeamGuard";
import { ParticipantTeamBlocked } from "./ParticipantTeamBlocked";
import { ProblemContentView } from "./ProblemContentView";

function formatReleaseAt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

const reasonLabels: Record<string, string> = {
  NOT_ASSIGNED: "Chưa được phân bảng — không thể xem đề.",
  NO_PROBLEM: "Ban tổ chức chưa cấu hình đề cho bảng của bạn.",
  NOT_RELEASED: "Đề chưa tới giờ mở — xem thời gian bên dưới.",
  PROBLEM_CLOSED: "Đề đã đóng — không còn xem được nội dung.",
  TEAM_WAITLIST: "Đội đang trong danh sách chờ.",
  TEAM_REJECTED: "Hồ sơ đội đã bị từ chối.",
  TEAM_DISQUALIFIED: "Đội đã bị loại.",
  TEAM_NOT_CONFIRMED: "Đội chưa xác nhận.",
  NO_TEAM: "Chưa có đội thi."
};

export function ParticipantProblemPanel() {
  const { event, eventId, loading: eventLoading } = useActiveEvent();
  const { roundId, countdown, loading: roundLoading } = useEventRound(eventId);
  const { team, loading: teamLoading } = useMyTeam(eventId);
  const { board, loading: boardLoading } = useMyBoard(eventId);
  const { problemState, loading: problemLoading, error, refetch } = useMyProblem(eventId);
  const teamGuard = useParticipantTeamGuard(team);

  if (eventLoading || teamLoading || boardLoading || problemLoading) {
    return <ModuleSkeleton rows={3} />;
  }

  if (!team) {
    return <EmptyState icon="code" title="Chưa có đội thi" description="Đăng ký đội trước khi xem đề." />;
  }

  if (teamGuard.blocked && teamGuard.message) {
    return <ParticipantTeamBlocked message={teamGuard.message} />;
  }

  if (team.status !== "CONFIRMED") {
    return (
      <EmptyState icon="lock_clock" title="Chưa thể xem đề" description="Chờ ban tổ chức xác nhận đội trước." />
    );
  }

  if (error) {
    return <RetryPanel message={error} onRetry={() => void refetch()} />;
  }

  if (!board?.assigned) {
    return (
      <EmptyState
        icon="grid_view"
        title="Chưa có bảng thi"
        description={reasonLabels.NOT_ASSIGNED}
      />
    );
  }

  const activeRoundId = board.roundId ?? roundId;

  if (problemState?.available && problemState.problem) {
    const problem = problemState.problem;
    return (
      <div className="space-y-md">
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <div>
            <h3 className="font-headline-sm text-on-surface">{problem.title}</h3>
            <p className="font-body-sm text-on-surface-variant">
              {[board.boardName, event?.name].filter(Boolean).join(" · ")}
            </p>
          </div>
          <Badge tone="success">Đã mở đề</Badge>
        </div>
        <RoundCountdown roundId={activeRoundId} countdown={countdown} loading={roundLoading} />
        {problem.closeAt ? (
          <p className="font-body-sm text-on-surface-variant">
            Đóng đề lúc {formatReleaseAt(problem.closeAt)}.
          </p>
        ) : null}
        <ProblemContentView
          description={problem.description}
          externalLink={problem.externalLink}
          attachmentUrl={problem.attachmentUrl}
        />
      </div>
    );
  }

  const reason = problemState?.reason ?? "NO_PROBLEM";
  const releaseHint =
    reason === "NOT_RELEASED"
      ? `Đề sẽ mở lúc ${formatReleaseAt(problemState?.releaseAt)}.`
      : reason === "PROBLEM_CLOSED"
        ? `Đề đã đóng lúc ${formatReleaseAt(problemState?.closeAt)}.`
        : reasonLabels[reason] ?? "Đề thi chưa sẵn sàng.";

  return (
    <div className="space-y-md">
      <RoundCountdown roundId={activeRoundId} countdown={countdown} loading={roundLoading} />
      <EmptyState icon="lock_clock" title="Đề thi chưa sẵn sàng" description={releaseHint} />
    </div>
  );
}
