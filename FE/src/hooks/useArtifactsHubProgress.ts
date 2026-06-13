import { useMemo } from "react";
import type { NextStepAction } from "../components/ui/NextStepPanel";
import type { WorkflowStepState } from "../domain/organizerWorkflow";

interface ArtifactsHubProgressInput {
  hasBoards: boolean;
  hasRubric: boolean;
  showSubmissions: boolean;
  showRepositories: boolean;
  submittedCount: number;
  totalTeams: number;
  repoProvisionedCount: number;
  repoFailedCount: number;
  hasProblem: boolean;
}

export function useArtifactsHubProgress({
  hasBoards,
  hasRubric,
  showSubmissions,
  showRepositories,
  submittedCount,
  totalTeams,
  repoProvisionedCount,
  repoFailedCount,
  hasProblem
}: ArtifactsHubProgressInput) {
  return useMemo(() => {
    const microSteps: Array<{
      label: string;
      detail: string;
      state: WorkflowStepState;
      anchor?: string;
      to?: string;
    }> = [
      {
        label: "Tiêu chí chấm",
        detail: hasRubric ? "Đã có rubric" : "Cấu hình rubric theo vòng",
        state: !hasBoards ? "blocked" : hasRubric ? "done" : "active",
        anchor: "#artifacts-step-rubric"
      }
    ];

    if (showRepositories) {
      const repoState: WorkflowStepState =
        !hasRubric || !hasProblem
          ? "blocked"
          : repoFailedCount > 0
            ? "active"
            : repoProvisionedCount > 0
              ? "done"
              : "active";
      microSteps.push({
        label: "Repository GitHub",
        detail: hasProblem
          ? repoProvisionedCount > 0
            ? `${repoProvisionedCount} repo đã cấp`
            : "Cấu hình mẫu & cấp repo theo đề"
          : "Cần gán đề trước",
        state: repoState,
        anchor: "#artifacts-step-repositories"
      });
    }

    if (showSubmissions) {
      const reposReady =
        !showRepositories || !hasProblem || repoProvisionedCount > 0 || repoFailedCount > 0;
      microSteps.push({
        label: "Bài nộp đội",
        detail:
          totalTeams > 0
            ? `${submittedCount}/${totalTeams} đội đã nộp`
            : "Theo dõi link repository đội nộp",
        state: !hasRubric
          ? "blocked"
          : !reposReady
            ? "next"
            : totalTeams > 0 && submittedCount >= totalTeams
              ? "done"
              : "active",
        anchor: "#artifacts-step-submissions"
      });
    }

    microSteps.push({
      label: "Tiếp theo",
      detail: "Chấm điểm & kết quả",
      state: hasRubric ? "next" : "blocked",
      to: hasRubric ? "/organizer/results-hub" : undefined
    });

    let nextAction: NextStepAction;
    if (!hasBoards) {
      nextAction = {
        title: "Chưa có bảng thi",
        description: "Hoàn thành Bảng thi và Vận hành bảng trước.",
        to: "/organizer/boards",
        cta: "Đi tới Bảng thi"
      };
    } else if (!hasRubric) {
      nextAction = {
        title: "Bước tiếp: Tiêu chí chấm",
        description: "Thiết lập rubric trước khi cấp repository GitHub và theo dõi nộp bài.",
        href: "#artifacts-step-rubric",
        cta: "Đi tới rubric"
      };
    } else if (showRepositories && repoFailedCount > 0) {
      nextAction = {
        title: "Repository cấp thất bại",
        description: `${repoFailedCount} repo cần thử lại hoặc kiểm tra mẫu.`,
        href: "#artifacts-step-repositories",
        cta: "Mở Repository GitHub"
      };
    } else if (showRepositories && hasProblem && repoProvisionedCount === 0) {
      nextAction = {
        title: "Bước tiếp: Cấp repository",
        description: "Cấu hình mẫu repo và cấp cho các đội trên bảng.",
        href: "#artifacts-step-repositories",
        cta: "Cấu hình GitHub"
      };
    } else if (showSubmissions && totalTeams > 0 && submittedCount < totalTeams) {
      nextAction = {
        title: "Theo dõi bài nộp",
        description: `${submittedCount}/${totalTeams} đội đã nộp chính thức.`,
        href: "#artifacts-step-submissions",
        cta: "Mở Bài nộp đội"
      };
    } else if (showSubmissions) {
      nextAction = {
        title: "Bài nộp đã ổn định",
        description: "Tiếp tục chấm điểm từ mục Kết quả.",
        to: "/organizer/results-hub",
        cta: "Mở Kết quả"
      };
    } else {
      nextAction = {
        title: "Quản lý repository",
        description: "Theo dõi trạng thái cấp repo và khóa repo sau vòng.",
        href: "#artifacts-step-repositories",
        cta: "Mở Repository"
      };
    }

    return { microSteps, nextAction };
  }, [
    hasBoards,
    hasRubric,
    showSubmissions,
    showRepositories,
    submittedCount,
    totalTeams,
    repoProvisionedCount,
    repoFailedCount,
    hasProblem
  ]);
}
