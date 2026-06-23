import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { enableGithubProvisioning, enableSubmissions } from "../../config/features";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useArtifactsHubProgress } from "../../hooks/useArtifactsHubProgress";
import { useEventSetupProgress } from "../../hooks/useEventSetupProgress";
import { queryKeys } from "../../lib/queryKeys";
import { fetchEventArtifactsSummary } from "../../services/artifactsApi";
import { resolveApiError } from "../../utils/apiError";
import {
  normalizeArtifactsHubStep,
  resolveArtifactsHubStep,
  type ArtifactsHubStep
} from "./artifactsHubUtils";
import { handleEmbeddedNextStep, type HubEmbedProps } from "../../utils/hubEmbedUtils";
import { macroPathToWizardStep } from "./eventWizardUtils";
import { RepositoryManagementPage } from "./RepositoryManagementPage";
import { SubmissionManagementPage } from "./SubmissionManagementPage";

export function ArtifactsHubPage({ embedded = false, onWizardStep }: HubEmbedProps = {}) {
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { context, loading: setupLoading } = useEventSetupProgress(
    eventId,
    embedded ? "/organizer/events/wizard" : "/organizer/artifacts-hub"
  );

  const summaryQuery = useQuery({
    queryKey: [...queryKeys.repositories.byEvent(eventId), "artifacts-summary"],
    queryFn: () => fetchEventArtifactsSummary(eventId!),
    enabled: Boolean(eventId) && (enableSubmissions || enableGithubProvisioning)
  });

  const submittedCount = summaryQuery.data?.submissions.submittedCount ?? 0;
  const totalTeams = summaryQuery.data?.submissions.totalTeams ?? 0;
  const repoProvisionedCount = summaryQuery.data?.repositories.created ?? 0;
  const repoFailedCount = summaryQuery.data?.repositories.failed ?? 0;

  const { microSteps } = useArtifactsHubProgress({
    hasBoards: context.hasBoards,
    hasProblem: context.hasProblem,
    showSubmissions: enableSubmissions,
    showRepositories: enableGithubProvisioning,
    submittedCount,
    totalTeams,
    repoProvisionedCount,
    repoFailedCount
  });

  const [activeStep, setActiveStep] = useState<ArtifactsHubStep | null>(null);
  const currentStep = activeStep ?? resolveArtifactsHubStep(microSteps);

  function goToStep(anchor: string) {
    const step = normalizeArtifactsHubStep(anchor);
    setActiveStep(step);
    if (!embedded) {
      window.history.replaceState(null, "", `/organizer/artifacts-hub${step}`);
    }
  }

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) setActiveStep(normalizeArtifactsHubStep(hash));
  }, []);

  const summaryError = summaryQuery.isError
    ? resolveApiError(summaryQuery.error, "Không tải được tóm tắt bài nộp & mã nguồn.")
    : null;

  if (eventLoading || setupLoading) {
    return <ModuleSkeleton rows={5} variant="table" />;
  }

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <PageHeader
          eyebrow="Vận hành thi"
          title="Bài nộp & mã nguồn"
          description="Cấp mã nguồn và theo dõi nộp bài — sau khi gán đội vào bảng."
          actions={<OrganizerContextBar />}
        />
      ) : null}

      {summaryError ? (
        <RetryPanel
          message={summaryError}
          onRetry={() => void summaryQuery.refetch()}
        />
      ) : summaryQuery.isLoading ? (
        <ModuleSkeleton rows={2} />
      ) : null}

      <WorkflowSteps
        title="Các bước trên trang này"
        description="Chọn một bước — mỗi lần chỉ hiện nội dung bước đó."
        activeHref={currentStep}
        onStepSelect={(href) => handleEmbeddedNextStep(href, embedded, onWizardStep, goToStep)}
        steps={microSteps.map((step) => {
          if (embedded && step.to) {
            const wizardHref = macroPathToWizardStep(step.to);
            if (wizardHref) {
              return {
                label: step.label,
                detail: step.detail,
                href: wizardHref,
                state: step.state
              };
            }
          }
          return {
            label: step.label,
            detail: step.detail,
            href: step.anchor,
            to: step.to,
            state: step.state
          };
        })}
      />

      {enableGithubProvisioning && currentStep === "#artifacts-step-repositories" ? (
        <RepositoryManagementPage embedded />
      ) : null}
      {enableSubmissions && currentStep === "#artifacts-step-submissions" ? (
        <SubmissionManagementPage embedded />
      ) : null}
    </div>
  );
}
