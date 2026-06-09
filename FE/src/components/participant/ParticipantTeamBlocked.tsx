import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";

interface ParticipantTeamBlockedProps {
  message: string;
}

export function ParticipantTeamBlocked({ message }: ParticipantTeamBlockedProps) {
  return (
    <EmptyState
      icon="block"
      title="Chưa thể tiếp tục"
      description={message}
      action={
        <Link to="/me/team">
          <Button type="button" variant="ghost">
            Về trang đội
          </Button>
        </Link>
      }
    />
  );
}
