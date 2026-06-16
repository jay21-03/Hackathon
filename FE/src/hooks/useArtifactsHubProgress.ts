import { useMemo } from "react";
import type { NextStepAction } from "../components/ui/NextStepPanel";
import type { WorkflowStepState } from "../domain/organizerWorkflow";

interface ArtifactsHubProgressInput {
  hasBoards: boolean;
  hasProblem: boolean;
  showSubmissions: boolean;
  showRepositories: boolean;
  submittedCount: number;
  totalTeams: number;
  repoProvisionedCount: number;
  repoFailedCount: number;
}

export function useArtifactsHubProgress({
  hasBoards,
  hasProblem,
  showSubmissions,
  showRepositories,
  submittedCount,
  totalTeams,
  repoProvisionedCount,
  repoFailedCount
}: ArtifactsHubProgressInput) {
  return useMemo(() => {
    const microSteps: Array<{
      label: string;
      detail: string;
      state: WorkflowStepState;
      anchor?: string;
      to?: string;
    }> = [];

    if (showRepositories) {
      const repoState: WorkflowStepState =
        !hasBoards || !hasProblem
          ? "blocked"
          : repoFailedCount > 0
            ? "active"
            : repoProvisionedCount > 0
              ? "done"
              : "active";
      microSteps.push({
        label: "Mã nguồn đội",
        detail: hasProblem
          ? repoProvisionedCount > 0
            ? `${repoProvisionedCount} mã nguồn đã cấp`
            : "Cấu hình mẫu & cấp mã nguồn theo đề"
          : "Cần tạo đề trong Quản lý bảng thi trước",
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
            : "Theo dõi bài nộp của các đội",
        state: !hasBoards
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
      state: hasBoards && hasProblem ? "next" : "blocked",
      to: hasBoards && hasProblem ? "/organizer/results-hub" : undefined
    });

    let nextAction: NextStepAction;
    if (!hasBoards) {
      nextAction = {
        title: "Chưa có bảng thi",
        description: "Hoàn thành Quản lý bảng thi trước.",
        to: "/organizer/boards",
        cta: "Đi tới Quản lý bảng thi"
      };
    } else if (!hasProblem) {
      nextAction = {
        title: "Chưa có đề thi",
        description: "Tạo đề trong Quản lý bảng thi trước khi cấp mã nguồn.",
        to: "/organizer/boards#board-step-problem",
        cta: "Đi tới đề thi"
      };
    } else if (showRepositories && repoFailedCount > 0) {
      nextAction = {
        title: "Cấp mã nguồn thất bại",
        description: `${repoFailedCount} mã nguồn cần thử lại hoặc kiểm tra mẫu.`,
        href: "#artifacts-step-repositories",
        cta: "Mở cấp mã nguồn"
      };
    } else if (showRepositories && hasProblem && repoProvisionedCount === 0) {
      nextAction = {
        title: "Bước tiếp: Cấp mã nguồn",
        description: "Cấu hình mẫu và cấp mã nguồn cho các đội trên bảng.",
        href: "#artifacts-step-repositories",
        cta: "Cấu hình mã nguồn"
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
        title: "Quản lý mã nguồn",
        description: "Theo dõi trạng thái cấp mã nguồn và khóa sau vòng.",
        href: "#artifacts-step-repositories",
        cta: "Mở mã nguồn đội"
      };
    }

    return { microSteps, nextAction };
  }, [
    hasBoards,
    hasProblem,
    showSubmissions,
    showRepositories,
    submittedCount,
    totalTeams,
    repoProvisionedCount,
    repoFailedCount
  ]);
}
