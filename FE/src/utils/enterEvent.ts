import { setStoredActiveEventId } from "../hooks/useActiveEvent";

export function rememberActiveEvent(eventId: number) {
  setStoredActiveEventId(eventId);
}
