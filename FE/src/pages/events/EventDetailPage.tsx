import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/ui/Icon";
import { apiClient } from "../../services/apiClient";
import type { ApiResponse } from "../../types/api";

interface EventDetail {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  minTeamSize: number;
  maxTeamSize: number;
  maxTeams: number;
}

export function EventDetailPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    apiClient
      .get<ApiResponse<EventDetail>>(`/v1/events/${eventId}`)
      .then((res) => {
        if (!cancelled) setEvent(res.data.data);
      })
      .catch(() => {
        if (!cancelled) setError("Không tải được chi tiết sự kiện.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading) {
    return <p className="font-body-md text-on-surface-variant py-8">Đang tải...</p>;
  }

  if (error || !event) {
    return (
      <div className="glass-panel rounded-xl p-lg">
        <p className="text-error font-body-md">{error ?? "Sự kiện không tồn tại."}</p>
        <Link to="/events" className="text-primary font-label-md mt-md inline-block">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-lg max-w-2xl mx-auto">
      <Link to="/events" className="inline-flex items-center gap-1 text-primary font-label-md">
        <Icon name="arrow_back" className="text-[18px]" />
        Events
      </Link>

      <article className="glass-panel rounded-xl p-lg space-y-md">
        <div className="flex items-start justify-between gap-md">
          <h1 className="font-headline-md text-on-surface">{event.name}</h1>
          <Badge tone="active">{event.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-md font-body-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <Icon name="calendar_today" className="text-primary" />
            {event.startDate} → {event.endDate}
          </div>
          <div className="flex items-center gap-2">
            <Icon name="groups" className="text-primary" />
            Team {event.minTeamSize}–{event.maxTeamSize}
          </div>
          <div className="flex items-center gap-2">
            <Icon name="grid_view" className="text-primary" />
            Max {event.maxTeams} teams
          </div>
        </div>

        <div className="flex flex-wrap gap-sm pt-md border-t border-outline-variant/30">
          <Link
            to="/login"
            className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-label-md"
          >
            Đăng ký tham gia
          </Link>
          <Link
            to="/me/team"
            className="border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-label-md hover:bg-surface-variant"
          >
            My Team
          </Link>
        </div>
      </article>
    </div>
  );
}
