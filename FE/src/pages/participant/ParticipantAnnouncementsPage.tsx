import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { enableAnnouncements } from "../../config/features";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { queryKeys } from "../../lib/queryKeys";
import { fetchPublishedAnnouncements } from "../../services/announcementService";
import { resolveApiError } from "../../utils/apiError";

export function ParticipantAnnouncementsPage() {
  const { eventId, event, loading: eventLoading } = useActiveEvent();

  const query = useQuery({
    queryKey: queryKeys.announcements.byEvent(eventId),
    queryFn: () => fetchPublishedAnnouncements(eventId!),
    enabled: enableAnnouncements && eventId != null
  });

  if (eventLoading || query.isLoading) {
    return <ModuleSkeleton rows={4} />;
  }

  if (!enableAnnouncements) {
    return (
      <p className="font-body-sm text-on-surface-variant">
        Tính năng thông báo chưa được bật trên môi trường này.
      </p>
    );
  }

  if (query.isError) {
    return (
      <RetryPanel
        message={resolveApiError(query.error, "Không tải được thông báo.")}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const items = query.data ?? [];

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Thông báo"
        title={event?.name ?? "Cuộc thi"}
        description="Thông báo chính thức từ ban tổ chức cho cuộc thi đang tham gia."
        actions={
          eventId ? (
            <Link to={`/events/${eventId}`} className="font-label-sm text-primary hover:underline">
              Chi tiết cuộc thi
            </Link>
          ) : null
        }
      />
      {items.length === 0 ? (
        <p className="rounded-xl border border-outline-variant bg-surface-container p-md font-body-sm text-on-surface-variant">
          Chưa có thông báo nào được công bố.
        </p>
      ) : (
        <ul className="space-y-md">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-outline-variant bg-surface-container p-md"
            >
              <p className="font-label-md text-on-surface">{item.title}</p>
              <p className="mt-xs font-body-sm text-on-surface-variant whitespace-pre-wrap">
                {item.content}
              </p>
              {item.publishedAt ? (
                <p className="mt-sm font-label-sm text-outline">
                  {new Date(item.publishedAt).toLocaleString("vi-VN")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
