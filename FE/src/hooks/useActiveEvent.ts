import { useQuery } from "@tanstack/react-query";

import { useCallback, useEffect, useMemo, useState } from "react";

import { enableAcademicTerms } from "../config/features";
import { queryKeys } from "../lib/queryKeys";

import { fetchPublicEvents } from "../services/eventsApi";

import { getApiErrorMessage } from "../utils/apiError";

import { useActiveTerm } from "./useActiveTerm";



const STORAGE_KEY = "seal.activeEventId";

export const ACTIVE_EVENT_CHANGE_EVENT = "seal-active-event-change";



function readStoredEventId(): number | null {

  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(STORAGE_KEY);

  return stored ? Number(stored) : null;

}



export function setStoredActiveEventId(id: number) {

  localStorage.setItem(STORAGE_KEY, String(id));

  window.dispatchEvent(new Event(ACTIVE_EVENT_CHANGE_EVENT));

}



type UseActiveEventOptions = {
  /** BTC: tự chọn cuộc thi đầu khi chưa lưu. Thí sinh: false — phải chọn từ /events. */
  autoSelectFirst?: boolean;
};

export function useActiveEvent(options?: UseActiveEventOptions) {
  const autoSelectFirst = options?.autoSelectFirst ?? false;
  const { termId, enabled: termFilterEnabled } = useActiveTerm();
  const filterTermId = termFilterEnabled && enableAcademicTerms ? termId : null;

  const [manualEventId, setManualEventId] = useState<number | null>(readStoredEventId);



  useEffect(() => {

    const sync = () => setManualEventId(readStoredEventId());

    window.addEventListener(ACTIVE_EVENT_CHANGE_EVENT, sync);

    return () => window.removeEventListener(ACTIVE_EVENT_CHANGE_EVENT, sync);

  }, []);



  const eventsQuery = useQuery({

    queryKey: queryKeys.events.list(filterTermId),

    queryFn: () => fetchPublicEvents(filterTermId ?? undefined)

  });



  const events = eventsQuery.data ?? [];



  const eventId = useMemo(() => {
    if (manualEventId != null) {
      if (!events.length) return manualEventId;
      return events.some((item) => item.id === manualEventId) ? manualEventId : null;
    }
    if (autoSelectFirst && events.length) return events[0]?.id ?? null;
    return null;
  }, [events, manualEventId, autoSelectFirst]);



  const setEventId = useCallback((id: number) => {

    setManualEventId(id);

    setStoredActiveEventId(id);

  }, []);



  const event = events.find((item) => item.id === eventId) ?? null;



  return {

    eventId,

    event,

    events,

    setEventId,

    loading: eventsQuery.isLoading,

    error: eventsQuery.isError

      ? getApiErrorMessage(eventsQuery.error, "Không tải được danh sách cuộc thi.")

      : null,

    refetch: eventsQuery.refetch

  };

}

