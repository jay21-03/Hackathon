import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setStoredActiveEventId } from "../../hooks/useActiveEvent";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../components/feedback/ToastProvider";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { useNotifications } from "../../hooks/useNotifications";
import { queryKeys } from "../../lib/queryKeys";
import {
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
  type NotificationType
} from "../../services/notificationService";
import { resolveNotificationError } from "../../utils/notificationErrors";

const PAGE_SIZE = 20;

const TYPE_FILTER_OPTIONS: { value: "" | NotificationType; label: string }[] = [
  { value: "", label: "Tất cả loại" },
  { value: "ANNOUNCEMENT", label: "Thông báo chung" },
  { value: "TEAM_INVITE", label: "Lời mời đội" },
  { value: "TEAM_STATUS", label: "Trạng thái đội" },
  { value: "SLOT_ASSIGNED", label: "Gán đội vào bảng" },
  { value: "SUBMISSION", label: "Bài nộp" },
  { value: "PROBLEM_RELEASED", label: "Công bố đề" },
  { value: "RANKING_PUBLISHED", label: "Kết quả xếp hạng" },
  { value: "STAFF_INVITE", label: "Lời mời BTC" }
];

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function resolveDeepLink(item: NotificationItem) {
  if (item.linkUrl) return item.linkUrl;
  if (item.eventId) return `/me?eventId=${item.eventId}`;
  return null;
}

export function NotificationsPage({
  eyebrow = "Thông báo",
  title = "Thông báo của bạn",
  description = "Cập nhật lời mời đội, công bố kết quả và các sự kiện liên quan cuộc thi."
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  const navigate = useNavigate();
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState<"" | NotificationType>("");
  const notificationsQuery = useNotifications(page, PAGE_SIZE, typeFilter || null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const items = notificationsQuery.data?.items ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const total = notificationsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  }, [queryClient]);

  async function handleMarkRead(item: NotificationItem) {
    if (item.read) return;
    setBusyId(item.id);
    try {
      await markNotificationRead(item.id);
      await invalidate();
    } catch (err) {
      notify(resolveNotificationError(err, "Không đánh dấu đã đọc."), "danger");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      await invalidate();
      notify("Đã đánh dấu tất cả là đã đọc.", "success");
    } catch (err) {
      notify(resolveNotificationError(err, "Không cập nhật được thông báo."), "danger");
    } finally {
      setMarkingAll(false);
    }
  }

  function handleTypeChange(next: string) {
    setTypeFilter(next as "" | NotificationType);
    setPage(0);
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          unreadCount > 0 ? (
            <Button type="button" variant="secondary" disabled={markingAll} onClick={() => void handleMarkAllRead()}>
              Đánh dấu tất cả đã đọc
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-end justify-between gap-md">
        <label className="block space-y-xs">
          <span className="font-label-md text-on-surface">Lọc theo loại</span>
          <select
            className="rounded-lg border border-outline-variant bg-surface px-sm py-2 font-body-md"
            value={typeFilter}
            onChange={(e) => handleTypeChange(e.target.value)}
          >
            {TYPE_FILTER_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {total > 0 ? (
          <p className="font-label-sm text-on-surface-variant">
            {total} thông báo · trang {page + 1}/{totalPages}
          </p>
        ) : null}
      </div>

      {notificationsQuery.isLoading ? (
        <p className="font-body-md text-on-surface-variant">Đang tải…</p>
      ) : notificationsQuery.isError ? (
        <div className="rounded-xl border border-error/30 bg-error-container/20 p-md">
          <p className="font-body-md text-error">
            {resolveNotificationError(notificationsQuery.error, "Không tải được thông báo.")}
          </p>
          <Button type="button" className="mt-md" variant="secondary" onClick={() => void notificationsQuery.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container p-lg text-center">
          <Icon name="notifications_none" className="mx-auto text-[40px] text-outline" />
          <p className="mt-md font-headline-sm text-on-surface">Chưa có thông báo</p>
          <p className="mt-xs font-body-sm text-on-surface-variant">
            {typeFilter
              ? "Không có thông báo thuộc loại đã chọn."
              : "Lời mời đội và công bố kết quả sẽ hiển thị tại đây."}
          </p>
        </div>
      ) : (
        <ul className="space-y-sm">
          {items.map((item) => {
            const deepLink = resolveDeepLink(item);
            return (
              <li
                key={item.id}
                className={`rounded-xl border p-md ${
                  item.read
                    ? "border-outline-variant/60 bg-surface-container-low"
                    : "border-primary/30 bg-primary-container/10"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-headline-sm text-on-surface">{item.title}</p>
                    {item.eventName ? (
                      <p className="mt-xs font-label-sm text-on-surface-variant">{item.eventName}</p>
                    ) : null}
                    <p className="mt-sm font-body-md text-on-surface-variant">{item.content}</p>
                    <p className="mt-sm font-label-sm text-outline">{formatWhen(item.createdAt)}</p>
                    {deepLink ? (
                      <button
                        type="button"
                        className="mt-sm inline-flex items-center gap-1 font-label-md text-primary hover:underline"
                        onClick={() => {
                          if (item.eventId) setStoredActiveEventId(item.eventId);
                          if (!item.read) void handleMarkRead(item);
                          navigate(deepLink);
                        }}
                      >
                        Xem chi tiết
                        <Icon name="arrow_forward" className="text-[16px]" />
                      </button>
                    ) : null}
                  </div>
                  {!item.read ? (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busyId === item.id}
                      onClick={() => void handleMarkRead(item)}
                    >
                      Đánh dấu đã đọc
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-label-sm text-outline">
                      <Icon name="done_all" className="text-[16px]" />
                      Đã đọc
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-sm">
          <Button
            type="button"
            variant="secondary"
            disabled={page <= 0 || notificationsQuery.isFetching}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Trang trước
          </Button>
          <span className="font-label-md text-on-surface-variant">
            {page + 1} / {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={page >= totalPages - 1 || notificationsQuery.isFetching}
            onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
          >
            Trang sau
          </Button>
        </div>
      ) : null}
    </div>
  );
}
