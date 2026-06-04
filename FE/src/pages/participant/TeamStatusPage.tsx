import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useMyTeam } from "../../hooks/useMyTeam";
import { getStatusLabel, getStatusTone } from "../../domain/status";

export function TeamStatusPage() {
  const { event, eventId, loading: eventLoading } = useActiveEvent();
  const { team, loading: teamLoading, error } = useMyTeam(eventId);

  if (eventLoading || teamLoading) {
    return <ModuleSkeleton rows={4} />;
  }

  if (!team) {
    return (
      <div className="space-y-lg">
        <PageHeader eyebrow="Trang thai doi" title="Chua co doi" description="Dang ky doi de theo doi tien do." />
        {error ? (
          <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
            <p className="font-body-sm text-on-surface">{error}</p>
          </div>
        ) : null}
        <EmptyState icon="fact_check" title="Chua co doi thi" description="Dang ky doi de bat dau." />
      </div>
    );
  }

  const members = team.members ?? [];
  const confirmedMembers = members.filter((member) => member.status === "CONFIRMED").length;
  const steps = [
    { label: "Dang ky doi", status: team.status, to: "/me/team" },
    {
      label: "Thanh vien xac nhan",
      status: confirmedMembers === members.length && members.length > 0 ? "CONFIRMED" : "PENDING",
      to: "/me/team"
    },
    {
      label: "Phan cong bang",
      status: team.status === "CONFIRMED" ? "CONFIRMED" : "PENDING",
      to: "/me/board"
    }
  ];
  const completed = steps.filter((step) => step.status === "CONFIRMED").length;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Trang thai doi"
        title={team.name}
        description={event?.name ?? "Theo doi cac moc nghiep vu cua doi trong cuoc thi."}
        actions={<Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>}
      />
      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <ProgressBar value={Math.round((completed / steps.length) * 100)} label="Tien do tong" />
        <div className="mt-lg grid gap-sm">
          {steps.map((step) => (
            <Link
              key={step.label}
              to={step.to}
              className="flex items-center justify-between gap-md rounded-lg border border-outline-variant bg-surface-container-low p-md hover:bg-surface-variant"
            >
              <div className="flex items-center gap-sm">
                <Icon name="task_alt" className="text-primary" />
                <p className="font-label-md text-on-surface">{step.label}</p>
              </div>
              <Badge tone={getStatusTone(step.status)}>{getStatusLabel(step.status)}</Badge>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
