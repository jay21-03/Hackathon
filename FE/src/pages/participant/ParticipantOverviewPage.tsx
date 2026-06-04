import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useMyTeam } from "../../hooks/useMyTeam";
import { getStatusLabel, getStatusTone } from "../../domain/status";

export function ParticipantOverviewPage() {
  const { eventId, event, loading: eventLoading } = useActiveEvent();
  const { team, loading: teamLoading, error } = useMyTeam(eventId);

  if (eventLoading || teamLoading) {
    return <ModuleSkeleton rows={4} />;
  }

  if (!team) {
    return (
      <div className="space-y-lg">
        <PageHeader
          eyebrow="Tong quan thi sinh"
          title="Chua co doi thi"
          description="Dang ky doi de tham gia cuoc thi va theo doi trang thai tai day."
        />
        {error ? (
          <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
            <p className="font-body-sm text-on-surface">{error}</p>
          </div>
        ) : null}
        <EmptyState
          icon="groups"
          title="Ban chua dang ky doi nao"
          description="Chon cuoc thi va tao doi de bat dau."
          action={
            <ButtonLink to="/register" className="mt-md">
              Dang ky doi
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const confirmedMembers =
    team.members?.filter((member) => member.status === "CONFIRMED").length ?? 0;
  const totalMembers = team.members?.length ?? 0;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Tong quan thi sinh"
        title={team.name}
        description={event?.name ?? "Theo doi trang thai doi va cac buoc chuan bi truoc ngay thi."}
        actions={
          <Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>
        }
      />

      <section className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Thanh vien xac nhan"
          value={`${confirmedMembers}/${totalMembers}`}
          helper="Doi hop le tu 1-5 thanh vien"
          icon="groups"
          tone="success"
        />
        <StatCard
          label="Trang thai dang ky"
          value={getStatusLabel(team.status)}
          helper="Cho ban to chuc duyet neu dang PENDING"
          icon="fact_check"
          tone="primary"
        />
        <StatCard
          label="Cuoc thi"
          value={event?.name ?? `Su kien #${team.eventId}`}
          helper={`Ma doi #${team.id}`}
          icon="event"
        />
      </section>

      <WorkflowSteps
        title="Thu tu can hoan thanh"
        description="Cac buoc chuan bi truoc ngay thi."
        steps={[
          {
            label: "Doi thi",
            detail: "Xac nhan thanh vien va trang thai dang ky.",
            to: "/me/team",
            state: team.status === "CONFIRMED" ? "done" : "active"
          },
          {
            label: "Bang thi",
            detail: "Xem bang duoc phan cong sau khi doi duoc xac nhan.",
            to: "/me/board",
            state: team.status === "CONFIRMED" ? "active" : "blocked"
          },
          {
            label: "De thi",
            detail: "Noi dung mo theo thoi gian ban to chuc cau hinh.",
            to: "/me/problem",
            state: team.status === "CONFIRMED" ? "next" : "blocked"
          }
        ]}
      />

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-headline-sm text-on-surface">Tiep theo</h2>
            <p className="font-body-sm text-on-surface-variant">
              Quan ly thanh vien va theo doi trang thai doi.
            </p>
          </div>
          <Link to="/me/team" className="font-label-md text-primary">
            Xem doi cua toi
          </Link>
        </div>
      </section>
    </div>
  );
}
