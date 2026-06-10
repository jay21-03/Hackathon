import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { isAuthenticated } from "../../auth/authSession";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { ParticipantWorkflowBar } from "../../components/participant/ParticipantWorkflowBar";
import { EventResultsView } from "../../components/results/EventResultsView";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useMyTeam } from "../../hooks/useMyTeam";
import { queryKeys } from "../../lib/queryKeys";
import { fetchPublicEventResults } from "../../services/rankingApi";
import { resolveApiError } from "../../utils/apiError";

interface ResultsPortalPageProps {
  participantView?: boolean;
}

export function ResultsPortalPage({ participantView }: ResultsPortalPageProps) {
  const { eventId: eventIdParam } = useParams();
  const { eventId: activeEventId } = useActiveEvent();
  const eventId = eventIdParam
    ? Number(eventIdParam)
    : participantView
      ? activeEventId
      : null;

  const { team } = useMyTeam(
    participantView && isAuthenticated() ? eventId : null
  );

  const resultsQuery = useQuery({
    queryKey: queryKeys.rankings.public(eventId),
    queryFn: () => fetchPublicEventResults(eventId!),
    enabled: Boolean(eventId) && !Number.isNaN(eventId!)
  });

  if (!eventId || Number.isNaN(eventId)) {
    return <p className="p-page font-body-sm text-error">Thiếu mã cuộc thi.</p>;
  }

  if (resultsQuery.isLoading) return <ModuleSkeleton rows={4} />;

  const results = resultsQuery.data;
  const error = resultsQuery.error
    ? resolveApiError(resultsQuery.error, "Không tải được kết quả.")
    : null;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow={participantView ? "Kết quả" : "Công khai"}
        title={results?.eventName ?? "Kết quả cuộc thi"}
        description={
          participantView
            ? "Chọn vòng và bảng để xem xếp hạng — mặc định hiển thị bảng của đội bạn."
            : "Bảng xếp hạng chính thức sau khi ban tổ chức công bố."
        }
      />

      {participantView ? <ParticipantWorkflowBar active="results" /> : null}

      {error ? (
        <RetryPanel message={error} onRetry={() => void resultsQuery.refetch()} />
      ) : null}

      {results ? (
        <EventResultsView
          results={results}
          participantView={participantView}
          highlightTeamId={team?.id ?? null}
        />
      ) : null}

      <div className="flex flex-wrap gap-md">
        {!participantView ? (
          <Link to="/events" className="font-label-sm text-primary hover:underline">
            ← Danh sách cuộc thi
          </Link>
        ) : null}
        {eventIdParam ? (
          <Link
            to={`/events/${eventId}`}
            className="font-label-sm text-primary hover:underline"
          >
            Chi tiết cuộc thi
          </Link>
        ) : null}
      </div>
    </div>
  );
}
