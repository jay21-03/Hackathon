import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoCheckIns, demoEvent, demoTeamMembers, demoTeams } from "../../services/readModelService";

export function TeamStatusPage() {
  const team = demoTeams[0];
  const members = demoTeamMembers.filter((member) => member.teamId === team.id);
  const confirmedMembers = members.filter((member) => member.status === "CONFIRMED").length;
  const checkIn = demoCheckIns.find((item) => item.teamId === team.id);
  const steps = [
    { label: "Dang ky doi", status: team.status, to: "/me/team" },
    { label: "Thanh vien xac nhan", status: confirmedMembers === members.length ? "CONFIRMED" : "PENDING", to: "/me/team" },
    { label: "Check-in", status: checkIn?.status ?? "DRAFT", to: "/me/check-in" },
    { label: "Cap nhat kho ma nguon", status: team.repoUrl ? "SUBMITTED" : "DRAFT", to: "/me/submission" },
    { label: "Xem ket qua", status: "PUBLISHED", to: "/me/results" }
  ];
  const completed = steps.filter((step) => ["CONFIRMED", "SUBMITTED", "PUBLISHED"].includes(step.status)).length;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Trang thai doi"
        title={team.name}
        description="Theo doi cac moc nghiep vu cua doi trong cuoc thi."
        actions={<Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>}
      />
      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <ProgressBar value={Math.round((completed / steps.length) * 100)} label="Tien do tong" />
        <div className="mt-lg grid gap-sm">
          {steps.map((step) => (
            <Link
              key={step.label}
              to={step.to}
              className="flex items-center justify-between gap-md rounded-lg border border-outline-variant bg-surface-container-low p-md hover:bg-surface-variant"
            >
              <div className="flex items-center gap-sm">
                <Icon name="task_alt" className="text-primary" />
                <div>
                  <p className="font-label-md text-on-surface">{step.label}</p>
                  <p className="font-body-sm text-on-surface-variant">{demoEvent.name}</p>
                </div>
              </div>
              <Badge tone={getStatusTone(step.status)}>{getStatusLabel(step.status)}</Badge>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
