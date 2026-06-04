import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useMyTeam } from "../../hooks/useMyTeam";
import { getStatusLabel, getStatusTone } from "../../domain/status";

export function ProblemPage() {
  const { event, eventId, loading: eventLoading } = useActiveEvent();
  const { team, loading: teamLoading, error } = useMyTeam(eventId);

  if (eventLoading || teamLoading) {
    return <ModuleSkeleton rows={4} />;
  }

  if (!team) {
    return (
      <div className="space-y-lg">
        <PageHeader eyebrow="De thi" title="Chua co doi" description="Dang ky doi de xem de thi." />
        <EmptyState icon="code" title="Chua co doi thi" description="Dang ky doi truoc khi xem de." />
      </div>
    );
  }

  if (team.status !== "CONFIRMED") {
    return (
      <div className="space-y-lg">
        <PageHeader
          eyebrow="De thi"
          title={team.name}
          description="Doi can duoc xac nhan truoc khi xem de thi."
          actions={<Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>}
        />
        <EmptyState icon="lock_clock" title="Chua the xem de" description="Cho ban to chuc duyet doi truoc." />
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="De thi"
        title={team.name}
        description={event?.name ?? "De thi se mo theo thoi gian ban to chuc cau hinh."}
        actions={<Badge tone="warning">Chua mo de</Badge>}
      />
      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface">{error}</p>
        </div>
      ) : null}
      <EmptyState
        icon="lock_clock"
        title="De thi chua san sang"
        description="Sau khi duoc phan cong bang va den gio mo de, noi dung se hien tai day."
      />
    </div>
  );
}
