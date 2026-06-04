import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { RoundCountdown } from "../../components/ui/RoundCountdown";
import { StatCard } from "../../components/ui/StatCard";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventRound } from "../../hooks/useEventRound";
import { useMyBoard } from "../../hooks/useMyBoard";
import { useMyTeam } from "../../hooks/useMyTeam";
import { getStatusLabel, getStatusTone } from "../../domain/status";

export function ParticipantOverviewPage() {
  const { eventId, event, loading: eventLoading } = useActiveEvent();
  const { roundId, countdown, loading: roundLoading } = useEventRound(eventId);
  const { team, loading: teamLoading, error } = useMyTeam(eventId);
  const { board, loading: boardLoading } = useMyBoard(eventId);

  if (eventLoading || teamLoading || boardLoading) {
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

      <RoundCountdown roundId={roundId} countdown={countdown} loading={roundLoading} />

      <section className="grid gap-md md:grid-cols-2">
        <StatCard
          label="Thành viên xác nhận"
          value={`${confirmedMembers}/${totalMembers}`}
          helper="Đội hợp lệ từ 1–5 thành viên"
          icon="groups"
          tone="success"
        />
        <StatCard
          label="Bảng thi"
          value={
            hasBoard
              ? `${board?.boardName ?? "—"} · #${board?.slotNumber ?? "—"}`
              : "Chưa gán"
          }
          helper={hasBoard ? "Xem chi tiết tại mục Bảng thi" : "Chờ BTC gán sau khi đội được xác nhận"}
          icon="grid_view"
          tone={hasBoard ? "primary" : "warning"}
        />
      </section>

      <WorkflowSteps
        title="Các bước tiếp theo"
        description="Bấm từng bước để mở trang tương ứng."
        steps={[
          {
            label: "Đội thi",
            detail: "Thành viên và tiến độ xác nhận.",
            to: "/me/team",
            state: isConfirmed ? "done" : "active"
          },
          {
            label: "Bảng thi",
            detail: hasBoard
              ? `${board?.boardName} — slot #${board?.slotNumber}`
              : "Chờ ban tổ chức gán bảng.",
            to: "/me/board",
            state: !isConfirmed ? "blocked" : hasBoard ? "done" : "active"
          },
          {
            label: "Đề thi",
            detail: "Mở theo lịch ban tổ chức cấu hình.",
            to: "/me/problem",
            state: !isConfirmed || !hasBoard ? "blocked" : "next"
          }
        ]}
      />
    </div>
  );
}
