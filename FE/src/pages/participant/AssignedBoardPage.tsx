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
        <PageHeader eyebrow="Bang thi" title="Chua co doi" description="Dang ky doi de xem bang thi." />
        <EmptyState icon="grid_view" title="Chua co doi thi" description="Dang ky doi truoc khi duoc phan cong bang." />
      </div>
    );
  }

  if (team.status !== "CONFIRMED") {
    return (
      <div className="space-y-lg">
        <PageHeader
          eyebrow="Bang thi"
          title={team.name}
          description="Doi can duoc xac nhan truoc khi ban to chuc phan cong bang."
          actions={<Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>}
        />
        <EmptyState
          icon="grid_view"
          title="Chua duoc phan cong bang"
          description={`Doi dang o trang thai ${getStatusLabel(team.status)}. Vui long cho ban to chuc duyet.`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Bang thi"
        title={team.name}
        description={event?.name ?? "Thong tin bang thi se cap nhat sau khi ban to chuc phan cong."}
        actions={<Badge tone="warning">Cho phan cong bang</Badge>}
      />
      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface">{error}</p>
        </div>
      ) : null}
      <EmptyState
        icon="grid_view"
        title="Chua co thong tin bang"
        description="Ban to chuc se phan cong doi vao bang truoc ngay thi. Hay quay lai sau khi nhan thong bao."
      />
    </div>
  );
}
