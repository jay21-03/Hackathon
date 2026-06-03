import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import type { DemoAiFinding, DemoBoard, DemoTeam } from "../../services/readModelService";
import { fetchMentorDashboard } from "../../services/hackathonApi";

const severityTone = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger"
} as const;

export function MentorAiReviewPage() {
  const [data, setData] = useState<{ boards: DemoBoard[]; teams: DemoTeam[]; findings: DemoAiFinding[] } | null>(null);
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
        eyebrow="Danh gia AI cua mentor"
        title="Tin hieu AI cua doi phu trach"
        description="Mentor dung ket qua AI de goi y cai thien ky thuat. Ket qua nay khong thay the diem judge."
        actions={usingFallback ? <Badge tone="warning">Du lieu minh hoa</Badge> : <Badge tone="success">Du lieu he thong</Badge>}
      />

      {usingFallback ? (
        <div className="rounded-xl border border-primary/20 bg-primary-fixed p-md">
          <p className="font-body-sm text-on-surface-variant">
            Man hinh nay dang doc du lieu minh hoa. Khi backend AI review san sang, mentor se xem duoc ket qua thuc
            thay cho mock.
          </p>
        </div>
      ) : null}

      <section className="space-y-md">
        {data.findings.map((finding) => {
          const team = data.teams.find((item) => item.id === finding.teamId);
          return (
            <article key={finding.id} className="rounded-xl border border-outline-variant bg-surface-container p-lg">
              <div className="flex flex-col gap-sm md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="font-headline-sm text-on-surface">{finding.title}</h2>
                  <p className="font-body-sm text-on-surface-variant">{team?.name ?? `Team ${finding.teamId}`}</p>
                </div>
                <Badge tone={severityTone[finding.severity]}>{finding.severity}</Badge>
              </div>
              <p className="mt-md font-body-sm text-on-surface-variant">{finding.detail}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
