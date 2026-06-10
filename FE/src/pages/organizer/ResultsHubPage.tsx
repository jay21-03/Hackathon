import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { enablePhase7 } from "../../config/features";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventBoards } from "../../hooks/useEventBoards";
import { useEventRounds } from "../../hooks/useEventRounds";
import { useEventSetupProgress } from "../../hooks/useEventSetupProgress";
import { useResultsHubProgress } from "../../hooks/useResultsHubProgress";
import { useScoreProgress } from "../../hooks/useScoreProgress";
import { queryKeys } from "../../lib/queryKeys";
import { fetchAdvancements } from "../../services/advancementApi";
import { fetchEventRankings } from "../../services/rankingApi";
import { ExportSuccessPage } from "./ExportSuccessPage";
import { FinalsPage } from "./FinalsPage";
import { PublishResultsPage } from "./PublishResultsPage";
import { RankingPage } from "./RankingPage";
import { RubricSetupPage } from "./RubricSetupPage";
import { ScoringProgressPage } from "./ScoringProgressPage";
import { resolveDefaultBoardId } from "../../utils/pickActiveRound";
import { type HubEmbedProps } from "../../utils/hubEmbedUtils";
import {
  normalizeResultsHubStep,
  resolveResultsHubStep,
  type ResultsHubStep
} from "./resultsHubUtils";

export function ResultsHubPage({ embedded = false, onWizardStep }: HubEmbedProps = {}) {
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { context: setupContext, loading: setupLoading } = useEventSetupProgress(
    eventId,
    embedded ? "/organizer/events/wizard" : "/organizer/results-hub"
  );
  const { boards, loading: boardsLoading } = useEventBoards(eventId);
  const { rounds, loading: roundsLoading } = useEventRounds(eventId);
  const firstBoardId = resolveDefaultBoardId(boards, rounds);
  const { progress, loading: progressLoading } = useScoreProgress(firstBoardId);

  const rankingsQuery = useQuery({
    queryKey: queryKeys.rankings.event(eventId),
    queryFn: () => fetchEventRankings(eventId!),
    enabled: Boolean(eventId)
  });

  const finalsRound = useMemo(
    () => rounds.find((r) => r.roundType === "FINAL") ?? rounds[rounds.length - 1] ?? null,
    [rounds]
  );

  const advancementsQuery = useQuery({
    queryKey: [...queryKeys.rankings.all, "results-hub-finals", eventId, finalsRound?.id],
    queryFn: () => fetchAdvancements(eventId!, finalsRound!.id),
    enabled: Boolean(eventId && finalsRound && enablePhase7)
  });

  const rankingBoards = rankingsQuery.data?.boards ?? [];
  const hasRankings = rankingBoards.some((b) => b.entries.length > 0);
  const hasPublished = rankingBoards.some((b) => b.published);
  const scoringComplete = (progress?.summary.completionPercent ?? 0) >= 100;
  const showFinalsStep = enablePhase7 && rounds.length >= 2;
  const finalsDone = (advancementsQuery.data?.length ?? 0) > 0;

  const { microSteps } = useResultsHubProgress({
    hasBoards: setupContext.hasBoards,
    hasRubric: setupContext.hasRubric,
    scoringComplete,
    hasRankings,
    hasPublished,
    showFinalsStep,
    finalsDone
  });

  const [activeStep, setActiveStep] = useState<ResultsHubStep | null>(null);
  const currentStep = activeStep ?? resolveResultsHubStep(microSteps);

  function goToStep(anchor: string) {
    const step = normalizeResultsHubStep(anchor);
    setActiveStep(step);
    if (!embedded) {
      window.history.replaceState(null, "", `/organizer/results-hub${step}`);
    }
  }

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) setActiveStep(normalizeResultsHubStep(hash));
  }, []);

  if (eventLoading || setupLoading || boardsLoading || roundsLoading || progressLoading) {
    return <ModuleSkeleton rows={6} />;
  }

  const hubSteps = microSteps.map((step) => ({
    label: step.label,
    detail: step.detail,
    href: step.anchor,
    to: step.to,
    state: step.state
  }));

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <PageHeader
          eyebrow="Kết quả"
          title="Chấm điểm & kết quả"
          description="Rubric → chấm → xếp hạng → công bố → chuyển vòng chung kết → xuất."
          actions={<OrganizerContextBar />}
        />
      ) : null}

      <WorkflowSteps
        title="Các bước trên trang này"
        description="Chọn một bước — mỗi lần chỉ hiện nội dung bước đó."
        activeHref={currentStep}
        onStepSelect={(href) => goToStep(href)}
        steps={hubSteps}
      />

      <div>
      {currentStep === "#results-step-rubric" ? <RubricSetupPage embedded /> : null}
      {currentStep === "#results-step-scoring" ? <ScoringProgressPage embedded /> : null}
      {currentStep === "#results-step-ranking" ? <RankingPage embedded /> : null}
      {currentStep === "#results-step-publish" ? <PublishResultsPage embedded /> : null}
      {currentStep === "#results-step-finals" && showFinalsStep ? <FinalsPage embedded /> : null}
      {currentStep === "#results-step-export" ? <ExportSuccessPage embedded /> : null}
      </div>
    </div>
  );
}
