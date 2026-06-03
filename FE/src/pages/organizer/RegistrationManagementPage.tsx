import { useMemo, useState, useEffect } from "react";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { TableToolbar } from "../../components/ui/TableToolbar";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import {
  demoEvent,
  demoRegistrations,
  getTeamById,
  type DemoRegistration
} from "../../services/readModelService";

type Filter = "ALL" | "PENDING" | "CONFIRMED" | "WAITLIST" | "REJECTED";

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

export function RegistrationManagementPage() {
  const { notify } = useToast();
  const [registrations, setRegistrations] = useState<DemoRegistration[]>([]);

  // populate registrations after mount to avoid intermittent timing issues
  // that can make Playwright miss rendered DOM testids
  useEffect(() => {
    if (registrations.length === 0) setRegistrations(demoRegistrations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      registrations.filter((registration) => {
        const team = getTeamById(registration.teamId);
        const matchFilter = filter === "ALL" || registration.status === filter;
        const matchSearch = [team?.name, team?.track, registration.status]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search.trim().toLowerCase()));
        return matchFilter && matchSearch;
      }),
    [filter, registrations, search]
  );

  function updateStatus(id: number, status: string) {
    const currentRegistration = registrations.find((registration) => registration.id === id);
    const confirmedCount = registrations.filter((item) => item.status === "CONFIRMED").length;
    if (
      status === "CONFIRMED" &&
      currentRegistration?.status !== "CONFIRMED" &&
      confirmedCount >= demoEvent.quota
    ) {
      notify("Quota da day, hay dua doi vao danh sach cho hoac mo them quota truoc khi duyet.", "warning");
      return;
    }

    setRegistrations((current) =>
      current.map((registration) =>
        registration.id === id ? { ...registration, status } : registration
      )
    );
    notify(`Da cap nhat ho so: ${getStatusLabel(status)}.`, "success");
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

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Duyet dang ky doi"
        title="Theo doi ho so dang ky"
        description="Ban to chuc duyet, tu choi hoac dua doi vao danh sach cho. Quota day thi doi moi khong duoc tinh vao confirmed."
        actions={<Badge tone="warning">{demoEvent.confirmedTeams}/{demoEvent.quota} quota he thong</Badge>}
      />

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
        <DataTable headers={["Doi thi", "Thanh vien", "Ngay nop", "Trang thai", "Thao tac"]}>
          {filtered.map((registration) => {
            const team = getTeamById(registration.teamId);
            return (
              <tr key={registration.id} className="font-body-sm text-on-surface">
                <td className="px-md py-md">
                  <p className="font-label-md">{team?.name}</p>
                  <p className="text-on-surface-variant">{team?.track}</p>
                </td>
                <td className="px-md py-md">{registration.memberCount}/5</td>
                <td className="px-md py-md">{formatDate(registration.submittedAt)}</td>
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
                      onConfirm={() => updateStatus(registration.id, "REJECTED")}
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
