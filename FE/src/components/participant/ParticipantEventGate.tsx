import { useEffect } from "react";
import { Navigate, Outlet, useSearchParams } from "react-router-dom";
import { ModuleSkeleton } from "../ui/ModuleSkeleton";
import { useActiveEvent } from "../../hooks/useActiveEvent";

/** Bắt buộc chọn cuộc thi từ /events trước khi vào khu vực /me. Đọc ?eventId= từ deep-link. */
export function ParticipantEventGate() {
  const [searchParams] = useSearchParams();
  const { eventId, setEventId, loading } = useActiveEvent();

  useEffect(() => {
    const raw = searchParams.get("eventId");
    if (!raw) return;
    const id = Number(raw);
    if (Number.isFinite(id) && id > 0) {
      setEventId(id);
    }
  }, [searchParams, setEventId]);

  if (loading) {
    return <ModuleSkeleton rows={4} />;
  }

  if (eventId == null) {
    return <Navigate to="/events" replace />;
  }

  return <Outlet />;
}
