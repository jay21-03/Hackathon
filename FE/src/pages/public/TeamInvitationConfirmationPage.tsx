import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
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
      notify("Lien ket loi moi khong hop le.", "danger");
      return;
    }
    setSubmitting(true);
    try {
      const response = nextStatus === "CONFIRMED"
        ? await confirmInvitation(invitationToken)
        : await declineInvitation(invitationToken);
      setTeam(response);
      setStatus(response.status ?? nextStatus);
      notify(nextStatus === "CONFIRMED" ? "Da xac nhan tham gia doi." : "Da tu choi loi moi.", "success");
    } catch {
      notify("Khong the xu ly loi moi.", "danger");
    } finally {
      setSubmitting(false);
    }
  }

  if (!invitationToken) {
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
        title={team?.name ?? "Xac nhan loi moi"}
        description="Xac nhan hoac tu choi loi moi. Moi email chi duoc thuoc mot doi trong cung cuoc thi."
        actions={<Badge tone={getStatusTone(status)}>{getStatusLabel(status)}</Badge>}
      />

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <div className="grid gap-md md:grid-cols-2">
          <div>
            <p className="font-label-sm normal-case text-on-surface-variant">Token loi moi</p>
            <p className="break-all font-body-sm text-on-surface">{invitationToken}</p>
          </div>
          <div>
            <p className="font-label-sm normal-case text-on-surface-variant">Doi thi</p>
            <p className="font-headline-sm text-on-surface">{team?.name ?? "Se hien sau khi xu ly"}</p>
            <p className="font-body-sm text-on-surface-variant">Trang thai hien tai: {getStatusLabel(status)}</p>
          </div>
        </div>

        {team?.members?.length ? (
          <div className="mt-md rounded-lg border border-outline-variant p-md">
            <p className="mb-sm font-label-md text-on-surface">Thanh vien trong doi</p>
            <ul className="space-y-1 font-body-sm text-on-surface-variant">
              {team.members.map((member) => (
                <li key={member.id}>{member.fullName} - {member.email} ({getStatusLabel(member.status)})</li>
              ))}
            </ul>
          </div>
        ) : null}

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
