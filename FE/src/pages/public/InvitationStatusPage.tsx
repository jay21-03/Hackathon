import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoTeamMembers, getTeamById } from "../../services/readModelService";

const invitationRows = demoTeamMembers.map((member, index) => ({
  ...member,
  status: index === 3 ? "PENDING" : member.status,
  expiresAt: index === 3 ? "2026-07-05T23:59:00+07:00" : "2026-07-01T23:59:00+07:00"
}));

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

export function InvitationStatusPage() {
  const team = getTeamById(invitationRows[0].teamId);
  const confirmed = invitationRows.filter((row) => row.status === "CONFIRMED").length;

  return (
    <div className="mx-auto max-w-5xl space-y-lg">
      <PageHeader
        eyebrow="Trang thai loi moi"
        title={team?.name ?? "Doi thi"}
        description="Theo doi thanh vien da xac nhan, dang cho phan hoi hoac da tu choi loi moi."
        actions={<Badge tone={confirmed === invitationRows.length ? "success" : "warning"}>{confirmed}/{invitationRows.length} da xac nhan</Badge>}
      />

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="table-header-bg">
              <tr className="font-label-sm text-on-surface-variant">
                <th className="px-md py-sm">Thanh vien</th>
                <th className="px-md py-sm">Email</th>
                <th className="px-md py-sm">Vai tro</th>
                <th className="px-md py-sm">Han phan hoi</th>
                <th className="px-md py-sm">Trang thai</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {invitationRows.map((row) => (
                <tr key={row.id} className="font-body-sm text-on-surface">
                  <td className="px-md py-md font-label-md">{row.fullName}</td>
                  <td className="px-md py-md break-all">{row.email}</td>
                  <td className="px-md py-md">{row.role}</td>
                  <td className="px-md py-md">{formatDate(row.expiresAt)}</td>
                  <td className="px-md py-md">
                    <Badge tone={getStatusTone(row.status)}>{getStatusLabel(row.status)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ButtonLink to="/team-invitation" variant="secondary" icon={<Icon name="mail" />}>
        Mo loi moi
      </ButtonLink>
    </div>
  );
}
