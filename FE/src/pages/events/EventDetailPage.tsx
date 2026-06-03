import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/ui/Icon";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { fetchEventDetail, type EventDetail } from "../../services/eventsApi";

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch {
    return value;
  }
}

export function EventDetailPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    fetchEventDetail(eventId)
      .then((result) => {
        if (cancelled) return;
        setEvent(result.data);
        setUsingFallback(result.usingFallback);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading) {
    return <ModuleSkeleton rows={3} />;
  }

  if (!event) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface p-lg shadow-sm">
        <p className="text-error font-body-md">Khong tim thay cuoc thi.</p>
        <Link to="/events" className="text-primary font-label-md mt-md inline-block">
          Quay lai danh sach
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-lg max-w-3xl mx-auto">
      <Link to="/events" className="inline-flex items-center gap-1 text-primary font-label-md">
        <Icon name="arrow_back" className="text-[18px]" />
        Danh sach cuoc thi
      </Link>

      {usingFallback && (
        <div className="rounded-xl border border-primary/20 bg-primary-fixed p-md">
          <p className="font-body-sm text-on-surface-variant">
            Dang hien thi thong tin minh hoa de xem luong dang ky.
          </p>
        </div>
      )}

      <article className="space-y-lg rounded-xl border border-outline-variant bg-surface p-lg shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-md">
          <div>
            <h1 className="font-headline-lg text-on-surface">{event.name}</h1>
            <p className="font-body-md text-on-surface-variant mt-xs">
              Tao doi thi, moi thanh vien va theo doi cac moc thoi gian cua cuoc thi.
            </p>
          </div>
          <Badge tone={getStatusTone(event.status)}>{getStatusLabel(event.status)}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-md font-body-sm text-on-surface-variant">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-md">
            <Icon name="calendar_today" className="text-primary mb-sm" />
            <p className="font-label-sm normal-case text-on-surface">Thoi gian thi</p>
            <p>{formatDateTime(event.startDate)}</p>
            <p>{formatDateTime(event.endDate)}</p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-md">
            <Icon name="groups" className="text-primary mb-sm" />
            <p className="font-label-sm normal-case text-on-surface">Quy mo doi</p>
            <p>
              {event.minTeamSize} - {event.maxTeamSize} thanh vien
            </p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-md">
            <Icon name="emoji_events" className="text-primary mb-sm" />
            <p className="font-label-sm normal-case text-on-surface">So doi toi da</p>
            <p>{event.maxTeams} doi</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-sm pt-md border-t border-outline-variant/30">
          <Link
            to="/register"
            className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-label-md"
          >
            Dang ky tham gia
          </Link>
          <Link
            to="/me/team"
            className="border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-label-md hover:bg-surface-variant"
          >
            Xem doi cua toi
          </Link>
        </div>
      </article>
    </div>
  );
}
