import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useEventBoards } from "../../hooks/useEventBoards";
import { useEventTeams } from "../../hooks/useEventTeams";
import { invalidateAfterTeamMutation } from "../../lib/invalidateAppQueries";
import { resendTeamInvitation, type TeamDetailResponse } from "../../services/registrationService";
import {
  createStaffInvitation,
  fetchStaffInvitations,
  resendStaffInvitation,
  type StaffRole
} from "../../services/staffInvitationService";
import { getApiErrorMessage } from "../../utils/apiError";
import { mapOrganizerErrorMessage } from "../../utils/organizerErrors";

type Tab = "members" | "staff";

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
  const { teams, loading: teamsLoading, error: teamsError } = useEventTeams(eventId);
  const { boards, loading: boardsLoading } = useEventBoards(eventId);
  const [tab, setTab] = useState<Tab>("members");
  const [density, setDensity] = useState<TableDensity>("comfortable");
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [staffBoardId, setStaffBoardId] = useState<number | null>(null);
  const [staffRole, setStaffRole] = useState<StaffRole | "">("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffInviteRole, setStaffInviteRole] = useState<StaffRole>("MENTOR");
  const [staffSending, setStaffSending] = useState(false);
  const cell = getDensityCellClass(density);

  const memberRows = useMemo(() => flattenInvitations(teams), [teams]);

  const staffQuery = useQuery({
    queryKey: ["staff-invitations", eventId, staffBoardId, staffRole],
    queryFn: () =>
      fetchStaffInvitations(eventId!, {
        boardId: staffBoardId,
        role: staffRole || null
      }),
    enabled: Boolean(eventId) && tab === "staff"
  });

  async function resendMember(teamMemberId: number) {
    setResendingId(teamMemberId);
    try {
      await resendTeamInvitation(teamMemberId);
      await invalidateAfterTeamMutation(queryClient);
      notify("Đã gửi lại lời mời thành viên.", "success");
    } catch {
      notify("Không gửi lại được lời mời.", "danger");
    } finally {
      setResendingId(null);
    }
  }

  async function sendStaffInvite() {
    if (!staffBoardId || !staffEmail.trim()) {
      notify("Chọn bảng và nhập email.", "warning");
      return;
    }
    setStaffSending(true);
    try {
      await createStaffInvitation(staffBoardId, {
        email: staffEmail.trim(),
        role: staffInviteRole
      });
      setStaffEmail("");
      await staffQuery.refetch();
      notify("Đã gửi lời mời mentor/giám khảo.", "success");
    } catch (err) {
      notify(mapOrganizerErrorMessage(getApiErrorMessage(err, "Không gửi được lời mời.")), "danger");
    } finally {
      setStaffSending(false);
    }
  }

  async function resendStaff(id: number) {
    setResendingId(id);
    try {
      await resendStaffInvitation(id);
      await staffQuery.refetch();
      notify("Đã gửi lại lời mời.", "success");
    } catch (err) {
      notify(mapOrganizerErrorMessage(getApiErrorMessage(err, "Không gửi lại được.")), "danger");
    } finally {
      setResendingId(null);
    }
  }

  if (eventLoading || teamsLoading || (tab === "staff" && boardsLoading)) {
    return <ModuleSkeleton rows={6} variant="table" />;
  }

  const staffRows = staffQuery.data ?? [];

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Lời mời"
        title="Theo dõi lời mời"
        description="Thành viên đội qua email; mentor/giám khảo qua lời mời riêng (cần đăng nhập Google đúng email để chấp nhận)."
        actions={
          <>
            <EventSelector events={events} eventId={eventId} onChange={setEventId} />
            <TableDensityToggle value={density} onChange={setDensity} />
          </>
        }
      />

      <div className="flex flex-wrap gap-sm">
        <Button type="button" variant={tab === "members" ? "primary" : "ghost"} onClick={() => setTab("members")}>
          Thành viên đội
        </Button>
        <Button type="button" variant={tab === "staff" ? "primary" : "ghost"} onClick={() => setTab("staff")}>
          Mentor / Giám khảo
        </Button>
      </div>

      {tab === "members" ? (
        <>
          {teamsError ? (
            <p className="rounded-lg border border-error/40 bg-error-container/40 p-md font-body-sm">{teamsError}</p>
          ) : null}
          {memberRows.length === 0 ? (
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
                    {memberRows.map((row) => (
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
                            onClick={() => void resendMember(row.teamMemberId)}
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
        </>
      ) : (
        <>
          <section className="flex flex-wrap items-end gap-md rounded-xl border border-outline-variant bg-surface-container p-md">
            <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
              Bảng
              <select
                className="min-w-[10rem] rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                value={staffBoardId ?? ""}
                onChange={(e) => setStaffBoardId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Chọn bảng</option>
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
              Vai trò gửi
              <select
                className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                value={staffInviteRole}
                onChange={(e) => setStaffInviteRole(e.target.value as StaffRole)}
              >
                <option value="MENTOR">Mentor</option>
                <option value="JUDGE">Giám khảo</option>
              </select>
            </label>
            <label className="flex min-w-[14rem] flex-1 flex-col gap-1 font-label-sm text-on-surface-variant">
              Email
              <input
                type="email"
                className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="email@fpt.edu.vn"
              />
            </label>
            <Button type="button" loading={staffSending} disabled={!staffBoardId} onClick={() => void sendStaffInvite()}>
              Gửi lời mời
            </Button>
            <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
              Lọc vai trò
              <select
                className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value as StaffRole | "")}
              >
                <option value="">Tất cả</option>
                <option value="MENTOR">Mentor</option>
                <option value="JUDGE">Giám khảo</option>
              </select>
            </label>
          </section>

          {staffQuery.error ? (
            <p className="rounded-lg border border-error/40 bg-error-container/40 p-md font-body-sm">
              {getApiErrorMessage(staffQuery.error)}
            </p>
          ) : null}

          {staffRows.length === 0 ? (
            <EmptyState
              icon="group"
              title="Chưa có lời mời staff đang chờ"
              description="Gửi lời mời bằng form phía trên hoặc gán trực tiếp tại Phân công nếu user đã có tài khoản."
            />
          ) : (
            <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="table-header-bg">
                    <tr className="font-label-sm text-on-surface-variant">
                      <th className={cell}>Email</th>
                      <th className={cell}>Bảng</th>
                      <th className={cell}>Vai trò</th>
                      <th className={cell}>Gửi lúc</th>
                      <th className={cell}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="table-divider">
                    {staffRows.map((row) => (
                      <tr key={row.id} className="font-body-sm text-on-surface">
                        <td className={cell}>{row.email}</td>
                        <td className={cell}>{row.boardName ?? `Bảng #${row.boardId}`}</td>
                        <td className={cell}>
                          <Badge tone="active">{row.role === "JUDGE" ? "Giám khảo" : "Mentor"}</Badge>
                        </td>
                        <td className={cell}>{new Date(row.invitedAt).toLocaleString("vi-VN")}</td>
                        <td className={cell}>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={resendingId === row.id}
                            onClick={() => void resendStaff(row.id)}
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
        </>
      )}
    </div>
  );
}
