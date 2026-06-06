import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { queryKeys } from "../../lib/queryKeys";
import {
  createEventAnnouncement,
  fetchEventAnnouncements,
  type AnnouncementAudience,
  type AnnouncementItem
} from "../../services/announcementService";
import { getApiErrorMessage } from "../../utils/apiError";
import { mapOrganizerErrorMessage } from "../../utils/organizerErrors";

function formatWhen(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  ALL: "Mọi người tham gia",
  PARTICIPANTS: "Chỉ participant (đội)",
  STAFF: "Chỉ mentor & giám khảo"
};

export function AnnouncementPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>("ALL");
  const [publishNow, setPublishNow] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const announcementsQuery = useQuery({
    queryKey: queryKeys.announcements.byEvent(eventId),
    queryFn: () => fetchEventAnnouncements(eventId!),
    enabled: Boolean(eventId)
  });

  async function invalidateAnnouncements() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.announcements.byEvent(eventId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!eventId || !title.trim() || !content.trim()) {
      notify("Nhập tiêu đề và nội dung.", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createEventAnnouncement(eventId, {
        title: title.trim(),
        content: content.trim(),
        publishNow,
        audience
      });
      setTitle("");
      setContent("");
      await invalidateAnnouncements();
      if (publishNow) {
        notify(
          created.recipientCount != null && created.recipientCount > 0
            ? `Đã gửi tới ${created.recipientCount} người nhận.`
            : "Đã tạo thông báo.",
          "success"
        );
      } else {
        notify("Đã lưu nháp — chưa gửi tới người nhận.", "success");
      }
    } catch (err) {
      notify(mapOrganizerErrorMessage(getApiErrorMessage(err, "Gửi thông báo thất bại.")), "danger");
    } finally {
      setSubmitting(false);
    }
  }

  if (eventLoading || announcementsQuery.isLoading) {
    return <ModuleSkeleton rows={5} variant="table" />;
  }

  const items = announcementsQuery.data ?? [];

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Truyền thông"
        title="Thông báo chung"
        description="Gửi thông báo tới participant, mentor và giám khảo đã tham gia cuộc thi. Mỗi người nhận một thông báo in-app."
      />

      <EventSelector events={events} eventId={eventId} onChange={setEventId} />

      {announcementsQuery.isError ? (
        <RetryPanel message="Không tải được lịch sử thông báo." onRetry={() => void announcementsQuery.refetch()} />
      ) : null}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-md rounded-xl border border-outline-variant/60 bg-surface-container p-lg"
      >
        <h2 className="font-headline-sm text-on-surface">Gửi thông báo mới</h2>
        <label className="block space-y-xs">
          <span className="font-label-md text-on-surface">Tiêu đề</span>
          <input
            className="w-full rounded-lg border border-outline-variant bg-surface px-sm py-2 font-body-md"
            value={title}
            maxLength={255}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Cập nhật lịch nộp bài"
          />
        </label>
        <label className="block space-y-xs">
          <span className="font-label-md text-on-surface">Nội dung</span>
          <textarea
            className="min-h-[120px] w-full rounded-lg border border-outline-variant bg-surface px-sm py-2 font-body-md"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nội dung chi tiết gửi tới người tham gia cuộc thi…"
          />
        </label>
        <label className="block space-y-xs">
          <span className="font-label-md text-on-surface">Đối tượng nhận</span>
          <select
            className="w-full rounded-lg border border-outline-variant bg-surface px-sm py-2 font-body-md"
            value={audience}
            onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
          >
            {(Object.keys(AUDIENCE_LABELS) as AnnouncementAudience[]).map((key) => (
              <option key={key} value={key}>
                {AUDIENCE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-sm font-body-md text-on-surface">
          <input
            type="checkbox"
            checked={publishNow}
            onChange={(e) => setPublishNow(e.target.checked)}
          />
          Gửi ngay (bỏ chọn để lưu nháp)
        </label>
        <Button type="submit" disabled={submitting || !eventId}>
          {submitting ? "Đang gửi…" : publishNow ? "Gửi thông báo" : "Lưu nháp"}
        </Button>
      </form>

      <section className="space-y-sm">
        <h2 className="font-headline-sm text-on-surface">Lịch sử đã gửi</h2>
        {items.length === 0 ? (
          <EmptyState icon="campaign" title="Chưa có thông báo" description="Thông báo đã gửi sẽ hiển thị tại đây." />
        ) : (
          <ul className="space-y-sm">
            {items.map((item: AnnouncementItem) => (
              <li key={item.id} className="rounded-xl border border-outline-variant/60 bg-surface-container-low p-md">
                <div className="flex flex-wrap items-start justify-between gap-sm">
                  <div>
                    <p className="font-headline-sm text-on-surface">{item.title}</p>
                    <p className="mt-xs font-label-sm text-on-surface-variant">{formatWhen(item.publishedAt ?? item.createdAt)}</p>
                    {item.audience ? (
                      <p className="mt-xs font-label-sm text-outline">{AUDIENCE_LABELS[item.audience]}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {item.publishedAt ? (
                      <Badge tone="success">Đã gửi</Badge>
                    ) : (
                      <Badge tone="neutral">Nháp</Badge>
                    )}
                    {item.recipientCount != null && item.publishedAt ? (
                      <span className="font-label-sm text-on-surface-variant">{item.recipientCount} người nhận</span>
                    ) : null}
                  </div>
                </div>
                <p className="mt-sm whitespace-pre-wrap font-body-md text-on-surface-variant">{item.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
