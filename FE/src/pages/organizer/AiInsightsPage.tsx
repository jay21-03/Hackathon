import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { StatCard } from "../../components/ui/StatCard";
import type { DemoTeam } from "../../services/demoDataService";
import { fetchAiReviewInsights } from "../../services/hackathonApi";

export function AiInsightsPage() {
  const [teams, setTeams] = useState<DemoTeam[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAiReviewInsights()
      .then((result) => {
        setTeams(result.data);
        setUsingFallback(result.usingFallback);
      })
      .finally(() => setLoading(false));
  }, []);

  const average = useMemo(() => {
    if (teams.length === 0) return 0;
    return Math.round(teams.reduce((sum, team) => sum + (team.aiReviewScore ?? 0), 0) / teams.length);
  }, [teams]);

  if (loading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="AI Insights"
        title="Tong hop ket qua AI Review"
        description="Hien thi tin hieu ky thuat de mentor va ban to chuc tham khao. Diem AI khong duoc cong vao ranking."
        actions={usingFallback ? <Badge tone="warning">Du lieu minh hoa</Badge> : <Badge tone="success">Du lieu he thong</Badge>}
      />

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Doi co kho ma nguon" value={teams.filter((team) => team.repoUrl).length} helper="San sang danh gia" icon="code" />
        <StatCard label="Diem AI trung binh" value={`${average}/100`} helper="Khong tinh ranking" icon="analytics" tone="warning" />
        <StatCard label="Bang thi" value={new Set(teams.map((team) => team.board)).size} helper="Da phan bo" icon="view_module" tone="success" />
      </section>

      <section className="space-y-md">
        {teams.map((team) => (
          <article key={team.id} className="rounded-xl border border-outline-variant bg-surface-container p-lg">
            <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-headline-sm text-on-surface">{team.name}</h2>
                <p className="font-body-sm text-on-surface-variant">{team.board} • {team.track}</p>
              </div>
              <Badge tone="ai">AI {team.aiReviewScore ?? 0}/100</Badge>
            </div>
            <div className="mt-md">
              <ProgressBar value={team.aiReviewScore ?? 0} />
            </div>
            <p className="mt-sm break-all font-body-sm text-on-surface-variant">{team.repoUrl ?? "Chua co kho ma nguon"}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
