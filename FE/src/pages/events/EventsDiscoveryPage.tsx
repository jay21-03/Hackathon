import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EventCard } from "../../components/events/EventCard";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { Icon } from "../../components/ui/Icon";
import { fetchPublicEvents } from "../../services/eventsApi";
import type { EventListItem } from "../../types/entities";

type Filter = "all" | "upcoming" | "active";

export function EventsDiscoveryPage() {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let cancelled = false;
    fetchPublicEvents()
      .then((result) => {
        if (cancelled) return;
        setEvents(result.data);
        setUsingFallback(result.usingFallback);
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
    { id: "all", label: "Tat ca" },
    { id: "upcoming", label: "Sap dien ra" },
    { id: "active", label: "Dang mo" }
  ];

  return (
    <div className="space-y-lg">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-md border-b border-outline-variant pb-lg">
        <div>
          <h1 className="font-headline-lg text-on-surface">Danh sach cuoc thi</h1>
          <p className="font-body-md text-on-surface-variant mt-xs">
            Tim cuoc thi phu hop, xem thoi gian dang ky va bat dau tao doi.
          </p>
        </div>
        <Link
          to="/register"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-2 font-label-md text-on-primary-container shadow-sm hover:bg-primary"
        >
          <Icon name="group_add" className="text-[18px]" />
          Dang ky doi
        </Link>
      </section>

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
            placeholder="Tim kiem theo ten cuoc thi..."
            className="form-input w-full py-3 pl-10 pr-4"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={`flex-shrink-0 rounded-lg px-4 py-1.5 font-label-sm normal-case transition-colors ${
                filter === chip.id
                  ? "bg-primary-container text-on-primary-container"
                  : "border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </section>

      {loading && <ModuleSkeleton rows={3} />}

      {!loading && usingFallback && (
        <div className="rounded-xl border border-primary/20 bg-primary-fixed p-md">
          <p className="font-body-sm text-on-surface-variant">
            Dang hien thi du lieu minh hoa de xem nhanh giao dien. Khi co du lieu tu he thong,
            danh sach se tu cap nhat theo cac cuoc thi da tao.
          </p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-outline-variant bg-surface p-lg text-center shadow-sm">
          <Icon name="event_busy" className="text-4xl text-outline mb-md mx-auto" />
          <p className="font-headline-sm mb-sm">Chua co cuoc thi phu hop</p>
          <p className="font-body-sm text-on-surface-variant mb-md">
            Hay thu doi bo loc hoac quay lai danh sach tat ca cuoc thi.
          </p>
          <Link to="/organizer/dashboard" className="text-primary font-label-md">
            Mo trang Ban to chuc
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
        {filtered.map((event, i) => (
          <EventCard key={event.id} event={event} highlight={i === 0 && filter === "all"} />
        ))}
      </div>
    </div>
  );
}
