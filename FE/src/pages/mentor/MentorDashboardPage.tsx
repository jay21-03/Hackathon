import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { StatCard } from "../../components/ui/StatCard";
import { fetchMentorDashboard } from "../../services/hackathonApi";
import type { DemoAiFinding, DemoBoard, DemoTeam } from "../../services/readModelService";

export function MentorDashboardPage() {
  const [data, setData] = useState<{
    boards: DemoBoard[];
    teams: DemoTeam[];
    findings: DemoAiFinding[];
  } | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentorDashboard()
      .then((result) => {
        setData(result.data);
        setUsingFallback(result.usingFallback);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Mentor"
        title="Doi thi duoc phu trach"
        description="Mentor theo doi tien do kho ma nguon, danh gia AI va ho tro doi trong bang duoc phan cong."
        actions={
          usingFallback ? (
            <Badge tone="warning">Du lieu minh hoa</Badge>
          ) : (
            <Badge tone="success">Du lieu he thong</Badge>
          )
        }
      />

      {usingFallback ? (
        <div className="rounded-xl border border-primary/20 bg-primary-fixed p-md">
          <p className="font-body-sm text-on-surface-variant">
            Dashboard mentor hien dang hien thi du lieu minh hoa. Khi backend mentor san sang, cac card va kho ma nguon
            se lay truc tiep tu he thong.
          </p>
        </div>
      ) : null}

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Bang phu trach" value={data.boards.length} helper="Theo phan cong BTC" icon="view_module" />
        <StatCard label="Doi thi" value={data.teams.length} helper="Can theo doi" icon="groups" tone="success" />
        <StatCard
          label="Can xem AI"
          value={data.findings.filter((item) => item.severity === "HIGH").length}
          helper="Rui ro cao"
          icon="psychology"
          tone="warning"
        />
      </section>

      <section className="grid gap-md lg:grid-cols-2">
        {data.teams.map((team) => (
          <article key={team.id} className="rounded-xl border border-outline-variant bg-surface-container p-lg">
            <div className="flex flex-col gap-sm md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="font-headline-sm text-on-surface">{team.name}</h2>
                <p className="font-body-sm text-on-surface-variant">
                  {team.board} - {team.track}
                </p>
              </div>
              <Badge tone="ai">AI {team.aiReviewScore ?? 0}/100</Badge>
            </div>
            <div className="mt-md">
              <ProgressBar value={team.aiReviewScore ?? 0} />
            </div>
            <p className="mt-sm break-all font-body-sm text-on-surface-variant">
              {team.repoUrl ?? "Chua co kho ma nguon"}
            </p>
          </article>
        ))}
      </section>

      <ButtonLink to="/mentor/ai-review" variant="secondary" icon={<Icon name="psychology" />}>
        Xem chi tiet danh gia AI
      </ButtonLink>
    </div>
  );
}
