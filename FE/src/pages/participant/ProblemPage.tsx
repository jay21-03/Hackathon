import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { RoundCountdown } from "../../components/ui/RoundCountdown";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventRound } from "../../hooks/useEventRound";
import { useMyTeam } from "../../hooks/useMyTeam";
import { getStatusLabel, getStatusTone } from "../../domain/status";

export function ProblemPage() {
  const { event, eventId, loading: eventLoading } = useActiveEvent();
  const { roundId, countdown, loading: roundLoading } = useEventRound(eventId);
  const { team, loading: teamLoading, error } = useMyTeam(eventId);

  if (eventLoading || teamLoading) {
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

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Đề thi"
        title={team.name}
        description={event?.name ?? "Đề thi sẽ mở theo thời gian ban tổ chức cấu hình."}
        actions={<Badge tone="warning">Chờ API đề thi</Badge>}
      />
      <RoundCountdown roundId={roundId} countdown={countdown} loading={roundLoading} />
      {error ? <RetryPanel message={error} /> : null}
      <EmptyState
        icon="lock_clock"
        title="Đề thi chưa sẵn sàng"
        description="Khi backend bổ sung GET /my/problem và đến giờ mở đề, nội dung sẽ hiện tại đây."
      />
    </div>
  );
}
