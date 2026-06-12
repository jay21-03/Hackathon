import { useQuery } from "@tanstack/react-query";
import { useActiveTerm } from "../../hooks/useActiveTerm";
import { queryKeys } from "../../lib/queryKeys";
import { fetchTermDashboard } from "../../services/academicTermService";
import { ModuleSkeleton } from "../ui/ModuleSkeleton";
import { StatCard } from "../ui/StatCard";

interface TermDashboardPanelProps {
  termId?: number | null;
}

export function TermDashboardPanel({ termId: termIdOverride }: TermDashboardPanelProps = {}) {
  const activeTerm = useActiveTerm();
  const termId = termIdOverride ?? activeTerm.termId;
  const enabled = termIdOverride != null ? true : activeTerm.enabled;
  const term = termIdOverride != null ? null : activeTerm.term;

  const dashboardQuery = useQuery({
    queryKey: [...queryKeys.academicTerms.detail(termId), "dashboard"],
    queryFn: () => fetchTermDashboard(termId!),
    enabled: enabled && termId != null
  });

  if (!enabled || !termId) {
    return null;
  }

  const stats = dashboardQuery.data;

  return (
    <section className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
      <div>
        <h2 className="font-headline-sm text-on-surface">Tổng quan học kỳ</h2>
        <p className="font-body-sm text-on-surface-variant">
          {stats
            ? `${stats.academicTerm.code} — toàn bộ cuộc thi trong kỳ`
            : term
              ? `${term.code}`
              : "Đang tải số liệu kỳ…"}
        </p>
      </div>
      {dashboardQuery.isLoading ? (
        <ModuleSkeleton rows={2} />
      ) : stats ? (
        <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Cuộc thi" value={stats.eventCount} icon="event" />
          <StatCard label="Đội" value={stats.teamCount} icon="groups" tone="success" />
          <StatCard label="Thí sinh" value={stats.participantCount} icon="person" />
          <StatCard label="Mentor" value={stats.mentorCount} icon="school" />
          <StatCard label="Giám khảo" value={stats.judgeCount} icon="gavel" />
          <StatCard label="Xếp hạng" value={stats.rankingCount} icon="leaderboard" />
          <StatCard label="Repository" value={stats.repositoryCount} icon="source" />
          <StatCard label="Phiếu chấm" value={stats.scoreSheetCount} icon="fact_check" />
        </div>
      ) : (
        <p className="font-body-sm text-on-surface-variant">Chưa tải được số liệu học kỳ.</p>
      )}
    </section>
  );
}
