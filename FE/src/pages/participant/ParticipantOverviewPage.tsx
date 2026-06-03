import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { StatCard } from "../../components/ui/StatCard";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import {
  demoEvent,
  demoScoreSheets,
  demoTeams,
  participantActivities
} from "../../services/demoDataService";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function ParticipantOverviewPage() {
  const team = demoTeams[0];
  const submittedSheets = demoScoreSheets.filter(
    (sheet) => sheet.teamId === team.id && sheet.status === "SUBMITTED"
  ).length;
  const readiness = 80;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Tong quan thi sinh"
        title={team.name}
        description="Theo doi trang thai doi, bang thi, check-in, bai nop va nhan xet AI trong mot man hinh gon."
        actions={
          <>
            <Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>
            <Link to="/me/submission" className="btn-primary inline-flex items-center gap-2">
              <Icon name="upload" className="text-[18px]" />
              Nop bai
            </Link>
          </>
        }
      />

      <section className="grid gap-md md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bang thi" value={team.board} helper={team.track} icon="grid_view" />
        <StatCard
          label="Check-in"
          value={getStatusLabel(team.checkInStatus)}
          helper="Khong chan quyen xem de thi"
          icon="how_to_reg"
          tone="success"
        />
        <StatCard
          label="AI Review"
          value={`${team.aiReviewScore}/100`}
          helper="Chi dung de tham khao"
          icon="psychology"
          tone="warning"
        />
        <StatCard
          label="Phieu cham submit"
          value={`${submittedSheets}/3`}
          helper="Ranking chi tinh diem da submit"
          icon="gavel"
          tone="primary"
        />
      </section>

      <section className="grid gap-lg xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-headline-sm text-on-surface">Tien do san sang</h2>
              <p className="font-body-sm text-on-surface-variant">
                Cac moc can hoan thanh truoc khi ban to chuc tinh ranking.
              </p>
            </div>
            <Badge tone="success">{readiness}% san sang</Badge>
          </div>
          <div className="mt-md">
            <ProgressBar value={readiness} label="Muc san sang" />
          </div>
          <div className="mt-lg grid gap-sm md:grid-cols-2">
            {[
              ["Dang ky doi", team.status],
              ["Check-in", team.checkInStatus ?? "PENDING"],
              ["Repository", team.repoUrl ? "SUBMITTED" : "DRAFT"],
              ["De thi mo luc", demoEvent.releaseAt]
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-outline-variant bg-surface-container-low p-md"
              >
                <p className="font-label-sm normal-case text-on-surface-variant">{label}</p>
                <p className="mt-xs font-label-md text-on-surface">
                  {String(value).includes("T")
                    ? formatDateTime(String(value))
                    : getStatusLabel(String(value))}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <h2 className="font-headline-sm text-on-surface">Hoat dong gan day</h2>
          <div className="mt-md space-y-sm">
            {participantActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex gap-sm rounded-lg border border-outline-variant bg-surface-container-low p-md"
              >
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-sm">
                    <p className="font-label-md text-on-surface">{activity.title}</p>
                    <span className="font-label-sm normal-case text-on-surface-variant">
                      {activity.time}
                    </span>
                  </div>
                  <p className="mt-xs font-body-sm text-on-surface-variant">{activity.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
