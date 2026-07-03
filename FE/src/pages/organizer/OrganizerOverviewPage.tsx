import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "../../components/ui/Badge";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { SchedulerHealthPanel } from "../../components/organizer/SchedulerHealthPanel";
import { TermDashboardPanel } from "../../components/organizer/TermDashboardPanel";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { RoundCountdown } from "../../components/ui/RoundCountdown";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventSetupProgress } from "../../hooks/useEventSetupProgress";
import { useEventRound } from "../../hooks/useEventRound";
import { useEventTeamSummary } from "../../hooks/useEventTeamSummary";
import { enableRanking, enableScoring } from "../../config/features";
import { fetchEventDetail } from "../../services/eventsApi";
import { fetchEventRankings } from "../../services/rankingApi";
import { fetchEventScoreProgress } from "../../services/scoringApi";
import { fetchEventRounds, fetchRoundBoards } from "../../services/contestApi";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { queryKeys } from "../../lib/queryKeys";

export function OrganizerOverviewPage() {
  const { eventId, event, loading, error, refetch: refetchEvents } = useActiveEvent({ autoSelectFirst: true });
  const { roundId, countdown, loading: roundLoading } = useEventRound(eventId);
  const { summary: teamSummary } = useEventTeamSummary(eventId);
  const { context: setupContext } = useEventSetupProgress(eventId);

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

  const rankingsQuery = useQuery({
    queryKey: queryKeys.rankings.event(eventId),
    queryFn: () => fetchEventRankings(eventId!),
    enabled: Boolean(eventId) && enableRanking
  });

  const boardCount = structureQuery.data?.boardCount ?? 0;
  const eventScoreProgressQuery = useQuery({
    queryKey: queryKeys.scoring.eventProgress(eventId ?? null),
    queryFn: () => fetchEventScoreProgress(eventId!),
    enabled: Boolean(eventId) && enableScoring && boardCount > 0
  });
  const scoreProgress = eventScoreProgressQuery.data ?? null;

  const confirmedTeams = teamSummary?.confirmedCount ?? 0;
  const pendingTeams = teamSummary?.pendingCount ?? 0;
  const waitlistTeams = teamSummary?.waitlistCount ?? 0;
  const quota = detailQuery.data?.maxTeams ?? 0;

  const blockers: { text: string; to: string; label: string }[] = [];
  if (pendingTeams > 0) {
    blockers.push({
      text: `${pendingTeams} đội đang chờ duyệt.`,
      to: "/organizer/teams-hub",
      label: "Duyệt đăng ký"
    });
  }
  if (confirmedTeams > 0 && boardCount === 0) {
    blockers.push({
      text: "Đã có đội xác nhận — cần tạo bảng và gán đội.",
      to: "/organizer/boards",
      label: "Thiết lập bảng thi"
    });
  }
  if (boardCount > 0 && !setupContext.hasProblem) {
    blockers.push({
      text: "Chưa cấu hình đề thi cho bảng.",
      to: "/organizer/boards#board-step-problem",
      label: "Quản lý bảng thi"
    });
  }
  if (boardCount > 0 && enableScoring && !setupContext.hasRubric) {
    blockers.push({
      text: "Chưa thiết lập tiêu chí chấm.",
      to: "/organizer/boards#board-step-rubric",
      label: "Tiêu chí chấm"
    });
  }
  if (
    enableScoring &&
    setupContext.hasRubric &&
    scoreProgress &&
    scoreProgress.boardsWithoutJudges.length > 0
  ) {
    blockers.push({
      text: "Chưa phân công giám khảo cho bảng thi.",
      to: "/organizer/boards#board-step-staff",
      label: "Phân công GK"
    });
  }
  if (
    enableScoring &&
    scoreProgress &&
    scoreProgress.summary.expectedSheets > 0 &&
    scoreProgress.summary.completionPercent < 100
  ) {
    blockers.push({
      text: `Chấm điểm chưa hoàn tất (${scoreProgress.summary.completionPercent}%).`,
      to: "/organizer/results-hub#results-step-scoring",
      label: "Tiến độ chấm"
    });
  }
  if (enableRanking && rankingsQuery.data) {
    const needsRanking = rankingsQuery.data.boards.filter(
      (board) => !board.published && board.teamCount > 0
    );
    if (needsRanking.length > 0 && scoreProgress?.summary.completionPercent === 100) {
      blockers.push({
        text: `${needsRanking.length} bảng đã chấm xong nhưng chưa công bố kết quả.`,
        to: "/organizer/results-hub#results-step-publish",
        label: "Công bố kết quả"
      });
    }
    const uncaculated = rankingsQuery.data.boards.filter(
      (board) => board.teamCount > 0 && !board.calculatedAt && board.entries.length === 0
    );
    if (
      uncaculated.length > 0 &&
      setupContext.hasRubric &&
      scoreProgress?.summary.completionPercent === 100
    ) {
      blockers.push({
        text: "Một số bảng chưa tính xếp hạng.",
        to: "/organizer/results-hub#results-step-ranking",
        label: "Tính xếp hạng"
      });
    }
  }

  if (loading || detailQuery.isLoading) {
    return <ModuleSkeleton rows={4} />;
  }

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
            <OrganizerContextBar />
          </>
        }
      />

      {error ? (
        <RetryPanel message={error} onRetry={() => void refetchEvents()} />
      ) : null}

      <TermDashboardPanel />

      <SchedulerHealthPanel />

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

      {blockers.length > 0 ? (
        <section className="rounded-xl border border-warning-container bg-warning-container/20 p-lg">
          <h2 className="font-headline-sm text-on-surface">Điểm nghẽn</h2>
          <ul className="mt-sm space-y-sm">
            {blockers.map((blocker) => (
              <li
                key={`${blocker.to}-${blocker.label}`}
                className="flex flex-col gap-xs sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="font-body-sm text-on-surface">{blocker.text}</p>
                <Link to={blocker.to} className="font-label-md text-primary hover:underline">
                  {blocker.label} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
