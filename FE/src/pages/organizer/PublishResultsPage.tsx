import { useEffect, useState } from "react";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import type { demoScoreSheets, getRankingRows } from "../../services/demoDataService";
import { fetchPublishPreview } from "../../services/hackathonApi";

type PublishPreview = {
  rankings: ReturnType<typeof getRankingRows>;
  submittedSheets: typeof demoScoreSheets;
};

export function PublishResultsPage() {
  const { notify } = useToast();
  const [preview, setPreview] = useState<PublishPreview | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublishPreview()
      .then((result) => {
        setPreview(result.data);
        setUsingFallback(result.usingFallback);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !preview) return <ModuleSkeleton rows={4} />;

  const readyTeams = preview.rankings.filter((row) => row.averageScore !== null);
  const topTeam = preview.rankings[0]?.team.name ?? "Chua co";

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Cong bo ket qua"
        title="Xac nhan public ket qua"
        description="Ket qua chi hien tren public portal sau khi ban to chuc xac nhan cong bo. Ranking chi lay score sheet da submit."
        actions={usingFallback ? <Badge tone="warning">Dang dung demo data</Badge> : <Badge tone="success">Da noi API</Badge>}
      />

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Doi co diem hop le" value={readyTeams.length} helper="Co score sheet da submit" icon="verified" tone="success" />
        <StatCard label="Phieu da submit" value={preview.submittedSheets.length} helper="Duoc tinh ranking" icon="task_alt" />
        <StatCard label="Hang 1 tam thoi" value={topTeam} helper="Truoc khi public" icon="leaderboard" tone="warning" />
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-headline-sm text-on-surface">Trang thai cong bo</h2>
            <p className="mt-xs font-body-sm text-on-surface-variant">
              {published ? "Ket qua da san sang hien thi ngoai public portal." : "Ket qua van dang o ban nhap noi bo."}
            </p>
          </div>
          <Badge tone={published ? "active" : "neutral"}>{published ? "Da cong bo" : "Ban nhap"}</Badge>
        </div>
        <ConfirmAction
          title="Cong bo ket qua?"
          message="Sau khi cong bo, public portal va thi sinh se xem duoc bang xep hang hien tai."
          confirmLabel="Cong bo"
          onConfirm={() => {
            setPublished(true);
            notify("Da cong bo ket qua.", "success");
          }}
        >
          <Button className="mt-lg" disabled={published} data-testid="publish-results-button">Cong bo ket qua</Button>
        </ConfirmAction>
      </section>
    </div>
  );
}
