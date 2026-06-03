import { Link } from "react-router-dom";
import type { EventListItem } from "../../types/entities";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/ui/Icon";
import { getStatusLabel, getStatusTone } from "../../domain/status";

function formatDateRange(start: string, end: string) {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric"
    };
    return `${s.toLocaleDateString("vi-VN", opts)} - ${e.toLocaleDateString("vi-VN", opts)}`;
  } catch {
    return `${start} - ${end}`;
  }
}

interface EventCardProps {
  event: EventListItem;
  highlight?: boolean;
}

export function EventCard({ event, highlight }: EventCardProps) {
  return (
    <article
      className={`glass-panel rounded-xl overflow-hidden flex flex-col transition-transform active:scale-[0.98] ${
        highlight ? "ai-accent" : ""
      }`}
    >
      <div className="relative h-40 w-full bg-surface-container-highest bg-gradient-to-br from-primary-container/30 to-surface-container">
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <Icon name="emoji_events" className="text-[80px] text-primary" />
        </div>
        <div className="absolute top-3 right-3">
          <Badge tone={getStatusTone(event.status)}>{getStatusLabel(event.status)}</Badge>
        </div>
        {highlight && (
          <div className="absolute top-3 left-3">
            <Badge tone="ai">Noi bat</Badge>
          </div>
        )}
      </div>

      <div className="p-md space-y-md flex-1 flex flex-col">
        <div className="space-y-1">
          <h2 className="font-headline-sm text-on-surface">{event.name}</h2>
          <p className="font-body-sm text-on-surface-variant line-clamp-2">
            Cuoc thi hackathon danh cho cac doi thi, mentor, giam khao va ban to chuc.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-md text-on-surface-variant">
          <div className="flex items-center gap-2">
            <Icon name="calendar_today" className="text-[18px] text-primary" />
            <span className="font-label-sm normal-case tracking-normal">
              {formatDateRange(event.startDate, event.endDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="groups" className="text-[18px] text-primary" />
            <span className="font-label-sm normal-case tracking-normal">Doi 1-5 nguoi</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-sm mt-auto border-t border-outline-variant/30">
          <span className="font-label-sm text-on-surface-variant normal-case">
            Ma cuoc thi #{event.id}
          </span>
          <Link
            to={`/events/${event.id}`}
            className="bg-primary text-on-primary px-4 py-2 rounded font-label-md hover:brightness-110 transition-all"
          >
            Xem chi tiet
          </Link>
        </div>
      </div>
    </article>
  );
}
