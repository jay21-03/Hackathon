import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { fetchEventDetail } from "../../services/eventsApi";
import { fetchEventTeams } from "../../services/registrationService";
import { getStatusLabel, getStatusTone } from "../../domain/status";

export function OrganizerOverviewPage() {
  const { eventId, event, events, setEventId, loading, error } = useActiveEvent();
  const [confirmedTeams, setConfirmedTeams] = useState(0);
  const [pendingTeams, setPendingTeams] = useState(0);
  const [waitlistTeams, setWaitlistTeams] = useState(0);
  const [quota, setQuota] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setStatsLoading(false);
      return;
    }

    let cancelled = false;
    setStatsLoading(true);

    Promise.all([fetchEventTeams(eventId), fetchEventDetail(String(eventId))])
      .then(([teams, detail]) => {
        if (cancelled) return;
        setConfirmedTeams(teams.filter((team) => team.status === "CONFIRMED").length);
        setPendingTeams(teams.filter((team) => team.status === "PENDING").length);
        setWaitlistTeams(teams.filter((team) => team.status === "WAITLIST").length);
        setQuota(detail?.maxTeams ?? 0);
      })
      .catch(() => {
        if (!cancelled) {
          setConfirmedTeams(0);
          setPendingTeams(0);
          setWaitlistTeams(0);
        }
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading || statsLoading) {
    return <ModuleSkeleton rows={4} />;
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Tong quan ban to chuc"
        title={event?.name ?? "Cuoc thi"}
        description="Theo doi dang ky, phan cong bang va mentor/giam khao."
        actions={
          <>
            {event ? (
              <Badge tone={getStatusTone(event.status)}>{getStatusLabel(event.status)}</Badge>
            ) : null}
            <EventSelector events={events} eventId={eventId} onChange={setEventId} />
          </>
        }
      />

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface">{error}</p>
        </div>
      ) : null}

      <section className="grid gap-md md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Doi xac nhan"
          value={confirmedTeams}
          helper={`${waitlistTeams} doi trong danh sach cho`}
          icon="groups"
          tone="success"
        />
        <StatCard
          label="Cho duyet"
          value={pendingTeams}
          helper="Can xu ly trong muc dang ky"
          icon="pending_actions"
          tone="warning"
        />
        <StatCard
          label="Quota"
          value={quota ? `${confirmedTeams}/${quota}` : confirmedTeams}
          helper="So doi da xac nhan / quota"
          icon="fact_check"
          tone="primary"
        />
        <StatCard
          label="Cuoc thi"
          value={events.length}
          helper="Tong so cuoc thi dang quan ly"
          icon="event"
        />
      </section>

      <WorkflowSteps
        title="Thu tu van hanh"
        description="Cac buoc chinh trong pham vi he thong hien tai."
        steps={[
          {
            label: "Dang ky doi",
            detail: "Duyet doi va quan ly danh sach cho.",
            to: "/organizer/registrations",
            state: pendingTeams > 0 ? "active" : "done"
          },
          {
            label: "Phan cong bang",
            detail: "Random hoac thu cong gan doi vao slot.",
            to: "/organizer/boards",
            state: confirmedTeams > 0 ? "active" : "next"
          },
          {
            label: "Mentor & giam khao",
            detail: "Gan mentor va giam khao theo bang.",
            to: "/organizer/assignments",
            state: "next"
          }
        ]}
      />

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-headline-sm text-on-surface">Can xu ly tiep</h2>
            <p className="font-body-sm text-on-surface-variant">
              {pendingTeams > 0
                ? `${pendingTeams} doi dang cho duyet.`
                : "Khong co doi pending can xu ly ngay."}
            </p>
          </div>
          <Link to="/organizer/registrations" className="font-label-md text-primary">
            Xem dang ky
          </Link>
        </div>
      </section>
    </div>
  );
}
