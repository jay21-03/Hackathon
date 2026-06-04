import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { RoundCountdown } from "../../components/ui/RoundCountdown";
import { StatCard } from "../../components/ui/StatCard";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventRound } from "../../hooks/useEventRound";
import { useMyTeam } from "../../hooks/useMyTeam";
import { getStatusLabel, getStatusTone } from "../../domain/status";

export function ParticipantOverviewPage() {
  const { eventId, event, events, setEventId, loading: eventLoading } = useActiveEvent();
  const { roundId, countdown, loading: roundLoading } = useEventRound(eventId);
  const { team, loading: teamLoading, error } = useMyTeam(eventId);

  if (eventLoading || teamLoading) {
    return <ModuleSkeleton rows={4} />;
  }

  if (!team) {
    return (
      <div className="space-y-lg">
        <PageHeader
          eyebrow="Tổng quan thí sinh"
          title="Chưa có đội thi"
          description="Đăng ký đội để tham gia cuộc thi và theo dõi trạng thái tại đây."
          actions={<EventSelector events={events} eventId={eventId} onChange={setEventId} />}
        />
        {error ? <RetryPanel message={error} /> : null}
        <EmptyState
          icon="groups"
          title="Bạn chưa đăng ký đội nào"
          description="Chọn cuộc thi và tạo đội để bắt đầu."
          action={
            <ButtonLink to="/register" className="mt-md">
              Đăng ký đội
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

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Tổng quan thí sinh"
        title={team.name}
        description={event?.name ?? "Theo dõi trạng thái đội và các bước chuẩn bị trước ngày thi."}
        actions={
          <>
            <EventSelector events={events} eventId={eventId} onChange={setEventId} />
            <Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>
          </>
        }
      />

      <RoundCountdown roundId={roundId} countdown={countdown} loading={roundLoading} />

      <section className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Thành viên xác nhận"
          value={`${confirmedMembers}/${totalMembers}`}
          helper="Đội hợp lệ từ 1–5 thành viên"
          icon="groups"
          tone="success"
        />
        <StatCard
          label="Trạng thái đăng ký"
          value={getStatusLabel(team.status)}
          helper="Chờ ban tổ chức duyệt nếu đang PENDING"
          icon="fact_check"
          tone="primary"
        />
        <StatCard
          label="Cuộc thi"
          value={event?.name ?? `Sự kiện #${team.eventId}`}
          helper={`Mã đội #${team.id}`}
          icon="event"
        />
      </section>

      <WorkflowSteps
        title="Thứ tự cần hoàn thành"
        description="Các bước chuẩn bị trước ngày thi."
        steps={[
          {
            label: "Đội thi",
            detail: "Xác nhận thành viên và trạng thái đăng ký.",
            to: "/me/team",
            state: isConfirmed ? "done" : "active"
          },
          {
            label: "Bảng thi",
            detail: "Xem bảng được phân công sau khi đội được xác nhận.",
            to: "/me/board",
            state: isConfirmed ? "active" : "blocked"
          },
          {
            label: "Đề thi",
            detail: "Nội dung mở theo thời gian ban tổ chức cấu hình.",
            to: "/me/problem",
            state: isConfirmed ? "next" : "blocked"
          }
        ]}
      />

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-headline-sm text-on-surface">Tiếp theo</h2>
            <p className="font-body-sm text-on-surface-variant">
              Quản lý thành viên và theo dõi trạng thái đội.
            </p>
          </div>
          <Link to="/me/team" className="font-label-md text-primary">
            Xem đội của tôi
          </Link>
        </div>
      </section>
    </div>
  );
}
