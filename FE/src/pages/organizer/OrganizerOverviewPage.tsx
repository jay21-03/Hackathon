import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "../../components/ui/Badge";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { RoundCountdown } from "../../components/ui/RoundCountdown";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventRound } from "../../hooks/useEventRound";
import { useEventTeams } from "../../hooks/useEventTeams";
import { enableRanking, enableScoring } from "../../config/features";
import { fetchEventDetail } from "../../services/eventsApi";
import { fetchEventRounds, fetchRoundBoards } from "../../services/contestApi";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { queryKeys } from "../../lib/queryKeys";

export function OrganizerOverviewPage() {
  const { eventId, event, events, setEventId, loading, error } = useActiveEvent({ autoSelectFirst: true });
  const { roundId, countdown, loading: roundLoading } = useEventRound(eventId);
  const { teams, loading: teamsLoading } = useEventTeams(eventId);

  const detailQuery = useQuery({
    queryKey: [...queryKeys.events.detail(eventId ?? ""), "organizer-stats"],
    queryFn: () => fetchEventDetail(String(eventId)),
    enabled: Boolean(eventId)
  });

  const structureQuery = useQuery({
    queryKey: [...queryKeys.rounds.byEvent(eventId), "structure-count"],
    enabled: Boolean(eventId),
    queryFn: async () => {
      const rounds = await fetchEventRounds(eventId!);
      let boardCount = 0;
      for (const round of rounds) {
        const boards = await fetchRoundBoards(round.id);
        boardCount += boards.length;
      }
      return { roundCount: rounds.length, boardCount };
    }
  });

  const confirmedTeams = teams.filter((team) => team.status === "CONFIRMED").length;
  const pendingTeams = teams.filter((team) => team.status === "PENDING").length;
  const waitlistTeams = teams.filter((team) => team.status === "WAITLIST").length;
  const quota = detailQuery.data?.maxTeams ?? 0;
  const boardCount = structureQuery.data?.boardCount ?? 0;

  if (loading || teamsLoading || detailQuery.isLoading) {
    return <ModuleSkeleton rows={4} />;
  }

  const nextAction =
    pendingTeams > 0
      ? {
          text: `${pendingTeams} đội đang chờ duyệt.`,
          to: "/organizer/registrations",
          label: "Xem đăng ký đội"
        }
      : confirmedTeams > 0 && boardCount === 0
        ? {
            text: "Đã có đội xác nhận — cần tạo bảng và gán slot.",
            to: "/organizer/boards",
            label: "Thiết lập bảng thi"
          }
        : confirmedTeams === 0
          ? {
              text: "Chưa có đội xác nhận — kiểm tra đăng ký hoặc mở đăng ký.",
              to: "/organizer/registrations",
              label: "Xem đăng ký"
            }
          : {
              text: "Tiếp tục cấu hình đề hoặc phân công mentor.",
              to: "/organizer/problems",
              label: "Cấu hình đề thi"
            };

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Tổng quan"
        title={event?.name ?? "Cuộc thi"}
        description="Số liệu vận hành theo cuộc thi đang chọn. Chi tiết thiết lập tại mục Cuộc thi trên sidebar."
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
          label="Đội đã xác nhận"
          value={confirmedTeams}
          helper={`${waitlistTeams} đội danh sách chờ`}
          icon="groups"
          tone="success"
        />
        <StatCard
          label="Chờ duyệt"
          value={pendingTeams}
          helper={pendingTeams > 0 ? "Cần xử lý" : "Không có pending"}
          icon="pending_actions"
          tone="warning"
        />
        <StatCard
          label="Quota"
          value={quota ? `${confirmedTeams}/${quota}` : confirmedTeams}
          helper="Đội xác nhận / quota"
          icon="fact_check"
          tone="primary"
        />
        <StatCard
          label="Bảng thi"
          value={boardCount}
          helper={`${structureQuery.data?.roundCount ?? 0} vòng`}
          icon="view_module"
        />
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-headline-sm text-on-surface">Việc cần làm</h2>
            <p className="font-body-sm text-on-surface-variant">{nextAction.text}</p>
          </div>
          <Link to={nextAction.to} className="font-label-md text-primary hover:underline">
            {nextAction.label} →
          </Link>
        </div>
      </section>

      {boardCount > 0 && (enableScoring || enableRanking) ? (
        <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <h2 className="font-headline-sm text-on-surface">Chấm điểm & kết quả</h2>
          <p className="mt-xs font-body-sm text-on-surface-variant">
            Các mục này nằm trên sidebar bên trái (nhóm «Chấm điểm» và «Kết quả»). Cuộn sidebar nếu chưa thấy.
          </p>
          <div className="mt-md flex flex-wrap gap-md font-label-md text-on-surface-variant">
            {enableScoring ? (
              <>
                <span>Tiêu chí chấm</span>
                <span>·</span>
                <span>Tiến độ chấm</span>
              </>
            ) : null}
            {enableScoring && enableRanking ? <span>·</span> : null}
            {enableRanking ? (
              <>
                <span>Xếp hạng</span>
                <span>·</span>
                <span>Công bố kết quả</span>
              </>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
