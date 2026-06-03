import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { fetchPublicEvents } from "../../services/eventsApi";
import type { EventListItem } from "../../types/entities";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", { dateStyle: "medium" });
}

export function EventManagementPage() {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicEvents()
      .then((result) => setEvents(result))
      .catch(() => setError("Khong tai duoc danh sach cuoc thi."))
      .finally(() => setLoading(false));
  }, []);

  const primaryEvent = useMemo(() => events[0] ?? null, [events]);

  if (loading) {
    return <ModuleSkeleton rows={4} />;
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Cuoc thi"
        title="Quan ly cau hinh cuoc thi"
        description="Theo doi thoi gian dang ky, quota, kich thuoc doi va trang thai cong bo cua tung cuoc thi."
        actions={
          <ButtonLink to="/organizer/events/new" icon={<Icon name="add_circle" />}>
            Tao cuoc thi
          </ButtonLink>
        }
      />

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Tong cuoc thi" value={events.length} helper="Doc tu he thong" icon="groups" />
        <StatCard
          label="Trang thai dau tien"
          value={primaryEvent ? getStatusLabel(primaryEvent.status) : "-"}
          helper={primaryEvent ? primaryEvent.name : "Chua co du lieu"}
          icon="group"
          tone="success"
        />
        <StatCard
          label="Ngay bat dau"
          value={primaryEvent ? formatDate(primaryEvent.startDate) : "-"}
          helper="Theo event dau tien"
          icon="schedule"
          tone="warning"
        />
      </section>

      {error ? (
        <p className="rounded-lg border border-error/40 bg-error-container/40 p-md font-body-sm text-on-surface">{error}</p>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="table-header-bg">
              <tr className="font-label-sm text-on-surface-variant">
                <th className="px-md py-sm">Cuoc thi</th>
                <th className="px-md py-sm">Dang ky</th>
                <th className="px-md py-sm">Dien ra</th>
                <th className="px-md py-sm">Trang thai</th>
                <th className="px-md py-sm">Thao tac</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {events.map((event) => (
                <tr key={event.id} className="font-body-sm text-on-surface">
                  <td className="px-md py-md font-label-md">{event.name}</td>
                  <td className="px-md py-md">{formatDate(event.registrationStartAt)} - {formatDate(event.registrationEndAt)}</td>
                  <td className="px-md py-md">{formatDate(event.startDate)} - {formatDate(event.endDate)}</td>
                  <td className="px-md py-md">
                    <Badge tone={getStatusTone(event.status)}>{getStatusLabel(event.status)}</Badge>
                  </td>
                  <td className="px-md py-md">
                    <ButtonLink to="/organizer/events/basic-info" variant="secondary" icon={<Icon name="edit" />}>
                      Chinh sua
                    </ButtonLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
