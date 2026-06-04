import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { RoundCountdown } from "../../components/ui/RoundCountdown";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventRound } from "../../hooks/useEventRound";
import { fetchEventDetail } from "../../services/eventsApi";
import { fetchEventTeams } from "../../services/registrationService";
import { getStatusLabel, getStatusTone } from "../../domain/status";

export function OrganizerOverviewPage() {
  const { eventId, event, events, setEventId, loading, error } = useActiveEvent();
  const { roundId, countdown, loading: roundLoading } = useEventRound(eventId);
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
        eyebrow="Tổng quan ban tổ chức"
        title={event?.name ?? "Cuộc thi"}
        description="Theo dõi đăng ký, phân công bảng và mentor/giám khảo."
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
        <div className="rounded-xl border border-error-container bg-error-container/30 p-md">
          <p className="font-body-sm text-on-surface">{error}</p>
        </div>
      ) : null}

      <RoundCountdown roundId={roundId} countdown={countdown} loading={roundLoading} />

      <section className="grid gap-md md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Doi xác nhận"
          value={confirmedTeams}
          helper={`${waitlistTeams} doi trong danh sach cho`}
          icon="groups"
          tone="success"
        />
        <StatCard
          label="Chờ duyệt"
          value={pendingTeams}
          helper="Can xử lý trong muc đăng ký"
          icon="pending_actions"
          tone="warning"
        />
        <StatCard
          label="Quota"
          value={quota ? `${confirmedTeams}/${quota}` : confirmedTeams}
          helper="Số đội đã xác nhận / quota"
          icon="fact_check"
          tone="primary"
        />
        <StatCard
          label="Cuộc thi"
          value={events.length}
          helper="Tong so cuộc thi dang quan ly"
          icon="event"
        />
      </section>

      <WorkflowSteps
        title="Thứ tự vận hành"
        description="Cac buoc chinh trong pham vi he thong hien tai."
        steps={[
          {
            label: "Đăng ký đội",
            detail: "Duyệt đội và quản lý danh sách chờ.",
            to: "/organizer/registrations",
            state: pendingTeams > 0 ? "active" : "done"
          },
          {
            label: "Phân công bang",
            detail: "Random hoặc thủ công gán đội vào slot.",
            to: "/organizer/boards",
            state: confirmedTeams > 0 ? "active" : "next"
          },
          {
            label: "Mentor & giám khảo",
            detail: "Gán mentor va giám khảo theo bang.",
            to: "/organizer/assignments",
            state: "next"
          }
        ]}
      />

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-headline-sm text-on-surface">Can xử lý tiep</h2>
            <p className="font-body-sm text-on-surface-variant">
              {pendingTeams > 0
                ? `${pendingTeams} doi dang cho duyệt.`
                : "Không có đội pending cần xử lý ngay."}
            </p>
          </div>
          <Link to="/organizer/registrations" className="font-label-md text-primary">
            Xem đăng ký
          </Link>
        </div>
      </section>
    </div>
  );
}
