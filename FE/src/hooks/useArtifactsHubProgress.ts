import { useMemo } from "react";
import type { NextStepAction } from "../components/ui/NextStepPanel";
import type { WorkflowStepState } from "../domain/organizerWorkflow";

interface ArtifactsHubProgressInput {
  showSubmissions: boolean;
  showRepositories: boolean;
  submittedCount: number;
  totalTeams: number;
  repoProvisionedCount: number;
  repoFailedCount: number;
  hasProblem: boolean;
}

export function useArtifactsHubProgress({
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
    }> = [];

    if (showSubmissions) {
      microSteps.push({
        label: "Bài nộp đội",
        detail:
          totalTeams > 0
            ? `${submittedCount}/${totalTeams} đội đã nộp`
            : "Theo dõi link repository đội nộp",
        state: totalTeams > 0 && submittedCount >= totalTeams ? "done" : "active",
        anchor: "#artifacts-step-submissions"
      });
    }

    if (showRepositories) {
      const repoState: WorkflowStepState = !hasProblem
        ? "blocked"
        : repoFailedCount > 0
          ? "active"
          : repoProvisionedCount > 0
            ? "done"
            : showSubmissions && submittedCount < totalTeams
              ? "next"
              : "active";
      microSteps.push({
        label: "Repository GitHub",
        detail: hasProblem
          ? repoProvisionedCount > 0
            ? `${repoProvisionedCount} repo đã provision`
            : "Cấu hình mẫu & provision theo đề"
          : "Cần gán đề trước",
        state: repoState,
        anchor: "#artifacts-step-repositories"
      });
    }

    let nextAction: NextStepAction;
    if (showSubmissions && totalTeams > 0 && submittedCount < totalTeams) {
      nextAction = {
        title: "Theo dõi bài nộp",
        description: `${submittedCount}/${totalTeams} đội đã nộp chính thức.`,
        href: "#artifacts-step-submissions",
        cta: "Mở Bài nộp đội"
      };
    } else if (showRepositories && repoFailedCount > 0) {
      nextAction = {
        title: "Repository lỗi provision",
        description: `${repoFailedCount} repo cần thử lại hoặc kiểm tra mẫu.`,
        href: "#artifacts-step-repositories",
        cta: "Mở Repository GitHub"
      };
    } else if (showRepositories && hasProblem && repoProvisionedCount === 0) {
      nextAction = {
        title: "Bước tiếp: Provision repository",
        description: "Cấu hình mẫu repo và provision cho các đội trên bảng.",
        href: "#artifacts-step-repositories",
        cta: "Cấu hình GitHub"
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
        description: "Theo dõi trạng thái provision và khóa repo sau vòng.",
        href: "#artifacts-step-repositories",
        cta: "Mở Repository"
      };
    }

    return { microSteps, nextAction };
  }, [
    showSubmissions,
    showRepositories,
    submittedCount,
    totalTeams,
    repoProvisionedCount,
    repoFailedCount,
    hasProblem
  ]);
}
