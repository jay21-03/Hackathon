import { useMemo, useState, useEffect } from "react";
import type { PagedResult } from "../../types/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReasonConfirmAction } from "../../components/feedback/ReasonConfirmAction";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { DataTable, tableActionCellClass, tableFirstCellStickyClass, tableRowClass } from "../../components/ui/DataTable";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { TableToolbar } from "../../components/ui/TableToolbar";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventSetupProgress } from "../../hooks/useEventSetupProgress";
import { useEventTeams } from "../../hooks/useEventTeams";
import { useEventTeamSummary } from "../../hooks/useEventTeamSummary";
import { invalidateAfterTeamMutation } from "../../lib/invalidateAppQueries";
import { queryKeys } from "../../lib/queryKeys";
import { fetchEventDetail } from "../../services/eventsApi";
import { getStatusLabel, getStatusTone, getTeamRegistrationStatusLabel, getTeamRegistrationStatusTone } from "../../domain/status";
import {
  fetchTeam,
  updateTeamStatus,
  type TeamDetailResponse
} from "../../services/registrationService";
import { downloadTeamsCsv } from "../../utils/exportTeamsCsv";
import { applyApiFormErrors, resolveApiError } from "../../utils/apiError";
import { mapRegistrationErrorMessage } from "../../utils/registrationErrors";
import { formatAuditAction } from "../../utils/auditActionLabels";
import { Icon } from "../../components/ui/Icon";
import { TeamDetailModal } from "../../components/organizer/TeamDetailModal";
import { fetchEventAuditLogs } from "../../services/auditApi";
type Filter = "ALL" | "PENDING" | "CONFIRMED" | "WAITLIST" | "REJECTED" | "DISQUALIFIED";

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

function getApproveDisabledReason(registration: {
  status: string;
  readyForOrganizerApproval?: boolean;
}): string | null {
  if (registration.status !== "PENDING") return null;
  if (!registration.readyForOrganizerApproval) {
    return "Còn thành viên chưa xác nhận email — đợi đội xác nhận trước khi duyệt.";
  }
  return null;
}

function summarizeAuditDetail(raw: string) {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.teamStatus === "string") {
      return `Trạng thái mới: ${getStatusLabel(parsed.teamStatus)}`;
    }
    if (typeof parsed.eventStatus === "string") {
      return `Trạng thái cuộc thi: ${getStatusLabel(parsed.eventStatus)}`;
    }
    if (typeof parsed.boardId === "number" && typeof parsed.teamCount === "number") {
      return `Bảng #${parsed.boardId} · ${parsed.teamCount} đội`;
    }
    if (typeof parsed.eventId === "number" && typeof parsed.boardsPublished === "number") {
      return `Cuộc thi #${parsed.eventId} · ${parsed.boardsPublished} bảng đã công bố`;
    }
  } catch {
    return raw;
  }
  return raw.length > 120 ? `${raw.slice(0, 120)}…` : raw;
}

export function RegistrationManagementPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { steps: setupSteps } = useEventSetupProgress(
    eventId,
    embedded ? "/organizer/teams-hub" : "/organizer/registrations"
  );
  const [listPage, setListPage] = useState(0);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchDebounced(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setListPage(0);
  }, [filter, searchDebounced, eventId]);

  const detailQuery = useQuery({
    queryKey: queryKeys.events.detail(eventId ?? ""),
    queryFn: () => fetchEventDetail(String(eventId)),
    enabled: Boolean(eventId)
  });

  const { teams: registrations, loading, error, total, totalPages, refetch } = useEventTeams(eventId, {
    page: listPage,
    size: 50,
    status: filter,
    q: searchDebounced,
    refetchInterval:
      detailQuery.data?.status === "REGISTRATION_OPEN" ? 20_000 : false
  });

  const quota = detailQuery.data?.maxTeams ?? 0;
  const maxTeamSize = detailQuery.data?.maxTeamSize ?? 5;
  const { summary: teamSummary, loading: summaryLoading } = useEventTeamSummary(eventId);
  const confirmedTotal = teamSummary?.confirmedCount ?? 0;
  const pendingTotal = teamSummary?.pendingCount ?? 0;
  const awaitingApprovalTotal = teamSummary?.awaitingApprovalCount ?? 0;
  const waitlistTotal = teamSummary?.waitlistCount ?? 0;

  const [detailTeam, setDetailTeam] = useState<TeamDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const auditQuery = useQuery({
    queryKey: [...queryKeys.events.detail(eventId ?? ""), "audit-logs"],
    queryFn: () => fetchEventAuditLogs(eventId!),
    enabled: Boolean(eventId)
  });

  function memberCount(team: TeamDetailResponse) {
    return team.members?.length ?? 0;
  }

  const sortedRegistrations = useMemo(
    () => [...registrations].sort((a, b) => a.name.localeCompare(b.name, "vi") || a.id - b.id),
    [registrations]
  );

  async function openTeamDetail(teamId: number) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailTeam(null);
    try {
      const team = await fetchTeam(teamId);
      setDetailTeam(team);
    } catch (err) {
      notify(resolveApiError(err, "Không tải được chi tiết đội."), "danger");
    } finally {
      setDetailLoading(false);
    }
  }

  async function updateStatus(id: number | null, status: string, reason?: string) {
    const currentRegistration = id ? registrations.find((registration) => registration.id === id) : undefined;
    if (
      status === "CONFIRMED" &&
      currentRegistration?.status !== "CONFIRMED" &&
      confirmedTotal >= quota
    ) {
      notify("Quota đã đầy. Hệ thống sẽ chuyển đội vào danh sách chờ khi bạn duyệt.", "warning");
    }

    const targetId = id ?? registrations.find((item) => item.status === "PENDING")?.id ?? null;
    if (targetId == null) return;

    const teamsKey = [...queryKeys.teams.byEvent(eventId!), listPage, 50, filter, searchDebounced];
    await queryClient.cancelQueries({ queryKey: teamsKey });
    const previous = queryClient.getQueryData<PagedResult<TeamDetailResponse>>(teamsKey);
    if (previous) {
      queryClient.setQueryData<PagedResult<TeamDetailResponse>>(teamsKey, {
        ...previous,
        items: previous.items.map((row) =>
          row.id === targetId ? { ...row, status } : row
        )
      });
    }

    try {
      const updated = await updateTeamStatus(targetId, status, reason);
      await invalidateAfterTeamMutation(queryClient);
      if (updated && detailTeam?.id === targetId) {
        setDetailTeam(updated);
      }
      const actualStatus = updated?.status ?? status;
      if (status === "CONFIRMED" && actualStatus === "WAITLIST") {
        notify("Quota đã đầy — đội được đưa vào danh sách chờ.", "warning");
      } else {
        notify(`Đã cập nhật hồ sơ: ${getStatusLabel(actualStatus)}.`, "success");
      }
    } catch (err) {
      if (previous) {
        queryClient.setQueryData(teamsKey, previous);
      }
      const reasonErrors: Record<string, string> = {};
      if (applyApiFormErrors(err, (errors) => Object.assign(reasonErrors, errors))) {
        const reasonMsg = reasonErrors.reason ?? "Kiểm tra lại lý do từ chối/loại đội.";
        notify(mapRegistrationErrorMessage(reasonMsg), "danger");
        return;
      }
      const msg = resolveApiError(err, "Không cập nhật được trạng thái đội.");
      notify(msg, "danger");
    }
  }

  function exportCsv() {
    if (!eventId || registrations.length === 0) {
      notify("Không có dữ liệu để xuất.", "warning");
      return;
    }
    downloadTeamsCsv(registrations, `teams-event-${eventId}.csv`);
    notify("Đã tải file CSV.", "success");
  }

  const confirmed = confirmedTotal;
  const pending = pendingTotal;
  const awaitingApproval = awaitingApprovalTotal;
  const waitlist = waitlistTotal;

  if (loading || eventLoading || summaryLoading) return <ModuleSkeleton rows={4} variant="table" />;

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <>
          <PageHeader
            eyebrow="Đăng ký đội"
            title="Theo dõi hồ sơ đăng ký"
            description="Duyệt, từ chối hoặc đưa vào danh sách chờ. Sau khi mọi thành viên xác nhận email, đội ở trạng thái Chờ xác nhận — BTC cần bấm Duyệt để xác nhận tham gia (hoặc Chờ nếu quota đầy)."
            actions={
              <>
                <OrganizerContextBar />
                <Badge tone="success">
                  {confirmed}/{quota || "—"} quota
                </Badge>
              </>
            }
          />
          <WorkflowSteps
            title="Quy trình thiết lập"
            description="Cùng thứ tự với sidebar — trạng thái tính từ dữ liệu thật."
            steps={setupSteps}
            activeHref="/organizer/registrations"
          />
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-sm">
          <Badge tone="success">
            {confirmed}/{quota || "—"} quota
          </Badge>
        </div>
      )}

      {error ? (
        <RetryPanel message={error} onRetry={() => void refetch()} />
      ) : null}

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Đã duyệt" value={confirmed} helper="Được tính vào quota" icon="check_circle" tone="success" />
        <StatCard
          label="Chờ BTC duyệt"
          value={awaitingApproval}
          helper={`${pending} đội đang chờ xử lý`}
          icon="pending_actions"
          tone="warning"
        />
        <StatCard label="Danh sách chờ" value={waitlist} helper="Chờ khi quota mở lại" icon="hourglass_top" tone="primary" />
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface-container">
        <TableToolbar
          searchValue={search}
          searchPlaceholder="Tìm đội, email hoặc trạng thái"
          onSearchChange={setSearch}
          filters={
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {(["ALL", "PENDING", "CONFIRMED", "WAITLIST", "REJECTED", "DISQUALIFIED"] as Filter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={filter === item}
                  onClick={() => setFilter(item)}
                  className={`shrink-0 rounded-lg px-3 py-2 font-label-sm normal-case ${
                    filter === item
                      ? "bg-primary-container text-on-primary-container"
                      : "bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  {item === "ALL" ? "Tất cả" : getStatusLabel(item)}
                </button>
              ))}
            </div>
          }
          actions={
            <Button variant="ghost" icon={<Icon name="download" />} onClick={exportCsv}>
              Xuất CSV
            </Button>
          }
        />
        <DataTable headers={["Đội thi", "Thành viên", "Cập nhật", "Trạng thái", "Thao tác"]} stickyFirstColumn>
          {sortedRegistrations.map((registration) => (
            <tr key={registration.id} className={tableRowClass}>
              <td className={tableFirstCellStickyClass}>
                <p className="font-label-md">{registration.name}</p>
                <p className="text-on-surface-variant">Cuộc thi #{registration.eventId}</p>
              </td>
              <td className="px-md py-md">{memberCount(registration)}/{maxTeamSize}</td>
              <td className="px-md py-md">
                {registration.confirmedAt ? formatDate(registration.confirmedAt) : "—"}
              </td>
              <td className="px-md py-md">
                <Badge tone={getTeamRegistrationStatusTone(registration)}>
                  {getTeamRegistrationStatusLabel(registration)}
                </Badge>
              </td>
              <td className={tableActionCellClass}>
                <div className="flex flex-wrap justify-end gap-2 max-sm:min-w-[12rem]">
                  <Button type="button" variant="ghost" onClick={() => openTeamDetail(registration.id)}>
                    Chi tiết
                  </Button>
                  <span
                    title={getApproveDisabledReason(registration) ?? undefined}
                    className="inline-flex"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={
                        registration.status !== "PENDING" || !registration.readyForOrganizerApproval
                      }
                      onClick={() => updateStatus(registration.id, "CONFIRMED")}
                      data-testid={`approve-registration-${registration.id}`}
                    >
                      Duyệt
                    </Button>
                  </span>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={registration.status === "CONFIRMED" || registration.status === "REJECTED"}
                      onClick={() => updateStatus(registration.id, "WAITLIST")}
                    >
                      Chờ
                    </Button>
                  <ReasonConfirmAction
                    title="Từ chối hồ sơ?"
                    message="Đội sẽ không được tính vào danh sách tham gia hợp lệ. Nên liên hệ đội trước khi từ chối."
                    confirmLabel="Từ chối"
                    reasonPlaceholder="Ví dụ: Hồ sơ không đủ điều kiện tham gia…"
                    onConfirm={(reason) => updateStatus(registration.id, "REJECTED", reason)}
                  >
                    <Button type="button" variant="danger">
                      Từ chối
                    </Button>
                  </ReasonConfirmAction>
                  <ReasonConfirmAction
                    title="Loại đội khỏi cuộc thi?"
                    message="Đội bị loại sẽ không được chấm điểm. Cần ghi rõ lý do vi phạm."
                    confirmLabel="Loại đội"
                    reasonLabel="Lý do vi phạm"
                    reasonPlaceholder="Ví dụ: Vi phạm quy chế nộp bài…"
                    onConfirm={(reason) => updateStatus(registration.id, "DISQUALIFIED", reason)}
                  >
                    <Button
                      type="button"
                      variant="danger"
                      disabled={registration.status === "DISQUALIFIED"}
                    >
                      Loại đội
                    </Button>
                  </ReasonConfirmAction>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-sm pt-sm">
            <p className="font-body-sm text-on-surface-variant">
              {total} đội · trang {listPage + 1}/{totalPages}
            </p>
            <div className="flex gap-sm">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={listPage === 0}
                onClick={() => setListPage((page) => Math.max(0, page - 1))}
              >
                Trước
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={listPage >= totalPages - 1}
                onClick={() => setListPage((page) => page + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {auditQuery.data && auditQuery.data.length > 0 ? (
        <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <h2 className="font-headline-sm text-on-surface">Nhật ký thao tác</h2>
          <ul className="mt-sm max-h-64 space-y-xs overflow-y-auto font-body-sm text-on-surface-variant">
            {auditQuery.data.map((log) => (
              <li key={log.id} className="border-b border-outline-variant/40 py-xs">
                <span className="font-label-sm text-on-surface">{formatAuditAction(log.action)}</span>
                {" · "}
                {log.actorEmail ?? "hệ thống"} —{" "}
                {new Date(log.createdAt).toLocaleString("vi-VN")}
                {log.afterState ? (
                  <span className="mt-xs block font-body-sm text-on-surface-variant">
                    {summarizeAuditDetail(log.afterState)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <TeamDetailModal
        open={detailOpen}
        loading={detailLoading}
        team={detailTeam}
        contextLabel={detailTeam ? `Đội #${detailTeam.id}` : undefined}
        onClose={() => {
          setDetailOpen(false);
          setDetailTeam(null);
        }}
      />
    </div>
  );
}
