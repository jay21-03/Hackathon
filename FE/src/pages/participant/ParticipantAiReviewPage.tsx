import { useQuery } from "@tanstack/react-query";

import { AiReviewView } from "../../components/ai-review/AiReviewView";

import { EmptyState } from "../../components/ui/EmptyState";

import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";

import { PageHeader } from "../../components/ui/PageHeader";

import { useActiveEvent } from "../../hooks/useActiveEvent";

import { useMyTeam } from "../../hooks/useMyTeam";

import { queryKeys } from "../../lib/queryKeys";

import { fetchLatestTeamAiReview, fetchTeamAiReviews } from "../../services/aiReviewApi";



export function ParticipantAiReviewPage() {

  const { event, eventId } = useActiveEvent();

  const { team, loading: teamLoading } = useMyTeam(eventId);



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



  const pushReviews = (historyQuery.data ?? []).filter((item) => item.reviewKind === "PER_PUSH").slice(0, 5);



  return (

    <div className="space-y-lg">

      <PageHeader

        eyebrow="Tham khảo"

        title="Đánh giá AI"

        description={event?.name ?? "Phân tích kỹ thuật repository — chỉ mang tính tham khảo."}

      />

      <AiReviewView review={reviewQuery.data ?? null} loading={reviewQuery.isLoading} />



      {pushReviews.length > 0 ? (

        <section className="space-y-sm">

          <h2 className="font-title-sm text-on-surface">Lịch sử theo push (gần nhất)</h2>

          {pushReviews.map((review) => (

            <AiReviewView key={review.id} review={review} />

          ))}

        </section>

      ) : null}

    </div>

  );

}
