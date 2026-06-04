import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import {
  getDensityCellClass,
  TableDensityToggle,
  type TableDensity
} from "../../components/ui/TableDensityToggle";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { fetchEventTeams, resendTeamInvitation, type TeamDetailResponse } from "../../services/registrationService";

interface InvitationRow {
  teamMemberId: number;
  teamName: string;
  email: string;
  status: string;
}

function flattenInvitations(teams: TeamDetailResponse[]): InvitationRow[] {
  return teams.flatMap((team) =>
    team.members
      .filter((member) => member.status === "PENDING" || member.status === "INVITED")
      .map((member) => ({
        teamMemberId: member.id,
        teamName: team.name,
        email: member.email,
        status: member.status
      }))
  );
}

export function InvitationManagementPage() {
  const { notify } = useToast();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent();
  const [density, setDensity] = useState<TableDensity>("comfortable");
  const [rows, setRows] = useState<InvitationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const cell = getDensityCellClass(density);

  const load = useCallback(async () => {
    if (!eventId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const teams = await fetchEventTeams(eventId);
      setRows(flattenInvitations(teams));
    } catch {
      notify("Khong tai duoc danh sach loi moi.", "danger");
    } finally {
      setLoading(false);
    }
  }, [eventId, notify]);

  useEffect(() => {
    void load();
  }, [load]);

  async function resend(teamMemberId: number) {
    setResendingId(teamMemberId);
    try {
      await resendTeamInvitation(teamMemberId);
      notify("Da gui lai loi moi.", "success");
      await load();
    } catch {
      notify("Khong gui lai duoc loi moi.", "danger");
    } finally {
      setResendingId(null);
    }
  }

  if (eventLoading || loading) {
    return <ModuleSkeleton rows={6} />;
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Loi moi thanh vien doi"
        title="Theo doi loi moi dang ky"
        description="Danh sach thanh vien doi chua xac nhan. Mentor/judge theo bang xem tai trang Mentor va giam khao."
        actions={
          <>
            <EventSelector events={events} eventId={eventId} onChange={setEventId} />
            <TableDensityToggle value={density} onChange={setDensity} />
          </>
        }
      />
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="table-header-bg">
              <tr className="font-label-sm text-on-surface-variant">
                <th className={cell}>Email</th>
                <th className={cell}>Doi</th>
                <th className={cell}>Trang thai</th>
                <th className={cell}>Thao tac</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`${cell} text-center text-on-surface-variant`}>
                    Khong co loi moi dang cho.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.teamMemberId} className="font-body-sm text-on-surface">
                    <td className={cell}>{row.email}</td>
                    <td className={cell}>{row.teamName}</td>
                    <td className={cell}>
                      <Badge tone={getStatusTone(row.status)}>{getStatusLabel(row.status)}</Badge>
                    </td>
                    <td className={cell}>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={resendingId === row.teamMemberId}
                        onClick={() => void resend(row.teamMemberId)}
                      >
                        Gui lai
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      <p className="font-body-sm text-on-surface-variant">
        Loi moi mentor/giam khao theo bang: BE chua co API list — can bo sung phase tiep theo.
      </p>
    </div>
  );
}
