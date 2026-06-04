import { useCallback, useEffect, useState } from "react";
import { fetchPublicEvents } from "../services/eventsApi";
import type { EventListItem } from "../types/entities";

const STORAGE_KEY = "seal.activeEventId";

export function useActiveEvent() {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [eventId, setEventIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Number(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setEventId = useCallback((id: number) => {
    setEventIdState(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPublicEvents()
      .then((list) => {
        if (cancelled) return;
        setEvents(list);
        const resolved =
          (eventId && list.some((item) => item.id === eventId) ? eventId : null) ??
          list[0]?.id ??
          null;
        if (resolved && resolved !== eventId) {
          setEventId(resolved);
        } else if (resolved) {
          setEventIdState(resolved);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Khong tai duoc danh sach cuoc thi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, setEventId]);

  const event = events.find((item) => item.id === eventId) ?? null;

  return { eventId, event, events, setEventId, loading, error };
}
