import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EventCard } from "../../components/events/EventCard";
import { Icon } from "../../components/ui/Icon";
import { fetchPublicEvents } from "../../services/eventsApi";
import type { EventListItem } from "../../types/entities";

type Filter = "all" | "upcoming" | "active";

export function EventsDiscoveryPage() {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let cancelled = false;
    fetchPublicEvents()
      .then((list) => {
        if (!cancelled) setEvents(list);
      })
      .catch(() => {
        if (!cancelled) setError("Không tải được sự kiện từ backend.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = events;
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((e) => e.name.toLowerCase().includes(q));
    if (filter === "active") {
      list = list.filter((e) =>
        ["ACTIVE", "OPEN", "PUBLISHED"].includes(e.status.toUpperCase())
      );
    }
    if (filter === "upcoming") {
      list = list.filter((e) =>
        ["DRAFT", "UPCOMING", "REGISTRATION"].some((s) =>
          e.status.toUpperCase().includes(s)
        )
      );
    }
    return list;
  }, [events, query, filter]);

  const chips: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "upcoming", label: "Upcoming" },
    { id: "active", label: "Active" }
  ];

  return (
    <div className="space-y-lg">
      <section className="space-y-md">
        <div className="relative">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search operational events..."
            className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-3 pl-10 pr-4 font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full font-label-sm normal-case transition-transform active:scale-95 ${
                filter === chip.id
                  ? "bg-secondary-container text-on-secondary-container"
                  : "bg-surface-variant text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </section>

      {loading && (
        <p className="font-body-md text-on-surface-variant text-center py-8">
          Đang tải sự kiện...
        </p>
      )}

      {error && (
        <div className="glass-panel rounded-xl p-md border border-error/30 text-error">
          <p className="font-body-md">{error}</p>
          <p className="font-body-sm text-on-surface-variant mt-2">
            Chạy PostgreSQL + backend trong <code className="text-primary">BE/</code> (cổng 8085).
          </p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="glass-panel rounded-xl p-lg text-center">
          <Icon name="event_busy" className="text-4xl text-outline mb-md mx-auto" />
          <p className="font-headline-sm mb-sm">Chưa có sự kiện</p>
          <p className="font-body-sm text-on-surface-variant mb-md">
            Organizer có thể tạo sự kiện qua Swagger hoặc dashboard.
          </p>
          <Link to="/organizer/dashboard" className="text-primary font-label-md">
            Mở Organizer Dashboard →
          </Link>
        </div>
      )}

      <div className="space-y-md">
        {filtered.map((event, i) => (
          <EventCard key={event.id} event={event} highlight={i === 0 && filter === "all"} />
        ))}
      </div>
    </div>
  );
}
