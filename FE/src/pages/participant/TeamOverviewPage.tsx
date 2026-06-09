import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthSession } from "../../auth/authSession";
import { Badge } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { useToast } from "../../components/feedback/ToastProvider";
import { EmptyState } from "../../components/ui/EmptyState";
import { TextField } from "../../components/ui/FormField";
import { Icon } from "../../components/ui/Icon";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { ParticipantWorkflowBar } from "../../components/participant/ParticipantWorkflowBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useMyTeam } from "../../hooks/useMyTeam";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { invalidateAfterTeamMutation } from "../../lib/invalidateAppQueries";
import { cancelPendingInvitation, inviteTeamMember, resendTeamInvitation } from "../../services/registrationService";
import { resolveApiError } from "../../utils/apiError";
import { canRegisterForEvent, mapRegistrationErrorMessage } from "../../utils/registrationErrors";

function buildMemberName(email: string) {
  const local = email.split("@")[0] ?? "";
  if (!local) return "Thành viên";
  return local
    .split(/[._-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isTeamCaptain(
  members: Array<{ contactPerson?: boolean; email: string }>,
  sessionEmail: string
) {
  const normalizedSession = sessionEmail.trim().toLowerCase();
  return members.some(
    (member) =>
      member.contactPerson && member.email.trim().toLowerCase() === normalizedSession
  );
}

function canResendInvitation(status: string, contactPerson?: boolean) {
  return !contactPerson && status !== "CONFIRMED";
}

function canCancelInvitation(status: string, contactPerson?: boolean) {
  return !contactPerson && status !== "CONFIRMED" && status !== "DECLINED";
}

export function TeamOverviewPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const session = getAuthSession();
  const { event, eventId, loading: eventLoading } = useActiveEvent();
  const { team, loading: teamLoading, error, refetch } = useMyTeam(eventId);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

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
  const minTeamSize = event?.minTeamSize ?? 1;
  const maxTeamSize = event?.maxTeamSize ?? 5;
  const registrationOpen = canRegisterForEvent(
    event?.status,
    event?.registrationStartAt,
    event?.registrationEndAt
  );
  const teamLocked =
    team.status === "REJECTED" || team.status === "DISQUALIFIED";
  const isCaptain = isTeamCaptain(members, session.email);
  const canManageInvites = isCaptain && registrationOpen && !teamLocked;
  const canAddMember = canManageInvites && members.length < maxTeamSize;
  const slotsRemaining = Math.max(maxTeamSize - members.length, 0);

  async function submitInvite(event: React.FormEvent) {
    event.preventDefault();
    const trimmedEmail = inviteEmail.trim();
    if (!trimmedEmail) {
      notify("Nhập email thành viên cần mời.", "warning");
      return;
    }

    setInviting(true);
    try {
      await inviteTeamMember(team.id, {
        email: trimmedEmail,
        fullName: buildMemberName(trimmedEmail)
      }, { idempotencyKey: `invite-${team.id}-${trimmedEmail.toLowerCase()}` });
      setInviteEmail("");
      await invalidateAfterTeamMutation(queryClient);
      await refetch();
      notify("Đã gửi lời mời thành viên.", "success");
    } catch (err) {
      const message = mapRegistrationErrorMessage(resolveApiError(err, "Mời thành viên thất bại."));
      notify(message, "danger");
    } finally {
      setInviting(false);
    }
  }

  async function resendMember(teamMemberId: number) {
    setResendingId(teamMemberId);
    try {
      await resendTeamInvitation(teamMemberId);
      await invalidateAfterTeamMutation(queryClient);
      await refetch();
      notify("Đã gửi lại lời mời.", "success");
    } catch (err) {
      const message = mapRegistrationErrorMessage(resolveApiError(err, "Gửi lại lời mời thất bại."));
      notify(message, "danger");
    } finally {
      setResendingId(null);
    }
  }

  async function cancelMember(teamMemberId: number) {
    setCancellingId(teamMemberId);
    try {
      await cancelPendingInvitation(team.id, teamMemberId);
      await invalidateAfterTeamMutation(queryClient);
      await refetch();
      notify("Đã huỷ lời mời thành viên.", "success");
    } catch (err) {
      const message = mapRegistrationErrorMessage(resolveApiError(err, "Huỷ lời mời thất bại."));
      notify(message, "danger");
    } finally {
      setCancellingId(null);
    }
  }

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
          <Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>
        }
      />

      <ParticipantWorkflowBar active="team" />

      <section className="grid gap-lg lg:grid-cols-[1fr_320px]">
        <article className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
          <div className="border-b border-outline-variant p-lg">
            <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-headline-sm text-on-surface">Thành viên</h2>
                <p className="font-body-sm text-on-surface-variant">
                  Đội hợp lệ khi có {minTeamSize}–{maxTeamSize} thành viên.
                </p>
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

          {canAddMember ? (
            <form
              onSubmit={(event) => void submitInvite(event)}
              className="border-b border-outline-variant bg-surface-container-low p-lg"
            >
              <h3 className="font-label-md text-on-surface">Mời thêm thành viên</h3>
              <p className="mt-xs font-body-sm text-on-surface-variant">
                Còn thêm được {slotsRemaining} thành viên. Mời gửi qua email.
              </p>
              <div className="mt-md flex flex-col gap-md sm:flex-row sm:items-end">
                <TextField
                  label="Email thành viên"
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="email@fpt.edu.vn"
                  className="flex-1"
                />
                <Button type="submit" loading={inviting} icon={<Icon name="person_add" />}>
                  Gửi lời mời
                </Button>
              </div>
            </form>
          ) : isCaptain && !registrationOpen && !teamLocked ? (
            <p className="border-b border-outline-variant bg-surface-container-low p-lg font-body-sm text-on-surface-variant">
              Cuộc thi đã đóng đăng ký — không thể mời thêm thành viên.
            </p>
          ) : isCaptain && members.length >= maxTeamSize ? (
            <p className="border-b border-outline-variant bg-surface-container-low p-lg font-body-sm text-on-surface-variant">
              Đội đã đủ {maxTeamSize} thành viên.
            </p>
          ) : null}

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
                  className="grid gap-sm p-md md:grid-cols-[1fr_120px_120px_auto]"
                >
                  <div className="min-w-0">
                    <p className="font-label-md text-on-surface">{member.fullName}</p>
                    <p className="truncate font-body-sm text-on-surface-variant">{member.email}</p>
                  </div>
                  <p className="font-body-sm text-on-surface-variant">
                    {member.contactPerson ? "Đội trưởng" : "Thành viên"}
                  </p>
                  <Badge tone={getStatusTone(member.status)}>{getStatusLabel(member.status)}</Badge>
                  {canManageInvites && canResendInvitation(member.status, member.contactPerson) ? (
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={resendingId === member.id || cancellingId === member.id}
                        onClick={() => void resendMember(member.id)}
                      >
                        Gửi lại
                      </Button>
                      {canCancelInvitation(member.status, member.contactPerson) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={resendingId === member.id || cancellingId === member.id}
                          onClick={() => void cancelMember(member.id)}
                        >
                          Huỷ mời
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
          )}
        </article>

        <aside className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
          <h2 className="font-headline-sm text-on-surface">Thông tin đội</h2>
          <div className="space-y-sm font-body-sm text-on-surface-variant">
            <p>Trạng thái: {getStatusLabel(team.status)}</p>
            <p>
              Thành viên: {members.length}/{maxTeamSize}
            </p>
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
