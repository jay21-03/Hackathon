import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import {
  getDensityCellClass,
  TableDensityToggle,
  type TableDensity
} from "../../components/ui/TableDensityToggle";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventBoards } from "../../hooks/useEventBoards";
import { useEventSetupProgress } from "../../hooks/useEventSetupProgress";
import { useInvitationManagement } from "../../hooks/useInvitationManagement";
import { invalidateAfterTeamMutation } from "../../lib/invalidateAppQueries";
import { resendTeamInvitation } from "../../services/registrationService";
import {
  createStaffInvitation,
  createStaffInvitationsBulk,
  parseBulkStaffEmails,
  resendStaffInvitation,
  type StaffInvitationStatus,
  type StaffRole
} from "../../services/staffInvitationService";
import type { TeamInvitationStatus } from "../../services/registrationService";
import { enableStaffInvitations } from "../../config/features";
import { bulkStaffEmailsSchema, staffInviteSchema } from "../../domain/schemas";
import { applyApiFormErrors, resolveApiError } from "../../utils/apiError";
import { zodFieldErrors } from "../../utils/zodFieldErrors";
import { resolveDefaultRoundId } from "../../utils/pickActiveRound";
import { buildRoundNameById, formatBoardLabelById } from "../../utils/boardLabels";
import { createIdempotencyKey } from "../../utils/idempotency";
import {
  bulkStaffInviteSuccessMessage,
  staffInviteSuccessMessage
} from "../../utils/staffInviteMessages";

type Tab = "members" | "staff";

const MEMBER_STATUS_TABS: Array<{ id: TeamInvitationStatus; label: string }> = [
  { id: "INVITED", label: "Đang chờ" },
  { id: "CONFIRMED", label: "Đã chấp nhận" },
  { id: "DECLINED", label: "Từ chối" },
  { id: "EXPIRED", label: "Hết hạn" }
];

const STAFF_STATUS_TABS: Array<{ id: StaffInvitationStatus; label: string }> = [
  { id: "INVITED", label: "Đang chờ" },
  { id: "ACCEPTED", label: "Đã chấp nhận" },
  { id: "DECLINED", label: "Từ chối" },
  { id: "EXPIRED", label: "Hết hạn" }
];

function formatWhen(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
}

export function InvitationManagementPage({
  embedded = false,
  forcedTab
}: { embedded?: boolean; forcedTab?: Tab } = {}) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { steps: setupSteps } = useEventSetupProgress(
    eventId,
    embedded ? "/organizer/teams-hub" : "/organizer/invitations"
  );
  const { rounds, boards, loading: boardsLoading } = useEventBoards(eventId);
  const [tab, setTab] = useState<Tab>(forcedTab ?? "members");

  useEffect(() => {
    if (forcedTab) setTab(forcedTab);
  }, [forcedTab]);
  const [density, setDensity] = useState<TableDensity>("comfortable");
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [staffRoundId, setStaffRoundId] = useState<number | null>(null);
  const [staffBoardId, setStaffBoardId] = useState<number | null>(null);
  const activeStaffRoundId = resolveDefaultRoundId(rounds, staffRoundId);
  const boardsInStaffRound = useMemo(
    () => (activeStaffRoundId != null ? boards.filter((b) => b.roundId === activeStaffRoundId) : []),
    [boards, activeStaffRoundId]
  );
  const roundNameById = useMemo(() => buildRoundNameById(rounds), [rounds]);
  const [staffRole, setStaffRole] = useState<StaffRole | "">("");
  const [staffStatus, setStaffStatus] = useState<StaffInvitationStatus>("INVITED");
  const [staffEmailFilter, setStaffEmailFilter] = useState("");
  const [staffEmailDebounced, setStaffEmailDebounced] = useState("");
  const [staffPage, setStaffPage] = useState(0);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffFieldErrors, setStaffFieldErrors] = useState<Record<string, string>>({});
  const [staffBulkText, setStaffBulkText] = useState("");
  const [staffBulkOpen, setStaffBulkOpen] = useState(false);
  const [staffInviteRole, setStaffInviteRole] = useState<StaffRole>("MENTOR");
  const [staffSending, setStaffSending] = useState(false);
  const [memberStatus, setMemberStatus] = useState<TeamInvitationStatus>("INVITED");
  const [memberEmailFilter, setMemberEmailFilter] = useState("");
  const [memberEmailDebounced, setMemberEmailDebounced] = useState("");
  const [memberPage, setMemberPage] = useState(0);
  const pageSize = 25;
  const showDensityToggle = !(forcedTab === "staff");

  useEffect(() => {
    const timer = window.setTimeout(() => setMemberEmailDebounced(memberEmailFilter), 300);
    return () => window.clearTimeout(timer);
  }, [memberEmailFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => setStaffEmailDebounced(staffEmailFilter), 300);
    return () => window.clearTimeout(timer);
  }, [staffEmailFilter]);

  const {
    teamItems,
    teamTotal,
    teamTotalPages,
    teamLoading,
    teamError,
    refetchTeam,
    staffItems,
    staffTotal,
    staffTotalPages,
    staffLoading,
    staffError,
    refetchStaff
  } = useInvitationManagement(eventId, {
    teamEnabled: tab === "members",
    teamStatus: memberStatus,
    teamEmail: memberEmailDebounced,
    teamPage: memberPage,
    teamSize: pageSize,
    staffEnabled: tab === "staff" && enableStaffInvitations,
    staffRoundId: activeStaffRoundId,
    staffBoardId,
    staffRole,
    staffStatus,
    staffEmail: staffEmailDebounced,
    staffPage,
    staffSize: pageSize
  });

  useEffect(() => {
    setStaffRoundId((prev) => resolveDefaultRoundId(rounds, prev));
  }, [rounds]);

  useEffect(() => {
    setStaffBoardId((prev) => (prev && boardsInStaffRound.some((b) => b.id === prev) ? prev : null));
  }, [boardsInStaffRound, activeStaffRoundId]);

  useEffect(() => {
    setStaffPage(0);
  }, [eventId, activeStaffRoundId, staffBoardId, staffRole, staffStatus, staffEmailDebounced]);

  useEffect(() => {
    setMemberPage(0);
  }, [eventId, memberStatus, memberEmailDebounced]);

  async function resendMember(teamMemberId: number) {
    setResendingId(teamMemberId);
    try {
      await resendTeamInvitation(teamMemberId);
      await invalidateAfterTeamMutation(queryClient);
      await refetchTeam();
      notify("Đã gửi lại lời mời thành viên.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Không gửi lại được lời mời."), "danger");
    } finally {
      setResendingId(null);
    }
  }

  async function sendStaffInvite() {
    const parsed = staffInviteSchema.safeParse({
      email: staffEmail,
      boardId: staffBoardId ?? 0,
      role: staffInviteRole
    });
    if (!parsed.success) {
      setStaffFieldErrors(zodFieldErrors(parsed.error));
      notify(parsed.error.issues[0]?.message ?? "Dữ liệu lời mời không hợp lệ.", "warning");
      return;
    }
    setStaffFieldErrors({});
    setStaffSending(true);
    try {
      const result = await createStaffInvitation(
        parsed.data.boardId,
        { email: parsed.data.email, role: parsed.data.role },
        createIdempotencyKey(`staff-invite-${parsed.data.boardId}-${parsed.data.email.toLowerCase()}`)
      );
      setStaffEmail("");
      await refetchStaff();
      notify(staffInviteSuccessMessage(result), result.status === "ACCEPTED" ? "success" : "success");
    } catch (err) {
      applyApiFormErrors(err, setStaffFieldErrors);
      notify(resolveApiError(err, "Không gửi được lời mời."), "danger");
    } finally {
      setStaffSending(false);
    }
  }

  async function sendStaffBulk() {
    if (!staffBoardId) {
      notify("Chọn bảng trước khi gửi hàng loạt.", "warning");
      return;
    }
    const rawItems = parseBulkStaffEmails(staffBulkText);
    const parsed = bulkStaffEmailsSchema.safeParse(rawItems);
    if (!parsed.success) {
      notify(parsed.error.issues[0]?.message ?? "Danh sách email không hợp lệ.", "warning");
      return;
    }
    const items = parsed.data;
    setStaffSending(true);
    try {
      const result = await createStaffInvitationsBulk(staffBoardId, {
        defaultRole: staffInviteRole,
        items
      });
      setStaffBulkText("");
      setStaffBulkOpen(false);
      await refetchStaff();
      if (result.failedCount > 0) {
        notify(bulkStaffInviteSuccessMessage(result), result.succeededCount > 0 ? "warning" : "danger");
      } else {
        notify(bulkStaffInviteSuccessMessage(result), "success");
      }
    } catch (err) {
      notify(resolveApiError(err, "Không gửi hàng loạt được."), "danger");
    } finally {
      setStaffSending(false);
    }
  }

  async function resendStaff(id: number) {
    setResendingId(id);
    try {
      await resendStaffInvitation(id);
      await refetchStaff();
      notify("Đã gửi lại lời mời.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Không gửi lại được."), "danger");
    } finally {
      setResendingId(null);
    }
  }

  const loading =
    eventLoading ||
    (tab === "members" && teamLoading) ||
    (tab === "staff" && (boardsLoading || staffLoading));

  if (loading) {
    return <ModuleSkeleton rows={6} variant="table" />;
  }

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <>
          <PageHeader
            eyebrow="Mời thành viên"
            title="Theo dõi lời mời"
            description="Bulk mời, email có thương hiệu, theo dõi trạng thái theo tab Đang chờ / Đã chấp nhận / Từ chối / Hết hạn."
            actions={
              <>
                <OrganizerContextBar />
                {showDensityToggle ? <TableDensityToggle value={density} onChange={setDensity} /> : null}
              </>
            }
          />
          <WorkflowSteps
            title="Quy trình thiết lập"
            description="Cùng thứ tự với sidebar — trạng thái tính từ dữ liệu thật."
            steps={setupSteps}
            activeHref="/organizer/invitations"
          />
        </>
      ) : (
        showDensityToggle ? (
          <div className="flex justify-end">
            <TableDensityToggle value={density} onChange={setDensity} />
          </div>
        ) : null
      )}

      {!embedded && !forcedTab ? (
        <div className="flex flex-wrap gap-sm">
          <Button type="button" variant={tab === "members" ? "primary" : "ghost"} onClick={() => setTab("members")}>
            Thành viên đội
          </Button>
          {enableStaffInvitations ? (
            <Button type="button" variant={tab === "staff" ? "primary" : "ghost"} onClick={() => setTab("staff")}>
              Mentor / Giám khảo
            </Button>
          ) : null}
        </div>
      ) : null}

      {tab === "members" ? (
        <>
          <div className="flex flex-wrap gap-sm">
            {MEMBER_STATUS_TABS.map((s) => (
              <Button
                key={s.id}
                type="button"
                size="sm"
                variant={memberStatus === s.id ? "secondary" : "ghost"}
                aria-pressed={memberStatus === s.id}
                onClick={() => setMemberStatus(s.id)}
              >
                {s.label}
              </Button>
            ))}
          </div>

          <section className="flex flex-wrap items-end gap-md rounded-xl border border-outline-variant bg-surface-container p-md">
            <label className="flex min-w-[14rem] flex-1 flex-col gap-1 font-label-sm text-on-surface-variant">
              Lọc email
              <input
                type="search"
                className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                value={memberEmailFilter}
                onChange={(e) => setMemberEmailFilter(e.target.value)}
                placeholder="email@fpt.edu.vn"
              />
            </label>
          </section>

          {teamError ? (
            <p className="rounded-lg border border-error/40 bg-error-container/40 p-md font-body-sm">{teamError}</p>
          ) : null}

          {teamItems.length === 0 ? (
            <EmptyState
              icon="mail"
              title="Không có lời mời trong tab này"
              description="Thử đổi tab trạng thái hoặc bộ lọc email."
            />
          ) : (
            <InvitationTable
              density={density}
              rows={teamItems.map((row) => ({
                key: row.id,
                email: row.email,
                context: row.teamName ?? `Đội #${row.teamId}`,
                status: row.expired ? "EXPIRED" : row.status,
                sentAt: row.invitedAt,
                expiresAt: row.inviteExpiresAt,
                resendCount: row.resendCount ?? 0,
                lastResentAt: row.lastResentAt,
                emailOpenCount: row.emailOpenCount ?? 0,
                emailOpenedAt: row.emailOpenedAt,
                emailAcceptClickedAt: row.emailAcceptClickedAt,
                canResend: row.status === "INVITED" && !row.expired,
                onResend: () => void resendMember(row.id)
              }))}
              resendingId={resendingId}
              page={memberPage}
              totalPages={teamTotalPages}
              total={teamTotal}
              onPrev={() => setMemberPage((p) => Math.max(0, p - 1))}
              onNext={() => setMemberPage((p) => p + 1)}
            />
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-sm">
            {STAFF_STATUS_TABS.map((s) => (
              <Button
                key={s.id}
                type="button"
                size="sm"
                variant={staffStatus === s.id ? "secondary" : "ghost"}
                aria-pressed={staffStatus === s.id}
                onClick={() => setStaffStatus(s.id)}
              >
                {s.label}
              </Button>
            ))}
          </div>

          <section className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-md">
            <div className="flex flex-wrap items-end gap-md">
              <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
                Vòng
                <select
                  className="min-w-[12rem] rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                  value={activeStaffRoundId ?? ""}
                  onChange={(e) => setStaffRoundId(e.target.value ? Number(e.target.value) : null)}
                  disabled={!rounds.length}
                >
                  {rounds.length === 0 ? <option value="">Chưa có vòng</option> : null}
                  {rounds.map((round) => (
                    <option key={round.id} value={round.id}>
                      {round.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
                Bảng
                <select
                  className="min-w-[10rem] rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                  value={staffBoardId ?? ""}
                  onChange={(e) => setStaffBoardId(e.target.value ? Number(e.target.value) : null)}
                  disabled={!boardsInStaffRound.length}
                >
                  <option value="">Tất cả bảng vòng này</option>
                  {boardsInStaffRound.map((b) => (
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
                Email (từng người)
                <input
                  type="email"
                  className={`rounded-lg border bg-surface px-3 py-2 font-body-sm ${
                    staffFieldErrors.email ? "border-error" : "border-outline-variant"
                  }`}
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="email@fpt.edu.vn"
                />
                {staffFieldErrors.email ? (
                  <span className="font-body-sm text-error">{staffFieldErrors.email}</span>
                ) : null}
                {staffFieldErrors.boardId ? (
                  <span className="font-body-sm text-error">{staffFieldErrors.boardId}</span>
                ) : null}
              </label>
              <Button type="button" loading={staffSending} disabled={!staffBoardId} onClick={() => void sendStaffInvite()}>
                Gửi lời mời
              </Button>
              <Button type="button" variant="ghost" disabled={!staffBoardId} onClick={() => setStaffBulkOpen((v) => !v)}>
                {staffBulkOpen ? "Ẩn bulk" : "Mời hàng loạt"}
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
              <label className="flex min-w-[12rem] flex-col gap-1 font-label-sm text-on-surface-variant">
                Lọc email
                <input
                  type="search"
                  className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                  value={staffEmailFilter}
                  onChange={(e) => setStaffEmailFilter(e.target.value)}
                  placeholder="Tìm email"
                />
              </label>
            </div>

            {staffBulkOpen ? (
              <div className="space-y-sm rounded-lg border border-outline-variant/60 bg-surface p-md">
                <p className="font-body-sm text-on-surface-variant">
                  Mỗi dòng một email. Tuỳ chọn: <code>email,MENTOR</code> hoặc <code>email,JUDGE</code>.
                </p>
                <textarea
                  className="min-h-[6rem] w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                  value={staffBulkText}
                  onChange={(e) => setStaffBulkText(e.target.value)}
                  placeholder={"mentor1@fpt.edu.vn\njudge2@fpt.edu.vn,JUDGE"}
                />
                <Button type="button" loading={staffSending} disabled={!staffBoardId} onClick={() => void sendStaffBulk()}>
                  Gửi tất cả
                </Button>
              </div>
            ) : null}
          </section>

          {staffError ? (
            <p className="rounded-lg border border-error/40 bg-error-container/40 p-md font-body-sm">{staffError}</p>
          ) : null}

          {staffItems.length === 0 ? (
            <EmptyState
              icon="group"
              title="Không có lời mời trong tab này"
              description="Gửi lời mời bằng form phía trên hoặc đổi tab trạng thái."
            />
          ) : (
            <InvitationTable
              density={density}
              rows={staffItems.map((row) => ({
                key: row.id,
                email: row.email,
                context: `${formatBoardLabelById(row.boardId, row.boardName, boards, roundNameById)} · ${row.role === "JUDGE" ? "Giám khảo" : "Mentor"}`,
                status: row.status,
                sentAt: row.invitedAt,
                expiresAt: row.inviteExpiresAt,
                resendCount: row.resendCount ?? 0,
                lastResentAt: row.lastResentAt,
                emailOpenCount: row.emailOpenCount ?? 0,
                emailOpenedAt: row.emailOpenedAt,
                emailAcceptClickedAt: row.emailAcceptClickedAt,
                canResend: row.status === "INVITED",
                onResend: () => void resendStaff(row.id)
              }))}
              resendingId={resendingId}
              page={staffPage}
              totalPages={staffTotalPages}
              total={staffTotal}
              onPrev={() => setStaffPage((p) => Math.max(0, p - 1))}
              onNext={() => setStaffPage((p) => p + 1)}
            />
          )}
        </>
      )}
    </div>
  );
}

interface InvitationRow {
  key: number;
  email: string;
  context: string;
  status: string;
  sentAt?: string | null;
  expiresAt?: string | null;
  resendCount: number;
  lastResentAt?: string | null;
  emailOpenCount?: number;
  emailOpenedAt?: string | null;
  emailAcceptClickedAt?: string | null;
  canResend: boolean;
  onResend: () => void;
}

function InvitationTable({
  density,
  rows,
  resendingId,
  page,
  totalPages,
  total,
  onPrev,
  onNext
}: {
  density: TableDensity;
  rows: InvitationRow[];
  resendingId: number | null;
  page: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const cell = getDensityCellClass(density);
  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="table-header-bg">
            <tr className="font-label-sm text-on-surface-variant">
              <th className={cell}>Email</th>
              <th className={cell}>Đội / Bảng</th>
              <th className={cell}>Trạng thái</th>
              <th className={cell}>Gửi lúc</th>
              <th className={cell}>Hết hạn</th>
              <th className={cell}>Gửi lại</th>
              <th className={cell}>Đã mở</th>
              <th className={cell}>Đã click</th>
              <th className={cell}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="table-divider">
            {rows.map((row) => (
              <tr key={row.key} className="font-body-sm text-on-surface">
                <td className={cell}>{row.email}</td>
                <td className={cell}>{row.context}</td>
                <td className={cell}>
                  <Badge tone={getStatusTone(row.status)}>{getStatusLabel(row.status)}</Badge>
                </td>
                <td className={cell}>{formatWhen(row.sentAt)}</td>
                <td className={cell}>{formatWhen(row.expiresAt)}</td>
                <td className={cell}>
                  <span>{row.resendCount}</span>
                  {row.lastResentAt ? (
                    <span className="block text-on-surface-variant">{formatWhen(row.lastResentAt)}</span>
                  ) : null}
                </td>
                <td className={cell}>
                  <span>{row.emailOpenCount ?? 0}</span>
                  {row.emailOpenedAt ? (
                    <span className="block text-on-surface-variant">{formatWhen(row.emailOpenedAt)}</span>
                  ) : null}
                </td>
                <td className={cell}>
                  {row.emailAcceptClickedAt ? formatWhen(row.emailAcceptClickedAt) : "—"}
                </td>
                <td className={cell}>
                  {row.canResend ? (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={resendingId === row.key}
                      onClick={row.onResend}
                    >
                      Gửi lại
                    </Button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-md border-t border-outline-variant px-md py-sm">
          <p className="font-body-sm text-on-surface-variant">
            Trang {page + 1}/{totalPages} · {total} lời mời
          </p>
          <div className="flex gap-sm">
            <Button type="button" variant="ghost" disabled={page <= 0} onClick={onPrev}>
              Trước
            </Button>
            <Button type="button" variant="ghost" disabled={page >= totalPages - 1} onClick={onNext}>
              Sau
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
