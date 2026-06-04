import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { fetchMyTeams } from "../../services/registrationService";
import { useActiveEvent } from "../../hooks/useActiveEvent";

interface InvitationRow {
  id: number;
  fullName: string;
  email: string;
  status: string;
}

export function InvitationStatusPage() {
  const { eventId } = useActiveEvent();
  const [rows, setRows] = useState<InvitationRow[]>([]);
  const [teamName, setTeamName] = useState<string>("Đội thi");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    fetchMyTeams(eventId)
      .then((teams) => {
        const team = teams[0];
        if (!team) {
          setRows([]);
          return;
        }
        setTeamName(team.name);
        setRows(
          (team.members ?? []).map((member) => ({
            id: member.id,
            fullName: member.fullName,
            email: member.email,
            status: member.status
          }))
        );
      })
      .catch(() => setError("Không tải được trạng thái lời mời từ hệ thống."))
      .finally(() => setLoading(false));
  }, [eventId]);

  const invitationRows = useMemo(() => rows, [rows]);
  const confirmed = invitationRows.filter((row) => row.status === "CONFIRMED").length;

  if (loading) {
    return <ModuleSkeleton rows={4} />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-lg">
      <PageHeader
        eyebrow="Trạng thái lời mời"
        title={teamName}
        description="Theo dõi thành viên đã xác nhận, đang chờ phản hồi hoặc đã từ chối lời mời."
        actions={<Badge tone={confirmed === invitationRows.length ? "success" : "warning"}>{confirmed}/{invitationRows.length} da xác nhận</Badge>}
      />

      {error ? <p className="rounded-lg border border-error/40 bg-error-container/40 p-md font-body-sm text-on-surface">{error}</p> : null}

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="table-header-bg">
              <tr className="font-label-sm text-on-surface-variant">
                <th className="px-md py-sm">Thành viên</th>
                <th className="px-md py-sm">Email</th>
                <th className="px-md py-sm">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {invitationRows.map((row) => (
                <tr key={row.id} className="font-body-sm text-on-surface">
                  <td className="px-md py-md font-label-md">{row.fullName}</td>
                  <td className="px-md py-md break-all">{row.email}</td>
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
        Mo lời mời
      </ButtonLink>
    </div>
  );
}
