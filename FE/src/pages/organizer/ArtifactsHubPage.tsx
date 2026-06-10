import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { enableGithubProvisioning, enableSubmissions } from "../../config/features";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useArtifactsHubProgress } from "../../hooks/useArtifactsHubProgress";
import { useEventSetupProgress } from "../../hooks/useEventSetupProgress";
import { useEventSubmissions } from "../../hooks/useEventSubmissions";
import { queryKeys } from "../../lib/queryKeys";
import { fetchEventRepositories } from "../../services/repositoryProvisioningService";
import {
  normalizeArtifactsHubStep,
  resolveArtifactsHubStep,
  type ArtifactsHubStep
} from "./artifactsHubUtils";
import { handleEmbeddedNextStep, type HubEmbedProps } from "../../utils/hubEmbedUtils";
import { RepositoryManagementPage } from "./RepositoryManagementPage";
import { SubmissionManagementPage } from "./SubmissionManagementPage";

export function ArtifactsHubPage({ embedded = false, onWizardStep }: HubEmbedProps = {}) {
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { context, loading: setupLoading } = useEventSetupProgress(
    eventId,
    embedded ? "/organizer/events/wizard" : "/organizer/artifacts-hub"
  );
  const { submissions, total, loading: submissionsLoading } = useEventSubmissions(
    eventId,
    null,
    null,
    0,
    500
  );

  const reposQuery = useQuery({
    queryKey: queryKeys.repositories.byEvent(eventId),
    queryFn: () => fetchEventRepositories(eventId!),
    enabled: Boolean(eventId) && enableGithubProvisioning
  });

  const submittedCount = useMemo(
    () => submissions.filter((row) => row.status === "SUBMITTED").length,
    [submissions]
  );
  const repoRows = reposQuery.data ?? [];
  const repoProvisionedCount = useMemo(
    () => repoRows.filter((row) => row.provisionStatus === "CREATED").length,
    [repoRows]
  );
  const repoFailedCount = useMemo(
    () =>
      repoRows.filter(
        (row) => row.provisionStatus === "FAILED" || row.accessStatus === "FAILED"
      ).length,
    [repoRows]
  );

  const { microSteps } = useArtifactsHubProgress({
    showSubmissions: enableSubmissions,
    showRepositories: enableGithubProvisioning,
    submittedCount,
    totalTeams: total,
    repoProvisionedCount,
    repoFailedCount,
    hasProblem: context.hasProblem
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

  if (
    eventLoading ||
    setupLoading ||
    (enableSubmissions && submissionsLoading) ||
    (enableGithubProvisioning && reposQuery.isLoading)
  ) {
    return <ModuleSkeleton rows={5} variant="table" />;
  }

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <PageHeader
          eyebrow="Vận hành thi"
          title="Bài nộp & repository"
          description="Theo dõi bài nộp đội và provision GitHub — một luồng liền mạch sau khi mở đề."
          actions={<OrganizerContextBar />}
        />
      ) : null}

      <WorkflowSteps
        title="Các bước trên trang này"
        description="Chọn một bước — mỗi lần chỉ hiện nội dung bước đó."
        activeHref={currentStep}
        onStepSelect={(href) => handleEmbeddedNextStep(href, embedded, onWizardStep, goToStep)}
        steps={microSteps.map((step) => ({
          label: step.label,
          detail: step.detail,
          href: step.anchor,
          state: step.state
        }))}
      />

      {enableSubmissions && currentStep === "#artifacts-step-submissions" ? (
        <SubmissionManagementPage embedded />
      ) : null}
      {enableGithubProvisioning && currentStep === "#artifacts-step-repositories" ? (
        <RepositoryManagementPage embedded />
      ) : null}
    </div>
  );
}
