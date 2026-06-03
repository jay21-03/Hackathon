import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { PageHeader } from "../../components/ui/PageHeader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { StatCard } from "../../components/ui/StatCard";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import {
  demoEvent,
  demoScoreSheets,
  demoTeams,
  organizerActivities
} from "../../services/readModelService";

export function OrganizerOverviewPage() {
  const confirmedTeams = demoTeams.filter((team) => team.status === "CONFIRMED").length;
  const waitlistTeams = demoTeams.filter((team) => team.status === "WAITLIST").length;
  const submittedScores = demoScoreSheets.filter((sheet) => sheet.status === "SUBMITTED").length;
  const draftScores = demoScoreSheets.filter((sheet) => sheet.status === "DRAFT").length;
  const scoringProgress = Math.round((submittedScores / demoScoreSheets.length) * 100);

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Tong quan ban to chuc"
        title={demoEvent.name}
        description="Theo doi dang ky, check-in, cham diem, xep hang va cong bo ket qua trong mot dashboard gon."
        actions={
          <>
            <Badge tone={getStatusTone(demoEvent.status)}>{getStatusLabel(demoEvent.status)}</Badge>
          </>
        }
      />

      <section className="grid gap-md md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Doi xac nhan"
          value={confirmedTeams}
          helper={`${waitlistTeams} doi dang o danh sach cho`}
          icon="groups"
          tone="success"
        />
        <StatCard
          label="Quota dang ky"
          value={`${demoEvent.confirmedTeams}/${demoEvent.quota}`}
          helper="Sap day quota, can theo doi waitlist"
          icon="fact_check"
          tone="warning"
        >
          <ProgressBar value={Math.round((demoEvent.confirmedTeams / demoEvent.quota) * 100)} />
        </StatCard>
        <StatCard
          label="Cham diem"
          value={`${submittedScores}/${demoScoreSheets.length}`}
          helper={`${draftScores} ban nhap chua tinh diem`}
          icon="gavel"
          tone="primary"
        >
          <ProgressBar value={scoringProgress} />
        </StatCard>
        <StatCard
          label="Danh gia AI"
          value="Tham khao"
          helper="Khong anh huong xep hang"
          icon="psychology"
          tone="warning"
        />
      </section>

      <WorkflowSteps
        title="Thu tu van hanh cuoc thi"
        description="Cac man lien quan duoc xep theo dung dong nghiep vu de ban to chuc khong phai nhay qua lai."
        steps={[
          {
            label: "Thiet lap",
            detail: "Cau hinh cuoc thi, de thi va tieu chi cham.",
            state: "done"
          },
          {
            label: "Dang ky",
            detail: "Duyet doi, loi moi thanh vien va danh sach cho.",
            state: waitlistTeams > 0 ? "active" : "done"
          }
        ]}
      />

      <section className="grid gap-lg xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-headline-sm text-on-surface">Can xu ly tiep</h2>
              <p className="font-body-sm text-on-surface-variant">
                Cac khu vuc nghiep vu can ban to chuc theo doi trong ngay thi.
              </p>
            </div>
            <Link to="/organizer/registrations" className="font-label-md text-primary">
              Xem dang ky
            </Link>
          </div>
          <div className="mt-md grid gap-sm md:grid-cols-2">
            {[
              ["Duyet dang ky", `${waitlistTeams} doi trong danh sach cho`],
              ["Quan ly cuoc thi", "Cuoc thi va danh sach nguoi dung da giong api" ]
            ].map(([title, detail]) => (
              <div
                key={title}
                className="rounded-lg border border-outline-variant bg-surface-container-low p-md"
              >
                <p className="font-label-md text-on-surface">{title}</p>
                <p className="mt-xs font-body-sm text-on-surface-variant">{detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <h2 className="font-headline-sm text-on-surface">Hoat dong gan day</h2>
          <div className="mt-md space-y-sm">
            {organizerActivities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-lg border border-outline-variant bg-surface-container-low p-md"
              >
                <div className="flex items-start justify-between gap-sm">
                  <p className="font-label-md text-on-surface">{activity.title}</p>
                  <Badge tone={getStatusTone(activity.status)}>
                    {getStatusLabel(activity.status)}
                  </Badge>
                </div>
                <p className="mt-xs font-body-sm text-on-surface-variant">{activity.detail}</p>
                <p className="mt-sm font-label-sm normal-case text-on-surface-variant">
                  {activity.time}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
