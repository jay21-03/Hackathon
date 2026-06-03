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
      className={`flex flex-col overflow-hidden rounded-xl border bg-surface shadow-sm transition-colors hover:border-primary/50 ${
        highlight ? "border-primary" : "border-outline-variant"
      }`}
    >
      <div className="flex items-start justify-between gap-md border-b border-outline-variant bg-surface-container-low p-md">
        <div className="min-w-0">
          <p className="font-label-sm normal-case text-on-surface-variant">
            Ma cuoc thi #{event.id}
          </p>
          <h2 className="mt-xs line-clamp-2 font-headline-sm text-on-surface">{event.name}</h2>
        </div>
        <Badge tone={getStatusTone(event.status)}>{getStatusLabel(event.status)}</Badge>
        {highlight && (
          <div className="hidden sm:block">
            <Badge tone="ai">Noi bat</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col space-y-md p-md">
        <div className="space-y-1">
          <p className="font-body-sm text-on-surface-variant line-clamp-2">
            Dang ky doi, theo doi lich thi, nhan de va xem ket qua cong bo.
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

        <div className="mt-auto flex items-center justify-between border-t border-outline-variant pt-sm">
          <span className="font-label-sm normal-case text-on-surface-variant">
            Mo dang ky theo lich
          </span>
          <Link
            to={`/events/${event.id}`}
            className="rounded-lg bg-primary-container px-4 py-2 font-label-md text-on-primary-container transition-colors hover:bg-primary"
          >
            Xem chi tiet
          </Link>
        </div>
      </div>
    </article>
  );
}
