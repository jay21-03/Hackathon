import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoTeamMembers, demoTeams } from "../../services/demoDataService";

export function TeamOverviewPage() {
  const team = demoTeams[0];
  const members = demoTeamMembers.filter((member) => member.teamId === team.id);
  const confirmedMembers = members.filter((member) => member.status === "CONFIRMED").length;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Doi cua toi"
        title={team.name}
        description="Quan ly thanh vien, loi moi, trang thai xac nhan va thong tin bai nop cua doi."
        actions={
          <>
            <Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>
            <Link to="/team-invitations/status" className="btn-secondary inline-flex items-center gap-2">
              <Icon name="mail" className="text-[18px]" />
              Xem loi moi
            </Link>
          </>
        }
      />

      <section className="grid gap-lg lg:grid-cols-[1fr_320px]">
        <article className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
          <div className="border-b border-outline-variant p-lg">
            <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-headline-sm text-on-surface">Thanh vien</h2>
                <p className="font-body-sm text-on-surface-variant">
                  Doi hop le khi co 1-5 thanh vien.
                </p>
              </div>
              <Badge tone="success">{confirmedMembers}/{members.length} da xac nhan</Badge>
            </div>
            <div className="mt-md">
              <ProgressBar value={Math.round((confirmedMembers / Math.max(members.length, 1)) * 100)} />
            </div>
          </div>

          {members.length === 0 ? (
            <div className="p-lg">
              <EmptyState
                icon="groups"
                title="Chua co thanh vien"
                description="Them thanh vien bang email de gui loi moi xac nhan."
              />
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/60">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="grid gap-sm p-md md:grid-cols-[1fr_180px_140px]"
                >
                  <div className="min-w-0">
                    <p className="font-label-md text-on-surface">{member.fullName}</p>
                    <p className="truncate font-body-sm text-on-surface-variant">{member.email}</p>
                  </div>
                  <p className="font-body-sm text-on-surface-variant">{member.role}</p>
                  <Badge tone={getStatusTone(member.status)}>{getStatusLabel(member.status)}</Badge>
                </div>
              ))}
            </div>
          )}
        </article>

        <aside className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
          <h2 className="font-headline-sm text-on-surface">Thong tin doi</h2>
          <div className="space-y-sm font-body-sm text-on-surface-variant">
            <p>Bang thi: {team.board}</p>
            <p>Track: {team.track}</p>
            <p>Repository: {team.repoUrl ? "Da cap nhat" : "Chua cap nhat"}</p>
            <p>AI Review: {team.aiReviewScore}/100</p>
          </div>
          <Link to="/me/submission" className="btn-primary inline-flex w-full items-center justify-center gap-2">
            <Icon name="upload" className="text-[18px]" />
            Cap nhat bai nop
          </Link>
        </aside>
      </section>
    </div>
  );
}
