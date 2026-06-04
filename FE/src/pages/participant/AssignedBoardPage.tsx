import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useMyTeam } from "../../hooks/useMyTeam";
import { getStatusLabel, getStatusTone } from "../../domain/status";

export function AssignedBoardPage() {
  const { event, eventId, loading: eventLoading } = useActiveEvent();
  const { team, loading: teamLoading, error } = useMyTeam(eventId);

  if (eventLoading || teamLoading) {
    return <ModuleSkeleton rows={4} />;
  }

  if (!team) {
    return (
      <div className="space-y-lg">
        <PageHeader eyebrow="Bảng thi" title="Chưa có đội" description="Đăng ký đội để xem bảng thi." />
        <EmptyState icon="grid_view" title="Chưa có đội thi" description="Đăng ký đội trước khi được phân công bảng." />
      </div>
    );
  }

  if (team.status !== "CONFIRMED") {
    return (
      <div className="space-y-lg">
        <PageHeader
          eyebrow="Bảng thi"
          title={team.name}
          description="Đội cần được xác nhận trước khi ban tổ chức phân công bảng."
          actions={<Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>}
        />
        <EmptyState
          icon="grid_view"
          title="Chưa được phân công bảng"
          description={`Đội đang ở trạng thái ${getStatusLabel(team.status)}. Vui lòng chờ ban tổ chức duyệt.`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Bảng thi"
        title={team.name}
        description={event?.name ?? "Thông tin bảng thi sẽ cập nhật sau khi ban tổ chức phân công."}
        actions={<Badge tone="warning">Chờ phân công bảng</Badge>}
      />
      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface">{error}</p>
        </div>
      ) : null}
      <EmptyState
        icon="grid_view"
        title="Chưa có thông tin bảng"
        description="Ban tổ chức sẽ phân công đội vào bảng trước ngày thi. Hãy quay lại sau khi nhận thông báo."
      />
    </div>
  );
}
