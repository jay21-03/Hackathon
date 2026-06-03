import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/ui/Icon";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import type { DemoScoreSheet, DemoTeam } from "../../services/readModelService";
import { fetchJudgeDashboard } from "../../services/hackathonApi";

export function JudgeDashboardPage() {
  const [data, setData] = useState<{ teams: DemoTeam[]; scoreSheets: DemoScoreSheet[] } | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJudgeDashboard()
      .then((result) => {
        setData(result.data);
        setUsingFallback(result.usingFallback);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <ModuleSkeleton rows={4} />;

  const submitted = data.scoreSheets.filter((sheet) => sheet.status === "SUBMITTED").length;
  const draft = data.scoreSheets.filter((sheet) => sheet.status === "DRAFT").length;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Giam khao"
        title="Doi thi can cham"
        description="Giam khao chi cham doi thuoc bang da phan cong. Diem phai duoc submit chinh thuc moi tinh ranking."
        actions={usingFallback ? <Badge tone="warning">Du lieu minh hoa</Badge> : <Badge tone="success">Du lieu he thong</Badge>}
      />

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Doi trong bang" value={data.teams.length} helper="Duoc phep cham" icon="groups" />
        <StatCard label="Da submit" value={submitted} helper="Tinh ranking" icon="task_alt" tone="success" />
        <StatCard label="Ban nhap" value={draft} helper="Chua tinh diem" icon="edit_note" tone="warning" />
      </section>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="table-header-bg">
              <tr className="font-label-sm text-on-surface-variant">
                <th className="px-md py-sm">Doi thi</th>
                <th className="px-md py-sm">Bang</th>
                <th className="px-md py-sm">Track</th>
                <th className="px-md py-sm">Trang thai doi</th>
                <th className="px-md py-sm">Thao tac</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {data.teams.map((team) => (
                <tr key={team.id} className="font-body-sm text-on-surface">
                  <td className="px-md py-md font-label-md">{team.name}</td>
                  <td className="px-md py-md">{team.board}</td>
                  <td className="px-md py-md">{team.track}</td>
                  <td className="px-md py-md">
                    <Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>
                  </td>
                  <td className="px-md py-md">
                    <Link to="/judge/scoring" className="btn-secondary inline-flex items-center gap-2">
                      <Icon name="gavel" />
                      Cham diem
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
