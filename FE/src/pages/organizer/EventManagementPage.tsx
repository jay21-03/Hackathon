import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { enableAcademicTerms } from "../../config/features";
import { AcademicTermSelector } from "../../components/ui/AcademicTermSelector";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useActiveTerm } from "../../hooks/useActiveTerm";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { fetchPublicEvents } from "../../services/eventsApi";
import type { EventListItem } from "../../types/entities";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", { dateStyle: "medium" });
}

export function EventManagementPage() {
  const navigate = useNavigate();
  const { setEventId } = useActiveEvent();
  const { termId, terms, setTermId } = useActiveTerm();
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchPublicEvents(enableAcademicTerms ? (termId ?? undefined) : undefined)
      .then((result) => setEvents(result))
      .catch(() => setError("Không tải được danh sách cuộc thi."))
      .finally(() => setLoading(false));
  }, [termId]);

  const openRegistrationCount = events.filter((e) => e.status === "REGISTRATION_OPEN").length;
  const draftCount = events.filter((e) => e.status === "DRAFT").length;

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
        description="Chọn cuộc thi để chỉnh sửa và hoàn tất thiết lập theo từng bước."
        actions={
          <div className="flex flex-wrap items-center gap-sm">
            {enableAcademicTerms ? (
              <AcademicTermSelector terms={terms} termId={termId} onChange={setTermId} />
            ) : null}
            <ButtonLink to="/organizer/events/new" icon={<Icon name="add_circle" />}>
              Tạo cuộc thi
            </ButtonLink>
          </div>
        }
      />

      <section className="grid gap-md md:grid-cols-3">
        <StatCard
          label="Tổng cuộc thi"
          value={events.length}
          helper="Tất cả cuộc thi trong hệ thống"
          icon="event"
        />
        <StatCard
          label="Đang mở đăng ký"
          value={openRegistrationCount}
          helper="BTC đã bật trạng thái nhận đội"
          icon="how_to_reg"
          tone="success"
        />
        <StatCard
          label="Bản nháp"
          value={draftCount}
          helper="Chưa mở cho thí sinh đăng ký"
          icon="edit_note"
          tone="warning"
        />
      </section>

      {error ? (
        <p className="rounded-lg border border-error-container bg-error-container/30 p-md font-body-sm text-on-surface">
          {error}
        </p>
      ) : null}

      {events.length === 0 ? (
        <EmptyState
          icon="event_busy"
          title="Chưa có cuộc thi"
          description="Tạo cuộc thi mới để bắt đầu thiết lập đăng ký, bảng thi và đề."
          action={
            <ButtonLink to="/organizer/events/new" icon={<Icon name="add_circle" />}>
              Tạo cuộc thi
            </ButtonLink>
          }
        />
      ) : (
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="table-header-bg">
              <tr className="font-label-sm text-on-surface-variant">
                <th className="px-sm py-2">Cuộc thi</th>
                <th className="px-sm py-2">Đăng ký</th>
                <th className="px-sm py-2">Diễn ra</th>
                <th className="px-sm py-2">Trạng thái</th>
                <th className="px-sm py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {events.map((event) => (
                <tr key={event.id} className="font-body-sm text-on-surface">
                  <td className="px-sm py-2 font-label-md">{event.name}</td>
                  <td className="px-sm py-2">
                    {formatDate(event.registrationStartAt)} – {formatDate(event.registrationEndAt)}
                  </td>
                  <td className="px-sm py-2">
                    {formatDate(event.startDate)} – {formatDate(event.endDate)}
                  </td>
                  <td className="px-sm py-2">
                    <Badge tone={getStatusTone(event.status)}>{getStatusLabel(event.status)}</Badge>
                  </td>
                  <td className="px-sm py-2">
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
      )}
    </div>
  );
}
