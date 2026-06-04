import { Link } from "react-router-dom";
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
  const { event, eventId, loading: eventLoading } = useActiveEvent();
  const { team, loading: teamLoading, error } = useMyTeam(eventId);

  if (eventLoading || teamLoading) {
    return <ModuleSkeleton rows={4} />;
  }

  if (!team) {
    return (
      <div className="space-y-lg">
        <PageHeader
          eyebrow="Đội của tôi"
          title="Chưa có đội"
          description="Xem chi tiết cuộc thi để đăng ký hoặc chọn cuộc thi khác."
        />
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
            <ButtonLink
              to={eventId ? `/events/${eventId}` : "/events"}
              className="mt-md"
            >
              {eventId ? "Xem chi tiết cuộc thi" : "Danh sách các cuộc thi"}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const members = team.members ?? [];
  const confirmedMembers = members.filter((member) => member.status === "CONFIRMED").length;
  const progressSteps = [
    { label: "Đăng ký đội", status: team.status, to: "/me/team" as const },
    {
      label: "Thành viên xác nhận",
      status:
        confirmedMembers === members.length && members.length > 0 ? "CONFIRMED" : "PENDING",
      to: "/me/team" as const
    },
    {
      label: "Phân công bảng",
      status: team.status === "CONFIRMED" ? "CONFIRMED" : "PENDING",
      to: "/me/board" as const
    }
  ];
  const completedSteps = progressSteps.filter((step) => step.status === "CONFIRMED").length;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Đội của tôi"
        title={team.name}
        description={
          event?.name
            ? `${event.name} — thành viên, trạng thái và tiến độ chuẩn bị.`
            : "Quản lý thành viên, lời mời và trạng thái xác nhận của đội."
        }
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
                <p className="font-body-sm text-on-surface-variant">Đội hợp lệ khi có 1–5 thành viên.</p>
              </div>
              <Badge tone="success">
                {confirmedMembers}/{members.length} đã xác nhận
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
          <h2 className="font-headline-sm text-on-surface">Thông tin đội</h2>
          <div className="space-y-sm font-body-sm text-on-surface-variant">
            <p>Mã đội: #{team.id}</p>
            <p>Trạng thái: {getStatusLabel(team.status)}</p>
            {team.confirmedAt ? (
              <p>Xác nhận lúc: {new Date(team.confirmedAt).toLocaleString("vi-VN")}</p>
            ) : null}
            {team.rejectedReason ? <p>Lý do: {team.rejectedReason}</p> : null}
          </div>
        </aside>
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <h2 className="font-headline-sm text-on-surface">Tiến độ đội</h2>
        <p className="mt-xs font-body-sm text-on-surface-variant">
          Các mốc cần hoàn tất trước khi vào bảng thi và đề.
        </p>
        <div className="mt-md">
          <ProgressBar
            value={Math.round((completedSteps / progressSteps.length) * 100)}
            label="Tiến độ tổng"
          />
        </div>
        <div className="mt-lg grid gap-sm">
          {progressSteps.map((step) => (
            <Link
              key={step.label}
              to={step.to}
              className="flex items-center justify-between gap-md rounded-lg border border-outline-variant bg-surface-container-low p-md hover:bg-surface-variant"
            >
              <div className="flex items-center gap-sm">
                <Icon name="task_alt" className="text-primary" />
                <p className="font-label-md text-on-surface">{step.label}</p>
              </div>
              <Badge tone={getStatusTone(step.status)}>{getStatusLabel(step.status)}</Badge>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
