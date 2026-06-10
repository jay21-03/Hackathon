import { AcademicTermSelector } from "./AcademicTermSelector";
import { EventSelector } from "./EventSelector";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useActiveTerm } from "../../hooks/useActiveTerm";

interface OrganizerContextBarProps {
  className?: string;
}

export function OrganizerContextBar({ className = "" }: OrganizerContextBarProps) {
  const { termId, terms, setTermId, enabled: termEnabled } = useActiveTerm();
  const { eventId, events, setEventId } = useActiveEvent({ autoSelectFirst: true });

  return (
    <div className={`flex flex-wrap items-center gap-md ${className}`}>
      {termEnabled ? (
        <AcademicTermSelector terms={terms} termId={termId} onChange={setTermId} />
      ) : null}
      <EventSelector events={events} eventId={eventId} onChange={setEventId} label="Cuộc thi" />
    </div>
  );
}
