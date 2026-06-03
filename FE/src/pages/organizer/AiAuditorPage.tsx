import { useEffect, useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import type { DemoAiFinding } from "../../services/demoDataService";
import { fetchAiReviewQueue } from "../../services/hackathonApi";

const severityTone = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger"
} as const;

export function AiAuditorPage() {
  const { notify } = useToast();
  const [findings, setFindings] = useState<DemoAiFinding[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAiReviewQueue()
      .then((result) => {
        setFindings(result.data);
        setUsingFallback(result.usingFallback);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ModuleSkeleton rows={4} />;

  const highRisk = findings.filter((item) => item.severity === "HIGH").length;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Danh gia AI"
        title="Giam sat hang doi AI Review"
        description="AI Review chi dung de ho tro phat hien rui ro, khong tu dong anh huong ranking."
        actions={
          <>
            {usingFallback ? <Badge tone="warning">Dang dung demo data</Badge> : <Badge tone="success">Da noi API</Badge>}
            <Button onClick={() => notify("Da yeu cau chay lai AI Review.", "success")}>Chay lai hang doi</Button>
          </>
        }
      />

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Finding" value={findings.length} helper="Can doc ket luan" icon="psychology" />
        <StatCard label="Rui ro cao" value={highRisk} helper="Can review thu cong" icon="warning" tone="danger" />
        <StatCard label="Trang thai" value="San sang" helper="Tu dong dung du lieu mau khi API chua san sang" icon="task_alt" tone="success" />
      </section>

      <section className="grid gap-md lg:grid-cols-2">
        {findings.map((finding) => (
          <article key={finding.id} className="rounded-xl border border-outline-variant bg-surface-container p-lg">
            <div className="flex flex-col gap-sm md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="font-headline-sm text-on-surface">{finding.title}</h2>
                <p className="mt-xs font-body-sm text-on-surface-variant">Team ID: {finding.teamId}</p>
              </div>
              <div className="flex gap-sm">
                <Badge tone={severityTone[finding.severity]}>{finding.severity}</Badge>
                <Badge tone={getStatusTone(finding.status)}>{getStatusLabel(finding.status)}</Badge>
              </div>
            </div>
            <p className="mt-md font-body-sm text-on-surface-variant">{finding.detail}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
