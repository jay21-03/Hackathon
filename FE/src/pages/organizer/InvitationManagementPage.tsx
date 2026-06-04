import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
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
import { useEventTeams } from "../../hooks/useEventTeams";
import { invalidateAfterTeamMutation } from "../../lib/invalidateAppQueries";
import { resendTeamInvitation, type TeamDetailResponse } from "../../services/registrationService";

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
  const queryClient = useQueryClient();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { teams, loading, error } = useEventTeams(eventId);
  const [density, setDensity] = useState<TableDensity>("comfortable");
  const [resendingId, setResendingId] = useState<number | null>(null);
  const cell = getDensityCellClass(density);

  const rows = useMemo(() => flattenInvitations(teams), [teams]);

  async function resend(teamMemberId: number) {
    setResendingId(teamMemberId);
    try {
      await resendTeamInvitation(teamMemberId);
      await invalidateAfterTeamMutation(queryClient);
      notify("Đã gửi lại lời mời.", "success");
    } catch {
      notify("Không gửi lại được lời mời.", "danger");
    } finally {
      setResendingId(null);
    }
  }

  if (eventLoading || loading) {
    return <ModuleSkeleton rows={6} variant="table" />;
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Lời mời thành viên"
        title="Theo dõi lời mời"
        description="Gửi lại lời mời email cho thành viên đội đang chờ. Gán mentor và giám khảo tại trang Phân công."
        actions={
          <>
            <EventSelector events={events} eventId={eventId} onChange={setEventId} />
            <TableDensityToggle value={density} onChange={setDensity} />
          </>
        }
      />

      {error ? (
        <p className="rounded-lg border border-error/40 bg-error-container/40 p-md font-body-sm">{error}</p>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon="mail"
          title="Không có lời mời đang chờ"
          description="Tất cả thành viên đã xác nhận hoặc chưa có đội đăng ký."
        />
      ) : (
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
                {rows.map((row) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="font-body-sm text-on-surface-variant">
        Mentor và giám khảo:{" "}
        <Link to="/organizer/assignments" className="text-primary hover:underline">
          Phân công mentor & giám khảo
        </Link>
      </p>
    </div>
  );
}
