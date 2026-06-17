import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AiReviewHistoryPanel } from "../../components/ai-review/AiReviewHistoryPanel";
import { AiReviewView } from "../../components/ai-review/AiReviewView";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useMyTeam } from "../../hooks/useMyTeam";
import { queryKeys } from "../../lib/queryKeys";
import {
  fetchLatestTeamAiReview,
  fetchTeamAiReviews,
  type AiReviewResponse
} from "../../services/aiReviewApi";

export function ParticipantAiReviewPage() {
  const { event, eventId } = useActiveEvent();
  const { team, loading: teamLoading } = useMyTeam(eventId);
  const [selectedHistoryReview, setSelectedHistoryReview] = useState<AiReviewResponse | null>(null);

  const reviewQuery = useQuery({
    queryKey: [...queryKeys.teams.byEvent(eventId ?? 0), "ai-review", team?.id],
    queryFn: () => fetchLatestTeamAiReview(team!.id),
    enabled: Boolean(team?.id)
  });

  const historyQuery = useQuery({
    queryKey: [...queryKeys.teams.byEvent(eventId ?? 0), "ai-reviews", team?.id],
    queryFn: () => fetchTeamAiReviews(team!.id),
    enabled: Boolean(team?.id)
  });

  useEffect(() => {
    setSelectedHistoryReview(null);
  }, [team?.id]);

  if (teamLoading) return <ModuleSkeleton rows={4} />;

  if (!team) {
    return (
      <EmptyState
        icon="psychology"
        title="Chưa có đội"
        description="Đăng ký đội để xem đánh giá AI cho repository của bạn."
      />
    );
  }

  const history = historyQuery.data ?? [];
  const displayedReview = selectedHistoryReview ?? reviewQuery.data ?? null;
  const displayedSelectedId = selectedHistoryReview?.id ?? reviewQuery.data?.id ?? null;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Tham khảo"
        title="Đánh giá AI"
        description={event?.name ?? "Phân tích kỹ thuật repository — chỉ mang tính tham khảo."}
      />

      {history.length > 0 ? (
        <AiReviewHistoryPanel
          reviews={history}
          loading={historyQuery.isLoading}
          selectedId={displayedSelectedId}
          onSelect={(item) => setSelectedHistoryReview(item)}
        />
      ) : null}

      <AiReviewView
        review={displayedReview}
        loading={reviewQuery.isLoading && !selectedHistoryReview}
      />
    </div>
  );
}
