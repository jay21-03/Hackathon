import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useMyTeam } from "../../hooks/useMyTeam";
import { getStatusLabel, getStatusTone } from "../../domain/status";

export function TeamOverviewPage() {
  const { eventId, loading: eventLoading } = useActiveEvent();
  const { team, loading: teamLoading, error } = useMyTeam(eventId);

  if (eventLoading || teamLoading) {
    return <ModuleSkeleton rows={4} />;
  }

  if (!team) {
    return (
      <div className="space-y-lg">
        <PageHeader eyebrow="Đội của tôi" title="Chưa có đội" description="Đăng ký đội để tham gia cuộc thi." />
        {error ? (
          <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
            <p className="font-body-sm text-on-surface">{error}</p>
          </div>
        ) : null}
        <EmptyState
          icon="groups"
          title="Chưa có đội thi"
          description="Tạo đội mới hoặc xác nhận lời mời thành viên."
          action={
            <ButtonLink to="/register" className="mt-md">
              Đăng ký đội
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const members = team.members ?? [];
  const confirmedMembers = members.filter((member) => member.status === "CONFIRMED").length;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Đội của tôi"
        title={team.name}
        description="Quan ly thành viên, lời mời va trạng thái xác nhận cua doi."
        actions={
          <>
            <Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>
            <ButtonLink
              to="/team-invitations/status"
              variant="secondary"
              icon={<Icon name="mail" className="text-[18px]" />}
            >
              Xem lời mời
            </ButtonLink>
          </>
        }
      />

      <section className="grid gap-lg lg:grid-cols-[1fr_320px]">
        <article className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
          <div className="border-b border-outline-variant p-lg">
            <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-headline-sm text-on-surface">Thành viên</h2>
                <p className="font-body-sm text-on-surface-variant">Đội hợp lệ khi có 1-5 thành viên.</p>
              </div>
              <Badge tone="success">
                {confirmedMembers}/{members.length} da xác nhận
              </Badge>
            </div>
            <div className="mt-md">
              <ProgressBar
                value={Math.round((confirmedMembers / Math.max(members.length, 1)) * 100)}
              />
            </div>
          </div>

          {members.length === 0 ? (
            <div className="p-lg">
              <EmptyState
                icon="groups"
                title="Chưa có thành viên"
                description="Thêm thành viên bằng email khi đăng ký đội."
              />
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/60">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="grid gap-sm p-md md:grid-cols-[1fr_140px_120px]"
                >
                  <div className="min-w-0">
                    <p className="font-label-md text-on-surface">{member.fullName}</p>
                    <p className="truncate font-body-sm text-on-surface-variant">{member.email}</p>
                  </div>
                  <p className="font-body-sm text-on-surface-variant">
                    {member.contactPerson ? "Người liên hệ" : "Thành viên"}
                  </p>
                  <Badge tone={getStatusTone(member.status)}>{getStatusLabel(member.status)}</Badge>
                </div>
              ))}
            </div>
          )}
        </article>

        <aside className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
          <h2 className="font-headline-sm text-on-surface">Thông tin doi</h2>
          <div className="space-y-sm font-body-sm text-on-surface-variant">
            <p>Ma doi: #{team.id}</p>
            <p>Trạng thái: {getStatusLabel(team.status)}</p>
            {team.confirmedAt ? (
              <p>Xac nhan luc: {new Date(team.confirmedAt).toLocaleString("vi-VN")}</p>
            ) : null}
            {team.rejectedReason ? <p>Ly do: {team.rejectedReason}</p> : null}
          </div>
        </aside>
      </section>
    </div>
  );
}
