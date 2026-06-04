import { useMemo, useState, useEffect } from "react";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { EventSelector } from "../../components/ui/EventSelector";
import { Icon } from "../../components/ui/Icon";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { TableToolbar } from "../../components/ui/TableToolbar";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { fetchEventDetail } from "../../services/eventsApi";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import {
  fetchEventTeams,
  fetchTeam,
  updateTeamStatus,
  type TeamDetailResponse
} from "../../services/registrationService";

type Filter = "ALL" | "PENDING" | "CONFIRMED" | "WAITLIST" | "REJECTED";

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

export function RegistrationManagementPage() {
  const { notify } = useToast();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent();
  const [registrations, setRegistrations] = useState<TeamDetailResponse[]>([]);
  const [quota, setQuota] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [detailTeam, setDetailTeam] = useState<TeamDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([fetchEventTeams(eventId), fetchEventDetail(String(eventId))])
      .then(([teamsResult, eventResult]) => {
        setRegistrations(teamsResult);
        setQuota(eventResult?.maxTeams ?? 0);
      })
      .catch(() => {
        setError("Không tải được hồ sơ đăng ký từ hệ thống.");
        notify("Không tải được dữ liệu đăng ký.", "danger");
      })
      .finally(() => setLoading(false));
  }, [eventId, notify]);

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
    } catch {
      notify("Không tải được chi tiết đội.", "danger");
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
      notify("Quota đã đầy, hãy đưa đội vào danh sách chờ hoặc mở thêm quota trước khi duyệt.", "warning");
      return;
    }

    const targetId = id ?? registrations.find((item) => item.status === "PENDING")?.id ?? null;
    if (targetId == null) return;

    try {
      const updated = await updateTeamStatus(targetId, status, reason);
      if (updated) {
        setRegistrations((current) => current.map((registration) => (registration.id === targetId ? updated : registration)));
      }
      notify(`Đã cập nhật hồ sơ: ${getStatusLabel(status)}.`, "success");
    } catch {
      setRegistrations((current) =>
        current.map((registration) =>
          registration.id === targetId ? { ...registration, status, rejectedReason: reason ?? registration.rejectedReason } : registration
        )
      );
      notify(`Đã cập nhật hồ sơ: ${getStatusLabel(status)}.`, "success");
    }
  }

  const confirmed = registrations.filter((item) => item.status === "CONFIRMED").length;
  const pending = registrations.filter((item) => item.status === "PENDING").length;
  const waitlist = registrations.filter((item) => item.status === "WAITLIST").length;

  if (loading || eventLoading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Duyệt đăng ký đội"
        title="Theo dõi hồ sơ đăng ký"
        description="Ban tổ chức duyệt, từ chối hoặc đưa đội vào danh sách chờ. Quota đầy thì đội mới không được tính vào confirmed."
        actions={
          <>
            <EventSelector events={events} eventId={eventId} onChange={setEventId} />
            <Badge tone={error ? "danger" : "success"}>{confirmed}/{quota || "-"} quota hệ thống</Badge>
          </>
        }
      />

      {error ? <p className="rounded-lg border border-error/40 bg-error-container/40 p-md font-body-sm text-on-surface">{error}</p> : null}

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Đã xác nhận" value={confirmed} helper="Duoc tinh vao quota" icon="check_circle" tone="success" />
        <StatCard label="Chờ xử lý" value={pending} helper="Cần duyệt thủ công" icon="pending_actions" tone="warning" />
        <StatCard label="Danh sách chờ" value={waitlist} helper="Chờ khi quota mở lại" icon="hourglass_top" tone="primary" />
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface-container">
        <TableToolbar
          searchValue={search}
          searchPlaceholder="Tim doi, track hoac trạng thái"
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
                  {item === "ALL" ? "Tat ca" : getStatusLabel(item)}
                </button>
              ))}
            </div>
          }
          actions={<Button variant="ghost" icon={<Icon name="download" />}>Xuat CSV</Button>}
        />
        <DataTable headers={["Đội thi", "Thành viên", "Cập nhật", "Trạng thái", "Thao tác"]}>
          {filtered.map((registration) => {
            return (
              <tr key={registration.id} className="font-body-sm text-on-surface">
                <td className="px-md py-md">
                  <p className="font-label-md">{registration.name}</p>
                  <p className="text-on-surface-variant">Event #{registration.eventId}</p>
                </td>
                <td className="px-md py-md">{memberCount(registration)}/5</td>
                <td className="px-md py-md">{registration.confirmedAt ? formatDate(registration.confirmedAt) : "-"}</td>
                <td className="px-md py-md">
                  <Badge tone={getStatusTone(registration.status)}>
                    {getStatusLabel(registration.status)}
                  </Badge>
                </td>
                <td className="px-md py-md">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="ghost" onClick={() => openTeamDetail(registration.id)}>
                      Chi tiết
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => updateStatus(registration.id, "CONFIRMED")}
                      data-testid={`approve-registration-${registration.id}`}
                    >
                      Duyệt
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => updateStatus(registration.id, "WAITLIST")}
                    >
                      Cho
                    </Button>
                    <ConfirmAction
                      title="Từ chối hồ sơ?"
                      message="Doi se khong duoc tinh vao danh sach tham gia hop le. Hay chac chan da lien he doi truoc khi tu choi."
                      confirmLabel="Từ chối"
                      onConfirm={() => updateStatus(registration.id, "REJECTED", "Từ chối boi ban to chuc")}
                    >
                      <Button type="button" variant="danger">
                        Từ chối
                      </Button>
                    </ConfirmAction>
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      </section>

      {detailLoading || detailTeam ? (
        <section className="rounded-xl border border-outline-variant bg-surface-container p-lg space-y-md">
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
