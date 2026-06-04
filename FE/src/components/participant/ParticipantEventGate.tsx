import { Navigate, Outlet } from "react-router-dom";
import { ModuleSkeleton } from "../ui/ModuleSkeleton";
import { useActiveEvent } from "../../hooks/useActiveEvent";

/** Bắt buộc chọn cuộc thi từ /events trước khi vào khu vực /me. */
export function ParticipantEventGate() {
  const { eventId, loading } = useActiveEvent();

  if (loading) {
    return <ModuleSkeleton rows={4} />;
  }

  if (eventId == null) {
    return <Navigate to="/events" replace />;
  }

  return <Outlet />;
}
