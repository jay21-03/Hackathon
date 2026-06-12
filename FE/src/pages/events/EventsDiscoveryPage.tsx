import { useMemo, useState } from "react";
import { EventCard } from "../../components/events/EventCard";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { getAuthSession, isAuthenticated } from "../../auth/authSession";
import { eventListFilter, resolveEventCardAction } from "../../domain/eventParticipantFlow";
import { useMyTeamsMap } from "../../hooks/useMyTeamsMap";
import { usePublicEvents } from "../../hooks/usePublicEvents";

type Filter = "all" | "open" | "upcoming";

export function EventsDiscoveryPage() {
  const authenticated = isAuthenticated();
  const session = getAuthSession();
  const { events, loading, error } = usePublicEvents();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const eventIds = useMemo(() => events.map((e) => e.id), [events]);
  const { teamsByEventId, loading: teamsLoading } = useMyTeamsMap(
    eventIds,
    authenticated && session.role === "participant"
  );

  const filtered = useMemo(() => {
    let list = events;
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((e) => e.name.toLowerCase().includes(q));
    list = list.filter((e) => eventListFilter(e, filter));
    return list;
  }, [events, query, filter]);

  const chips: { id: Filter; label: string }[] = [
    { id: "all", label: "Tất cả" },
    { id: "open", label: "Đang mở đăng ký" },
    { id: "upcoming", label: "Sắp diễn ra" }
  ];

  const listLoading = loading || (authenticated && session.role === "participant" && teamsLoading);

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Trang chủ"
        title="Danh sách các cuộc thi"
        description={
          authenticated
            ? "Chọn cuộc thi, xem chi tiết rồi đăng ký đội — mỗi cuộc thi một đội."
            : "Xem thông tin và kết quả công bố — đăng nhập khi muốn đăng ký tham gia."
        }
      />

      <section className="space-y-md">
        <div className="relative">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên cuộc thi…"
            className="form-input w-full py-3 pl-10 pr-4"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={`shrink-0 rounded-lg px-4 py-1.5 font-label-sm normal-case transition-colors ${
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

      {listLoading && <ModuleSkeleton rows={3} variant="cards" />}

      {!listLoading && error && (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface-variant">{error}</p>
        </div>
      )}

      {!listLoading && !error && filtered.length === 0 && (
        <EmptyState
          icon="event_busy"
          title="Chưa có cuộc thi phù hợp"
          description="Hãy đổi bộ lọc hoặc xem lại toàn bộ danh sách."
          action={
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="inline-flex items-center gap-2 font-label-md text-primary"
            >
              <Icon name="refresh" className="text-[18px]" />
              Xem tất cả cuộc thi
            </button>
          }
        />
      )}

      <div className="grid grid-cols-1 gap-md md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((event, i) => {
          const team = teamsByEventId.get(event.id) ?? null;
          const action = resolveEventCardAction({
            authenticated,
            role: session.role,
            event,
            team
          });
          return (
            <EventCard
              key={event.id}
              event={event}
              action={action}
              team={team}
              highlight={i === 0 && filter === "all" && Boolean(team)}
            />
          );
        })}
      </div>

    </div>
  );
}
