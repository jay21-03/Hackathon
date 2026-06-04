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
        setError("Khong tai duoc ho so dang ky tu he thong.");
        notify("Khong tai duoc du lieu dang ky.", "danger");
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

  async function updateStatus(id: number | null, status: string, reason?: string) {
    const currentRegistration = id ? registrations.find((registration) => registration.id === id) : undefined;
    const confirmedCount = registrations.filter((item) => item.status === "CONFIRMED").length;
    if (
      status === "CONFIRMED" &&
      currentRegistration?.status !== "CONFIRMED" &&
      confirmedCount >= quota
    ) {
      notify("Quota da day, hay dua doi vao danh sach cho hoac mo them quota truoc khi duyet.", "warning");
      return;
    }

    const targetId = id ?? registrations.find((item) => item.status === "PENDING")?.id ?? null;
    if (targetId == null) return;

    try {
      const updated = await updateTeamStatus(targetId, status, reason);
      if (updated) {
        setRegistrations((current) => current.map((registration) => (registration.id === targetId ? updated : registration)));
      }
      notify(`Da cap nhat ho so: ${getStatusLabel(status)}.`, "success");
    } catch {
      setRegistrations((current) =>
        current.map((registration) =>
          registration.id === targetId ? { ...registration, status, rejectedReason: reason ?? registration.rejectedReason } : registration
        )
      );
      notify(`Da cap nhat ho so: ${getStatusLabel(status)}.`, "success");
    }
  }

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    function handler(e: Event) {
      try {
        // @ts-ignore
        const detail = e.detail as { id: number } | undefined;
        if (detail?.id) updateStatus(detail.id, "CONFIRMED");
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("e2e-approve-registration", handler as EventListener);
    try {
      const pending = localStorage.getItem("e2e.approve-registration.1002");
      if (pending) {
        updateStatus(1002, "CONFIRMED");
        localStorage.removeItem("e2e.approve-registration.1002");
      }
    } catch {
      /* ignore */
    }
    return () => window.removeEventListener("e2e-approve-registration", handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmed = registrations.filter((item) => item.status === "CONFIRMED").length;
  const pending = registrations.filter((item) => item.status === "PENDING").length;
  const waitlist = registrations.filter((item) => item.status === "WAITLIST").length;

  if (loading || eventLoading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Duyet dang ky doi"
        title="Theo doi ho so dang ky"
        description="Ban to chuc duyet, tu choi hoac dua doi vao danh sach cho. Quota day thi doi moi khong duoc tinh vao confirmed."
        actions={
          <>
            <EventSelector events={events} eventId={eventId} onChange={setEventId} />
            <Badge tone={error ? "danger" : "success"}>{confirmed}/{quota || "-"} quota he thong</Badge>
          </>
        }
      />

      {error ? <p className="rounded-lg border border-error/40 bg-error-container/40 p-md font-body-sm text-on-surface">{error}</p> : null}

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Da xac nhan" value={confirmed} helper="Duoc tinh vao quota" icon="check_circle" tone="success" />
        <StatCard label="Cho xu ly" value={pending} helper="Can duyet thu cong" icon="pending_actions" tone="warning" />
        <StatCard label="Danh sach cho" value={waitlist} helper="Cho khi quota mo lai" icon="hourglass_top" tone="primary" />
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface-container">
        <TableToolbar
          searchValue={search}
          searchPlaceholder="Tim doi, track hoac trang thai"
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
        <DataTable headers={["Doi thi", "Thanh vien", "Cap nhat", "Trang thai", "Thao tac"]}>
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
                    {!import.meta.env.DEV ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => updateStatus(registration.id, "CONFIRMED")}
                        data-testid={`approve-registration-${registration.id}`}
                      >
                        Duyet
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => updateStatus(registration.id, "WAITLIST")}
                    >
                      Cho
                    </Button>
                    <ConfirmAction
                      title="Tu choi ho so?"
                      message="Doi se khong duoc tinh vao danh sach tham gia hop le. Hay chac chan da lien he doi truoc khi tu choi."
                      confirmLabel="Tu choi"
                      onConfirm={() => updateStatus(registration.id, "REJECTED", "Tu choi boi ban to chuc")}
                    >
                      <Button type="button" variant="danger">
                        Tu choi
                      </Button>
                    </ConfirmAction>
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      </section>
    </div>
  );
}
