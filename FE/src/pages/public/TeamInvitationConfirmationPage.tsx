import { useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoTeamMembers, getTeamById } from "../../services/readModelService";

export function TeamInvitationConfirmationPage() {
  const { notify } = useToast();
  const member = demoTeamMembers.find((item) => item.status === "PENDING") ?? demoTeamMembers[0];
  const team = getTeamById(member.teamId);
  const [status, setStatus] = useState(member.status);

  function respond(nextStatus: "CONFIRMED" | "REJECTED") {
    setStatus(nextStatus);
    notify(nextStatus === "CONFIRMED" ? "Da xac nhan tham gia doi." : "Da tu choi loi moi.", "success");
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
          <Button disabled={status === "CONFIRMED"} onClick={() => respond("CONFIRMED")}>
            Xac nhan tham gia
          </Button>
          <Button variant="secondary" disabled={status === "REJECTED"} onClick={() => respond("REJECTED")}>
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
