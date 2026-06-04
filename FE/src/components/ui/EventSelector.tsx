import type { EventListItem } from "../../types/entities";

interface EventSelectorProps {
  events: EventListItem[];
  eventId: number | null;
  onChange: (eventId: number) => void;
  className?: string;
}

export function EventSelector({ events, eventId, onChange, className = "" }: EventSelectorProps) {
  if (events.length <= 1) {
    return null;
  }

  return (
    <label className={`flex items-center gap-2 ${className}`}>
      <span className="font-label-sm normal-case text-on-surface-variant">Cuộc thi</span>
      <select
        value={eventId ?? ""}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-label-md text-on-surface focus:border-primary focus:outline-none"
      >
        {events.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}
