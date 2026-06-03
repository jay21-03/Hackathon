import { Badge } from "../../components/ui/Badge";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoAiFindings, demoTeams, getTeamById } from "../../services/demoDataService";

export function AiReviewPage() {
  const team = demoTeams[0];
  const findings = demoAiFindings.filter((finding) => finding.teamId === team.id);

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Danh gia AI"
        title={`AI Review - ${team.name}`}
        description="AI Review chi la tham khao, khong anh huong ranking va diem chinh thuc."
        actions={<Badge tone="ai">Khong tinh ranking</Badge>}
      />
      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Diem goi y" value={`${team.aiReviewScore}/100`} helper="Tham khao" icon="psychology" tone="warning" />
        <StatCard label="Repository" value={team.repoUrl ? "Da cap nhat" : "Chua co"} helper={team.repoUrl} icon="code" tone="primary" />
        <StatCard label="Trang thai" value="Hoan tat" helper="Co the review thu cong neu can" icon="task_alt" tone="success" />
      </section>
      <section className="grid gap-md">
        {findings.map((finding) => {
          const owner = getTeamById(finding.teamId);
          return (
            <article key={finding.id} className="rounded-xl border border-outline-variant bg-surface-container p-lg">
              <div className="flex items-start justify-between gap-md">
                <div>
                  <h2 className="font-headline-sm text-on-surface">{finding.title}</h2>
                  <p className="mt-xs font-body-sm text-on-surface-variant">{finding.detail}</p>
                  <p className="mt-sm font-label-sm normal-case text-on-surface-variant">{owner?.name}</p>
                </div>
                <Badge tone={getStatusTone(finding.status)}>{getStatusLabel(finding.status)}</Badge>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
