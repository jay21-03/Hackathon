import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { ParticipantWorkflowBar } from "../../components/participant/ParticipantWorkflowBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { RoundCountdown } from "../../components/ui/RoundCountdown";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventRound } from "../../hooks/useEventRound";
import { useMyBoard } from "../../hooks/useMyBoard";
import { useMyProblem } from "../../hooks/useMyProblem";
import { useMyTeam } from "../../hooks/useMyTeam";
import { useParticipantTeamGuard } from "../../hooks/useParticipantTeamGuard";
import { ParticipantTeamBlocked } from "../../components/participant/ParticipantTeamBlocked";
import { getStatusLabel, getStatusTone } from "../../domain/status";

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

export function ProblemPage() {
  const { event, eventId, loading: eventLoading } = useActiveEvent();
  const { roundId, countdown, loading: roundLoading } = useEventRound(eventId);
  const { team, loading: teamLoading } = useMyTeam(eventId);
  const { board, loading: boardLoading } = useMyBoard(eventId);
  const { problemState, loading: problemLoading, error, refetch } = useMyProblem(eventId);
  const teamGuard = useParticipantTeamGuard(team);

  if (eventLoading || teamLoading || boardLoading || problemLoading) {
    return <ModuleSkeleton rows={4} />;
  }

  if (!team) {
    return (
      <div className="space-y-lg">
        <PageHeader eyebrow="Đề thi" title="Chưa có đội" description="Đăng ký đội để xem đề thi." />
        <EmptyState icon="code" title="Chưa có đội thi" description="Đăng ký đội trước khi xem đề." />
      </div>
    );
  }

  if (teamGuard.blocked && teamGuard.message) {
    return (
      <div className="space-y-lg">
        <PageHeader eyebrow="Đề thi" title={team.name} description={event?.name ?? ""} />
        <ParticipantTeamBlocked message={teamGuard.message} />
      </div>
    );
  }

  if (team.status !== "CONFIRMED") {
    return (
      <div className="space-y-lg">
        <PageHeader
          eyebrow="Đề thi"
          title={team.name}
          description="Đội cần được xác nhận trước khi xem đề thi."
          actions={<Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>}
        />
        <EmptyState icon="lock_clock" title="Chưa thể xem đề" description="Chờ ban tổ chức duyệt đội trước." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-lg">
        <PageHeader eyebrow="Đề thi" title={team.name} description={event?.name ?? ""} />
        <RetryPanel message={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  if (!board?.assigned) {
    return (
      <div className="space-y-lg">
        <PageHeader
          eyebrow="Đề thi"
          title={team.name}
          description="Cần được phân bảng trước khi xem đề."
          actions={<Badge tone="warning">Chờ phân bảng</Badge>}
        />
        <EmptyState
          icon="grid_view"
          title="Chưa có bảng thi"
          description={reasonLabels.NOT_ASSIGNED}
        />
      </div>
    );
  }

  const activeRoundId = board.roundId ?? roundId;

  if (problemState?.available && problemState.problem) {
    const problem = problemState.problem;
    return (
      <div className="space-y-lg">
        <PageHeader
          eyebrow="Đề thi"
          title={problem.title}
          description={[board.boardName, event?.name].filter(Boolean).join(" · ")}
          actions={<Badge tone="success">Đã mở đề</Badge>}
        />
        <ParticipantWorkflowBar active="problem" />
        <RoundCountdown roundId={activeRoundId} countdown={countdown} loading={roundLoading} />
        {problem.closeAt ? (
          <p className="font-body-sm text-on-surface-variant">
            Đóng đề lúc {formatReleaseAt(problem.closeAt)}.
          </p>
        ) : null}
        <article className="rounded-xl border border-outline-variant bg-surface-container p-lg space-y-md">
          {problem.description ? (
            <div className="font-body-md text-on-surface whitespace-pre-wrap">{problem.description}</div>
          ) : (
            <p className="font-body-sm text-on-surface-variant">Ban tổ chức chưa nhập mô tả chi tiết.</p>
          )}
          {problem.externalLink ? (
            <p className="font-body-sm">
              <a href={problem.externalLink} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                Liên kết đề thi
              </a>
            </p>
          ) : null}
          {problem.attachmentUrl ? (
            <p className="font-body-sm">
              <a href={problem.attachmentUrl} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                Tệp đính kèm
              </a>
            </p>
          ) : null}
        </article>
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
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Đề thi"
        title={team.name}
        description={board.boardName ?? event?.name ?? ""}
        actions={
          <Badge
            tone={
              reason === "NOT_RELEASED" ? "warning" : reason === "PROBLEM_CLOSED" ? "danger" : "neutral"
            }
          >
            {reason === "NOT_RELEASED"
              ? "Chờ mở đề"
              : reason === "PROBLEM_CLOSED"
                ? "Đã đóng đề"
                : "Chưa có đề"}
          </Badge>
        }
      />
      <RoundCountdown roundId={activeRoundId} countdown={countdown} loading={roundLoading} />
      <EmptyState icon="lock_clock" title="Đề thi chưa sẵn sàng" description={releaseHint} />
    </div>
  );
}
