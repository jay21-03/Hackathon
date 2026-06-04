import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { fetchPublicEvents } from "../../services/eventsApi";
import type { EventListItem } from "../../types/entities";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", { dateStyle: "medium" });
}

export function EventManagementPage() {
  const navigate = useNavigate();
  const { setEventId } = useActiveEvent();
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicEvents()
      .then((result) => setEvents(result))
      .catch(() => setError("Không tải được danh sách cuộc thi."))
      .finally(() => setLoading(false));
  }, []);

  const primaryEvent = events[0] ?? null;

  function openEvent(event: EventListItem) {
    setEventId(event.id);
    navigate("/organizer/events/basic-info");
  }

  if (loading) {
    return <ModuleSkeleton rows={4} />;
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Cuộc thi"
        title="Quản lý cấu hình cuộc thi"
        description="Theo dõi thời gian đăng ký, quota, kích thước đội và trạng thái từng cuộc thi."
        actions={
          <>
            <ButtonLink to="/organizer/events/wizard" variant="ghost" icon={<Icon name="route" />}>
              Quy trình
            </ButtonLink>
            <ButtonLink to="/organizer/events/new" icon={<Icon name="add_circle" />}>
              Tạo cuộc thi
            </ButtonLink>
          </>
        }
      />

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Tổng cuộc thi" value={events.length} helper="Đọc từ hệ thống" icon="groups" />
        <StatCard
          label="Trạng thái đầu tiên"
          value={primaryEvent ? getStatusLabel(primaryEvent.status) : "—"}
          helper={primaryEvent ? primaryEvent.name : "Chưa có dữ liệu"}
          icon="group"
          tone="success"
        />
        <StatCard
          label="Ngày bắt đầu"
          value={primaryEvent ? formatDate(primaryEvent.startDate) : "—"}
          helper="Theo cuộc thi đầu tiên"
          icon="schedule"
          tone="warning"
        />
      </section>

      {error ? (
        <p className="rounded-lg border border-error-container bg-error-container/30 p-md font-body-sm text-on-surface">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="table-header-bg">
              <tr className="font-label-sm text-on-surface-variant">
                <th className="px-md py-sm">Cuộc thi</th>
                <th className="px-md py-sm">Đăng ký</th>
                <th className="px-md py-sm">Diễn ra</th>
                <th className="px-md py-sm">Trạng thái</th>
                <th className="px-md py-sm">Thao tác</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {events.map((event) => (
                <tr key={event.id} className="font-body-sm text-on-surface">
                  <td className="px-md py-md font-label-md">{event.name}</td>
                  <td className="px-md py-md">
                    {formatDate(event.registrationStartAt)} – {formatDate(event.registrationEndAt)}
                  </td>
                  <td className="px-md py-md">
                    {formatDate(event.startDate)} – {formatDate(event.endDate)}
                  </td>
                  <td className="px-md py-md">
                    <Badge tone={getStatusTone(event.status)}>{getStatusLabel(event.status)}</Badge>
                  </td>
                  <td className="px-md py-md">
                    <button
                      type="button"
                      onClick={() => openEvent(event)}
                      className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-sm py-1 font-label-md text-on-surface hover:bg-surface-container-high"
                    >
                      <Icon name="edit" className="text-[18px]" />
                      Chỉnh sửa
                    </button>
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
