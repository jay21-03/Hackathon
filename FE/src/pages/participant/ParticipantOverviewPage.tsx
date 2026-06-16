import { RoundCountdown } from "../../components/ui/RoundCountdown";
import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { ParticipantDeadlineStrip } from "../../components/participant/ParticipantDeadlineStrip";
import { ParticipantWorkflowBar } from "../../components/participant/ParticipantWorkflowBar";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventRound } from "../../hooks/useEventRound";
import { useMyBoard } from "../../hooks/useMyBoard";
import { useMySubmission } from "../../hooks/useMySubmission";
import { useMyTeam } from "../../hooks/useMyTeam";
import { enableSubmissions } from "../../config/features";
import { getStatusLabel, getStatusTone } from "../../domain/status";

export function ParticipantOverviewPage() {
  const { eventId, event, loading: eventLoading } = useActiveEvent();
  const { team, loading: teamLoading, error } = useMyTeam(eventId);
  const { board, loading: boardLoading } = useMyBoard(eventId);
  const { round, roundId, countdown, loading: roundLoading } = useEventRound(eventId);
  const { submission, loading: submissionLoading } = useMySubmission(eventId);

  if (eventLoading || teamLoading || boardLoading || submissionLoading) {
    return <ModuleSkeleton rows={4} />;
  }

  if (!team) {
    return (
      <div className="space-y-lg">
        <PageHeader
          eyebrow="Tổng quan"
          title="Chưa có đội thi"
          description={
            event
              ? `Bạn chưa có đội tại ${event.name}. Xem chi tiết cuộc thi để đăng ký hoặc chọn cuộc thi khác.`
              : "Chọn cuộc thi từ danh sách, xem chi tiết rồi đăng ký đội."
          }
        />
        {error ? <RetryPanel message={error} /> : null}
        <EmptyState
          icon="groups"
          title="Bạn chưa đăng ký đội nào"
          description="Mỗi cuộc thi một đội — quay danh sách để chọn hoặc đổi cuộc thi."
          action={
            <ButtonLink
              to={eventId ? `/events/${eventId}` : "/events"}
              className="mt-md"
            >
              {eventId ? "Xem chi tiết cuộc thi" : "Danh sách các cuộc thi"}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const confirmedMembers =
    team.members?.filter((member) => member.status === "CONFIRMED").length ?? 0;
  const totalMembers = team.members?.length ?? 0;
  const isConfirmed = team.status === "CONFIRMED";
  const hasBoard = Boolean(board?.assigned);

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Tổng quan"
        title={team.name}
        description={event?.name ?? "Theo dõi tiến độ chuẩn bị trước ngày thi."}
        actions={<Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>}
      />

      <ParticipantDeadlineStrip />

      {roundId ? (
        <RoundCountdown
          roundId={roundId}
          countdown={countdown}
          loading={roundLoading}
          phaseStatus={round?.status}
          phaseName={round?.name}
        />
      ) : null}

      <section className="grid gap-md md:grid-cols-3">
        <StatCard
          label="Thành viên xác nhận"
          value={`${confirmedMembers}/${totalMembers}`}
          helper={`Đội hợp lệ từ ${event?.minTeamSize ?? 1}–${event?.maxTeamSize ?? 5} thành viên`}
          icon="groups"
          tone="success"
        />
        <StatCard
          label="Bảng thi"
          value={
            hasBoard
              ? `${[board?.roundName, board?.boardName].filter(Boolean).join(" · ")} · #${board?.slotNumber ?? "—"}`
              : "Chưa gán"
          }
          helper={
            !isConfirmed
              ? "Đội cần được BTC xác nhận trước khi gán bảng"
              : hasBoard
                ? "Xem chi tiết tại mục Bảng thi"
                : "Chờ BTC gán sau khi đội được xác nhận"
          }
          icon="grid_view"
          tone={hasBoard ? "primary" : "warning"}
        />
        {enableSubmissions ? (
          <StatCard
            label="Bài nộp"
            value={submission?.status === "SUBMITTED" ? "Đã nộp" : submission?.status === "DRAFT" ? "Bản nháp" : "Chưa nộp"}
            helper={submission?.repositoryUrl ? "Đã có link repository" : "Nộp tại mục Bài nộp"}
            icon="upload"
            tone={submission?.status === "SUBMITTED" ? "success" : "warning"}
          />
        ) : null}
      </section>

      <ParticipantWorkflowBar active="team" />
    </div>
  );
}
