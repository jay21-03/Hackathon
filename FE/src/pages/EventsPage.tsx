import { useEffect, useState } from "react";
import type { EventListItem } from "../types/entities";
import { fetchPublicEvents } from "../services/eventsApi";

export function EventsPage() {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchPublicEvents()
      .then((list) => {
        if (!cancelled) {
          setEvents(list);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Không tải được danh sách sự kiện từ API.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="card">
        <h2>Sự kiện</h2>
        <p className="status loading">Đang tải...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card">
        <h2>Sự kiện</h2>
        <p className="status error">{error}</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Sự kiện</h2>
      <p className="muted">GET /api/v1/events</p>

      {events.length === 0 ? (
        <p>Chưa có sự kiện nào. Tạo sự kiện qua Swagger (organizer).</p>
      ) : (
        <ul className="event-list">
          {events.map((event) => (
            <li key={event.id} className="event-item">
              <div>
                <strong>{event.name}</strong>
                <span className={`badge badge-${event.status.toLowerCase()}`}>
                  {event.status}
                </span>
              </div>
              <p className="muted">
                {event.startDate} → {event.endDate}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
