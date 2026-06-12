import { Link } from "react-router-dom";
import type { EventCardAction } from "../../domain/eventParticipantFlow";
import type { EventListItem } from "../../types/entities";
import type { TeamDetailResponse } from "../../services/registrationService";
import { Badge } from "../ui/Badge";
import { Icon } from "../ui/Icon";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { rememberActiveEvent } from "../../utils/enterEvent";
import { EventProgressStrip } from "./EventProgressStrip";
import { buildParticipantWorkflowSteps } from "../../domain/participantWorkflow";
import type { ProgressStepState } from "../../hooks/useParticipantEventProgress";

function formatDateRange(start: string, end: string) {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric"
    };
    return `${s.toLocaleDateString("vi-VN", opts)} – ${e.toLocaleDateString("vi-VN", opts)}`;
  } catch {
    return `${start} – ${end}`;
  }
}

interface EventCardProps {
  event: EventListItem;
  action: EventCardAction;
  team?: TeamDetailResponse | null;
  highlight?: boolean;
}

function teamProgressSteps(team: TeamDetailResponse): { label: string; state: ProgressStepState }[] {
  const isConfirmed = team.status === "CONFIRMED";
  return buildParticipantWorkflowSteps({
    active: isConfirmed ? "board" : "team",
    isConfirmed,
    hasBoard: false,
    hasSubmitted: false,
    resultsPublished: false
  }).map((step) => ({
    label: step.label,
    state: step.state as ProgressStepState
  }));
}

export function EventCard({ event, action, team, highlight }: EventCardProps) {
  function handleClick() {
    rememberActiveEvent(event.id);
  }

  return (
    <article
      className={`flex h-full min-h-[320px] flex-col overflow-hidden rounded-xl border bg-surface shadow-sm transition-colors hover:border-primary/50 ${
        highlight ? "border-primary" : "border-outline-variant"
      }`}
    >
      <div className="flex items-start justify-between gap-md border-b border-outline-variant bg-surface-container-low p-md">
        <div className="min-w-0">
          <p className="font-label-sm normal-case text-on-surface-variant">
            Mã cuộc thi #{event.id}
          </p>
          <h2 className="mt-xs line-clamp-2 font-headline-sm text-on-surface">{event.name}</h2>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone={getStatusTone(event.status)}>{getStatusLabel(event.status)}</Badge>
          {team ? (
            <Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>
          ) : null}
          {highlight ? <Badge tone="ai">Nổi bật</Badge> : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-md p-md">
        <p className="font-body-sm text-on-surface-variant line-clamp-2 min-h-[2.75rem]">
          {team
            ? `Bạn đã có đội «${team.name}». Bấm Tiếp tục để mở không gian thi.`
            : "Đăng ký đội, theo dõi lịch thi, nhận đề và xem kết quả công bố."}
        </p>
        {team ? <EventProgressStrip steps={teamProgressSteps(team)} /> : <div className="h-7" />}

        <div className="grid grid-cols-1 gap-2 text-on-surface-variant sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Icon name="calendar_today" className="shrink-0 text-[18px] text-primary" />
            <span className="font-label-sm normal-case tracking-normal line-clamp-2">
              {formatDateRange(event.startDate, event.endDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="groups" className="shrink-0 text-[18px] text-primary" />
            <span className="font-label-sm normal-case tracking-normal">
              Đội {event.minTeamSize ?? 1}–{event.maxTeamSize ?? 5} người
            </span>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-sm border-t border-outline-variant pt-md">
          <p className="min-h-[2.5rem] font-label-sm normal-case text-on-surface-variant line-clamp-2">
            {action.hint}
          </p>
          <div className="flex flex-col gap-xs">
            <Link
              to={action.to}
              onClick={handleClick}
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 font-label-md text-on-primary transition-colors hover:opacity-90"
            >
              <Icon name={action.icon} className="text-[18px]" />
              {action.label}
            </Link>
            {action.secondary ? (
              <Link
                to={action.secondary.to}
                state={{ from: `/events/${event.id}` }}
                onClick={handleClick}
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-outline-variant px-4 font-label-md text-on-surface transition-colors hover:bg-surface-container-high"
              >
                <Icon name={action.secondary.icon} className="text-[18px]" />
                {action.secondary.label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
