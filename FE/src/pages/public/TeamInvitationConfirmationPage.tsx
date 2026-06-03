import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoTeamMembers, getTeamById } from "../../services/readModelService";
import { confirmInvitation, declineInvitation } from "../../services/registrationService";

export function TeamInvitationConfirmationPage() {
  const { notify } = useToast();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get("token");
  const member = invitationToken ? demoTeamMembers.find((item) => item.status === "PENDING") ?? null : null;
  const team = member ? getTeamById(member.teamId) : null;
  const [status, setStatus] = useState(member?.status ?? "PENDING");
  const [submitting, setSubmitting] = useState(false);

  async function respond(nextStatus: "CONFIRMED" | "REJECTED") {
    if (!invitationToken) {
      notify("Lien ket loi moi khong hop le.", "danger");
      return;
    }
    setSubmitting(true);
    try {
      const response = nextStatus === "CONFIRMED"
        ? await confirmInvitation(invitationToken)
        : await declineInvitation(invitationToken);
      setStatus(nextStatus);
      if (!response.usingFallback && response.data?.status) {
        setStatus(response.data.status);
      }
      notify(nextStatus === "CONFIRMED" ? "Da xac nhan tham gia doi." : "Da tu choi loi moi.", "success");
    } catch {
      notify("Khong the xu ly loi moi.", "danger");
    } finally {
      setSubmitting(false);
    }
  }

  if (!member) {
    return (
      <div className="mx-auto max-w-3xl space-y-lg">
        <PageHeader
          eyebrow="Loi moi tham gia doi"
          title="Lien ket khong hop le"
          description="Vui long mo loi moi tu email hoac trang thai loi moi co token hop le."
        />
        <ButtonLink to="/events" variant="secondary">
          Quay lai danh sach cuoc thi
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-lg">
      <PageHeader
        eyebrow="Loi moi tham gia doi"
        title={team?.name ?? "Doi thi"}
        description="Xac nhan hoac tu choi loi moi. Moi email chi duoc thuoc mot doi trong cung cuoc thi."
        actions={<Badge tone={getStatusTone(status)}>{getStatusLabel(status)}</Badge>}
      />

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="grid gap-md md:grid-cols-2">
          <div>
            <p className="font-label-sm normal-case text-on-surface-variant">Thanh vien</p>
            <p className="font-headline-sm text-on-surface">{member.fullName}</p>
            <p className="break-all font-body-sm text-on-surface-variant">{member.email}</p>
          </div>
          <div>
            <p className="font-label-sm normal-case text-on-surface-variant">Vai tro trong doi</p>
            <p className="font-headline-sm text-on-surface">{member.role}</p>
            <p className="font-body-sm text-on-surface-variant">Trang thai hien tai: {getStatusLabel(status)}</p>
          </div>
        </div>

        <div className="mt-lg flex flex-wrap gap-sm border-t border-outline-variant pt-md">
          <Button disabled={status === "CONFIRMED" || submitting} onClick={() => respond("CONFIRMED")}>
            Xac nhan tham gia
          </Button>
          <Button variant="secondary" disabled={status === "REJECTED" || submitting} onClick={() => respond("REJECTED")}>
            Tu choi loi moi
          </Button>
          <ButtonLink to="/team-invitations/status" variant="secondary" icon={<Icon name="fact_check" />}>
            Xem trang thai
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
