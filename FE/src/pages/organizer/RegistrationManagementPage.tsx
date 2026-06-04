import { useMemo, useState } from "react";
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
import { useActiveEvent } from "../../hooks/useActiveEvent";
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
import { getApiErrorMessage } from "../../utils/apiError";
import { mapOrganizerErrorMessage } from "../../utils/organizerErrors";
import { Icon } from "../../components/ui/Icon";

type Filter = "ALL" | "PENDING" | "CONFIRMED" | "WAITLIST" | "REJECTED";

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

export function RegistrationManagementPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { teams: registrations, loading, error } = useEventTeams(eventId);

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
    setDetailLoading(true);
    setDetailTeam(null);
    try {
      const team = await fetchTeam(teamId);
      setDetailTeam(team);
    } catch (err) {
      notify(mapOrganizerErrorMessage(getApiErrorMessage(err, "Không tải được chi tiết đội.")), "danger");
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

    try {
      const updated = await updateTeamStatus(targetId, status, reason);
      await invalidateAfterTeamMutation(queryClient);
      if (updated && detailTeam?.id === targetId) {
        setDetailTeam(updated);
      }
      notify(`Đã cập nhật hồ sơ: ${getStatusLabel(status)}.`, "success");
    } catch (err) {
      const msg = mapOrganizerErrorMessage(
        getApiErrorMessage(err, "Không cập nhật được trạng thái đội.")
      );
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

      {confirmed > 0 ? (
        <NextStepPanel
          variant={pending === 0 ? "success" : "primary"}
          action={{
            title: "Bước tiếp: Thiết lập bảng thi",
            description: `Đã có ${confirmed} đội xác nhận. Tạo vòng, bảng, slot và gán đội trước khi cấu hình đề.`,
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
              {(["ALL", "PENDING", "CONFIRMED", "WAITLIST", "REJECTED"] as Filter[]).map((item) => (
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
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </section>

      {detailLoading || detailTeam ? (
        <section className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
          <div className="flex items-center justify-between gap-sm">
            <h2 className="font-headline-sm text-on-surface">
              {detailLoading ? "Đang tải chi tiết…" : detailTeam?.name}
            </h2>
            <Button type="button" variant="ghost" onClick={() => setDetailTeam(null)}>
              Đóng
            </Button>
          </div>
          {detailTeam ? (
            <>
              <p className="font-body-sm text-on-surface-variant">
                Mã đội #{detailTeam.id} · {getStatusLabel(detailTeam.status)}
              </p>
              <ul className="divide-y divide-outline-variant/60 rounded-lg border border-outline-variant">
                {(detailTeam.members ?? []).map((member) => (
                  <li key={member.id} className="flex flex-wrap justify-between gap-sm px-md py-sm font-body-sm">
                    <span>
                      {member.fullName} — {member.email}
                    </span>
                    <Badge tone={getStatusTone(member.status)}>{getStatusLabel(member.status)}</Badge>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
