import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { ParticipantWorkflowBar } from "../../components/participant/ParticipantWorkflowBar";
import { ParticipantProblemPanel } from "../../components/participant/ParticipantProblemPanel";
import { PageHeader } from "../../components/ui/PageHeader";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useMyTeam } from "../../hooks/useMyTeam";
import { useParticipantTeamGuard } from "../../hooks/useParticipantTeamGuard";
import { ParticipantTeamBlocked } from "../../components/participant/ParticipantTeamBlocked";
import { getStatusLabel, getStatusTone } from "../../domain/status";

export function ProblemPage() {
  const { event, eventId, loading: eventLoading } = useActiveEvent();
  const { team, loading: teamLoading } = useMyTeam(eventId);
  const teamGuard = useParticipantTeamGuard(team);

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

  if (teamGuard.blocked && teamGuard.message) {
    return (
      <div className="space-y-lg">
        <PageHeader eyebrow="Đề thi" title={team.name} description={event?.name ?? ""} />
        <ParticipantTeamBlocked message={teamGuard.message} />
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Đề thi"
        title={team.name}
        description={event?.name ?? ""}
        actions={<Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>}
      />
      <ParticipantWorkflowBar active="problem" />
      <ParticipantProblemPanel />
    </div>
  );
}
