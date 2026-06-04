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

type TabId = "team" | "staff";

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
  const [tab, setTab] = useState<TabId>("team");
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
      notify("Không tải được danh sách lời mời.", "danger");
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
      notify("Đã gửi lại lời mời.", "success");
      await load();
    } catch {
      notify("Không gửi lại được lời mời.", "danger");
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
        eyebrow="Lời mời"
        title="Theo dõi lời mời"
        description="Quản lý lời mời thành viên đội. Lời mời mentor/giám khảo theo bảng sẽ có khi backend bổ sung API."
        actions={
          <>
            <EventSelector events={events} eventId={eventId} onChange={setEventId} />
            <TableDensityToggle value={density} onChange={setDensity} />
          </>
        }
      />

      <div className="flex gap-sm border-b border-outline-variant">
        <button
          type="button"
          onClick={() => setTab("team")}
          className={`border-b-2 px-md py-sm font-label-md transition-colors ${
            tab === "team"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Thành viên đội
        </button>
        <button
          type="button"
          onClick={() => setTab("staff")}
          className={`border-b-2 px-md py-sm font-label-md transition-colors ${
            tab === "staff"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Mentor / Giám khảo
        </button>
      </div>

      {tab === "team" ? (
        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="table-header-bg">
                <tr className="font-label-sm text-on-surface-variant">
                  <th className={cell}>Email</th>
                  <th className={cell}>Đội</th>
                  <th className={cell}>Trạng thái</th>
                  <th className={cell}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="table-divider">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={`${cell} text-center text-on-surface-variant`}>
                      Không có lời mời đang chờ.
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
                          Gửi lại
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-outline-variant bg-surface-container p-lg">
          <p className="font-body-sm text-on-surface-variant">
            Phân công mentor và giám khảo tại trang{" "}
            <a href="/organizer/assignments" className="text-primary hover:underline">
              Mentor và giám khảo
            </a>
            . Danh sách lời mời theo bảng cần API backend (GET list + resend).
          </p>
        </section>
      )}
    </div>
  );
}
