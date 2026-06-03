import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { demoEvent, getRankingRows } from "../../services/demoDataService";

export function ExportSuccessPage() {
  const rows = getRankingRows();
  const exportedAt = new Date().toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Xuat ket qua"
        title="Da tao file export"
        description="Ban export duoc tao tu ranking hien tai, chi tinh score sheet da submit."
        actions={<Badge tone="success">Hoan tat</Badge>}
      />

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Cuoc thi" value={demoEvent.name} helper="Nguon export" icon="emoji_events" />
        <StatCard label="So doi" value={rows.length} helper="Co trong bang xep hang" icon="groups" tone="success" />
        <StatCard label="Thoi gian tao" value={exportedAt} helper="Theo may local" icon="schedule" tone="warning" />
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-headline-sm text-on-surface">results-seal-hackathon-2026.csv</h2>
            <p className="mt-xs font-body-sm text-on-surface-variant">
              Ban xem truoc san sang cho luong export. Khi co du lieu he thong, nut tai se lay file CSV/PDF that.
            </p>
          </div>
          <div className="flex flex-wrap gap-sm">
            <Button icon={<Icon name="download" />}>Tai file</Button>
            <Link to="/organizer/ranking" className="btn-secondary inline-flex items-center gap-2">
              <Icon name="leaderboard" />
              Ve ranking
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
