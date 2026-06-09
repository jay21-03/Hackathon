import { useMemo, useState } from "react";
import type { PagedResult } from "../../types/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { DataTable, tableActionCellClass, tableRowClass } from "../../components/ui/DataTable";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { NextStepPanel } from "../../components/ui/NextStepPanel";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { TableToolbar } from "../../components/ui/TableToolbar";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventSetupProgress } from "../../hooks/useEventSetupProgress";
import { useEventTeams } from "../../hooks/useEventTeams";
import { invalidateAfterTeamMutation } from "../../lib/invalidateAppQueries";
import { queryKeys } from "../../lib/queryKeys";
import { fetchEventDetail } from "../../services/eventsApi";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import {
  fetchTeam,
  updateTeamStatus,
  type TeamDetailResponse
} from "../../services/registrationService";
import { downloadTeamsCsv } from "../../utils/exportTeamsCsv";
import { resolveApiError } from "../../utils/apiError";
import { formatAuditAction } from "../../utils/auditActionLabels";
import { Icon } from "../../components/ui/Icon";
import { TeamDetailModal } from "../../components/organizer/TeamDetailModal";
import { fetchEventAuditLogs } from "../../services/auditApi";

type Filter = "ALL" | "PENDING" | "CONFIRMED" | "WAITLIST" | "REJECTED" | "DISQUALIFIED";

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

function summarizeAuditDetail(raw: string) {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.teamStatus === "string") {
      return `Trạng thái mới: ${getStatusLabel(parsed.teamStatus)}`;
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

export function RegistrationManagementPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { steps: setupSteps } = useEventSetupProgress(eventId, "/organizer/registrations");
  const [listPage, setListPage] = useState(0);
  const { teams: registrations, loading, error, total, totalPages } = useEventTeams(eventId, {
    page: listPage,
    size: 50
  });

  const detailQuery = useQuery({
    queryKey: queryKeys.events.detail(eventId ?? ""),
    queryFn: () => fetchEventDetail(String(eventId)),
    enabled: Boolean(eventId)
  });
  const quota = detailQuery.data?.maxTeams ?? 0;

  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
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

  const filtered = useMemo(
    () =>
      registrations.filter((registration) => {
        const matchFilter = filter === "ALL" || registration.status === filter;
        const matchSearch = [registration.name, registration.status, registration.members?.map((item) => item.email).join(" ")]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search.trim().toLowerCase()));
        return matchFilter && matchSearch;
      }),
    [filter, registrations, search]
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
    const confirmedCount = registrations.filter((item) => item.status === "CONFIRMED").length;
    if (
      status === "CONFIRMED" &&
      currentRegistration?.status !== "CONFIRMED" &&
      confirmedCount >= quota
    ) {
      notify("Quota đã đầy. Hãy đưa đội vào danh sách chờ hoặc tăng quota trước khi duyệt.", "warning");
      return;
    }

    const targetId = id ?? registrations.find((item) => item.status === "PENDING")?.id ?? null;
    if (targetId == null) return;

    const teamsKey = [...queryKeys.teams.byEvent(eventId!), listPage, 50];
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
      notify(`Đã cập nhật hồ sơ: ${getStatusLabel(status)}.`, "success");
    } catch (err) {
      if (previous) {
        queryClient.setQueryData(teamsKey, previous);
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

  const confirmed = registrations.filter((item) => item.status === "CONFIRMED").length;
  const pending = registrations.filter((item) => item.status === "PENDING").length;
  const waitlist = registrations.filter((item) => item.status === "WAITLIST").length;

  if (loading || eventLoading) return <ModuleSkeleton rows={4} variant="table" />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Đăng ký đội"
        title="Theo dõi hồ sơ đăng ký"
        description="Duyệt, từ chối hoặc danh sách chờ. Đội tự chuyển Đã xác nhận khi mọi thành viên xác nhận email — không cần bấm Duyệt."
        actions={
          <>
            <EventSelector events={events} eventId={eventId} onChange={setEventId} />
            <Badge tone={error ? "danger" : "success"}>
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

      {confirmed > 0 ? (
        <NextStepPanel
          variant={pending === 0 ? "success" : "primary"}
          action={{
            title: "Bước tiếp: Thiết lập bảng thi",
            description: `Đã có ${confirmed} đội xác nhận. Tạo vòng, bảng, vị trí và gán đội trước khi cấu hình đề.`,
            to: "/organizer/boards",
            cta: "Đi tới Bảng thi"
          }}
        />
      ) : (
        <NextStepPanel
          action={{
            title: "Bước tiếp: Duyệt hoặc chờ xác nhận đội",
            description:
              "Duyệt đội trong bảng bên dưới, hoặc chờ thành viên xác nhận email. Chưa có đội confirmed thì chưa phân bảng được.",
            cta: "Xem bảng đăng ký"
          }}
        />
      )}

      {error ? (
        <p className="rounded-lg border border-error/40 bg-error-container/40 p-md font-body-sm text-on-surface">
          {error}
        </p>
      ) : null}

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Đã xác nhận" value={confirmed} helper="Được tính vào quota" icon="check_circle" tone="success" />
        <StatCard label="Chờ xử lý" value={pending} helper="Cần duyệt thủ công" icon="pending_actions" tone="warning" />
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
        <DataTable headers={["Đội thi", "Thành viên", "Cập nhật", "Trạng thái", "Thao tác"]}>
          {filtered.map((registration) => (
            <tr key={registration.id} className={tableRowClass}>
              <td className="px-md py-md">
                <p className="font-label-md">{registration.name}</p>
                <p className="text-on-surface-variant">Cuộc thi #{registration.eventId}</p>
              </td>
              <td className="px-md py-md">{memberCount(registration)}/5</td>
              <td className="px-md py-md">
                {registration.confirmedAt ? formatDate(registration.confirmedAt) : "—"}
              </td>
              <td className="px-md py-md">
                <Badge tone={getStatusTone(registration.status)}>
                  {getStatusLabel(registration.status)}
                </Badge>
              </td>
              <td className={tableActionCellClass}>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => openTeamDetail(registration.id)}>
                    Chi tiết
                  </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={registration.status === "CONFIRMED"}
                      onClick={() => updateStatus(registration.id, "CONFIRMED")}
                      data-testid={`approve-registration-${registration.id}`}
                    >
                      Duyệt
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={registration.status === "CONFIRMED" || registration.status === "REJECTED"}
                      onClick={() => updateStatus(registration.id, "WAITLIST")}
                    >
                      Chờ
                    </Button>
                  <ConfirmAction
                    title="Từ chối hồ sơ?"
                    message="Đội sẽ không được tính vào danh sách tham gia hợp lệ. Nên liên hệ đội trước khi từ chối."
                    confirmLabel="Từ chối"
                    onConfirm={() => updateStatus(registration.id, "REJECTED", "Từ chối bởi ban tổ chức")}
                  >
                    <Button type="button" variant="danger">
                      Từ chối
                    </Button>
                  </ConfirmAction>
                  <ConfirmAction
                    title="Loại đội khỏi cuộc thi?"
                    message="Đội bị loại sẽ không được chấm điểm. Cần ghi rõ lý do vi phạm."
                    confirmLabel="Loại đội"
                    onConfirm={() =>
                      updateStatus(registration.id, "DISQUALIFIED", "Vi phạm quy chế — loại bởi ban tổ chức")
                    }
                  >
                    <Button
                      type="button"
                      variant="danger"
                      disabled={registration.status === "DISQUALIFIED"}
                    >
                      Loại đội
                    </Button>
                  </ConfirmAction>
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
