import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { InvitationPanel } from "../../components/layout/InvitationPanel";
import { PageHeader } from "../../components/ui/PageHeader";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { confirmInvitation, declineInvitation, type TeamDetailResponse } from "../../services/registrationService";

export function TeamInvitationConfirmationPage() {
  const { notify } = useToast();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get("token");
  const [status, setStatus] = useState("PENDING");
  const [team, setTeam] = useState<TeamDetailResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function respond(nextStatus: "CONFIRMED" | "REJECTED") {
    if (!invitationToken) {
      notify("Liên kết lời mời không hợp lệ.", "danger");
      return;
    }
    setSubmitting(true);
    try {
      const response = nextStatus === "CONFIRMED"
        ? await confirmInvitation(invitationToken)
        : await declineInvitation(invitationToken);
      setTeam(response);
      setStatus(response.status ?? nextStatus);
      notify(nextStatus === "CONFIRMED" ? "Đã xác nhận tham gia đội." : "Đã từ chối lời mời.", "success");
    } catch {
      notify("Không thể xử lý lời mời.", "danger");
    } finally {
      setSubmitting(false);
    }
  }

  if (!invitationToken) {
    return (
      <InvitationPanel>
        <PageHeader
          eyebrow="Lời mời tham gia đội"
          title="Liên kết không hợp lệ"
          description="Vui lòng mở lời mời từ email hoặc trang trạng thái lời mời có token hợp lệ."
        />
        <ButtonLink to="/events" variant="secondary">
          Quay lại danh sách cuộc thi
        </ButtonLink>
      </InvitationPanel>
    );
  }

  return (
    <InvitationPanel>
      <PageHeader
        eyebrow="Lời mời tham gia đội"
        title={team?.name ?? "Xác nhận lời mời"}
        description="Xác nhận hoặc từ chối lời mời. Mỗi email chỉ được thuộc một đội trong cùng cuộc thi."
        actions={<Badge tone={getStatusTone(status)}>{getStatusLabel(status)}</Badge>}
      />

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="grid gap-md md:grid-cols-2">
          <div>
            <p className="font-label-sm normal-case text-on-surface-variant">Token lời mời</p>
            <p className="break-all font-body-sm text-on-surface">{invitationToken}</p>
          </div>
          <div>
            <p className="font-label-sm normal-case text-on-surface-variant">Đội thi</p>
            <p className="font-headline-sm text-on-surface">{team?.name ?? "Sẽ hiện sau khi xử lý"}</p>
            <p className="font-body-sm text-on-surface-variant">Trạng thái hiện tại: {getStatusLabel(status)}</p>
          </div>
        </div>

        {team?.members?.length ? (
          <div className="mt-md rounded-lg border border-outline-variant p-md">
            <p className="mb-sm font-label-md text-on-surface">Thành viên trong đội</p>
            <ul className="space-y-1 font-body-sm text-on-surface-variant">
              {team.members.map((member) => (
                <li key={member.id}>{member.fullName} - {member.email} ({getStatusLabel(member.status)})</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-lg flex flex-wrap gap-sm border-t border-outline-variant pt-md">
          <Button disabled={status === "CONFIRMED" || submitting} onClick={() => respond("CONFIRMED")}>
            Xác nhận tham gia
          </Button>
          <Button variant="secondary" disabled={status === "REJECTED" || submitting} onClick={() => respond("REJECTED")}>
            Từ chối lời mời
          </Button>
          <ButtonLink to="/me/team" variant="secondary" icon={<Icon name="groups" />}>
            Xem đội của tôi
          </ButtonLink>
        </div>
      </section>
    </InvitationPanel>
  );
}
