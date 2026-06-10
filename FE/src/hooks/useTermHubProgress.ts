import { useMemo } from "react";
import type { NextStepAction } from "../components/ui/NextStepPanel";
import type { WorkflowStepState } from "../domain/organizerWorkflow";

interface TermDashboardStats {
  eventCount: number;
  teamCount: number;
  participantCount: number;
  mentorCount: number;
  judgeCount: number;
  rankingCount: number;
  repositoryCount: number;
  scoreSheetCount: number;
}

interface TermHubProgressInput {
  stats: TermDashboardStats | null;
  loading: boolean;
}

export function useTermHubProgress({ stats, loading }: TermHubProgressInput) {
  return useMemo(() => {
    const eventCount = stats?.eventCount ?? 0;
    const teamCount = stats?.teamCount ?? 0;
    const participantCount = stats?.participantCount ?? 0;
    const peopleCount =
      participantCount + (stats?.mentorCount ?? 0) + (stats?.judgeCount ?? 0);
    const resultsCount =
      (stats?.rankingCount ?? 0) +
      (stats?.scoreSheetCount ?? 0) +
      (stats?.repositoryCount ?? 0);

    const microSteps: Array<{
      label: string;
      detail: string;
      state: WorkflowStepState;
      anchor: string;
    }> = [
      {
        label: "Tổng quan",
        detail: loading ? "Đang tải số liệu…" : `${eventCount} cuộc thi trong kỳ`,
        state: loading ? "blocked" : "done",
        anchor: "#term-step-overview"
      },
      {
        label: "Cuộc thi & đội",
        detail: teamCount > 0 ? `${eventCount} cuộc thi · ${teamCount} đội` : "Danh sách cuộc thi và đội",
        state: loading ? "blocked" : teamCount > 0 ? "done" : eventCount > 0 ? "active" : "next",
        anchor: "#term-step-competition"
      },
      {
        label: "Nhân sự",
        detail: peopleCount > 0 ? `${peopleCount} người` : "Thí sinh, mentor, giám khảo",
        state: loading ? "blocked" : peopleCount > 0 ? "done" : teamCount > 0 ? "active" : "blocked",
        anchor: "#term-step-people"
      },
      {
        label: "Kết quả & kỹ thuật",
        detail: resultsCount > 0 ? `${resultsCount} bản ghi` : "Xếp hạng, phiếu chấm, repo",
        state: loading ? "blocked" : resultsCount > 0 ? "done" : peopleCount > 0 ? "active" : "next",
        anchor: "#term-step-results"
      }
    ];

    let nextAction: NextStepAction;
    if (loading) {
      nextAction = {
        title: "Đang tải học kỳ",
        description: "Chờ số liệu tổng hợp theo kỳ.",
        href: "#term-step-overview",
        cta: "Tổng quan"
      };
    } else if (eventCount === 0) {
      nextAction = {
        title: "Chưa có cuộc thi trong kỳ",
        description: "Gắn cuộc thi vào học kỳ khi tạo hoặc chỉnh sửa cuộc thi.",
        href: "#term-step-competition",
        cta: "Xem cuộc thi trong kỳ"
      };
    } else if (teamCount === 0) {
      nextAction = {
        title: "Bước tiếp: Theo dõi đội",
        description: `${eventCount} cuộc thi — xem đội đăng ký theo kỳ.`,
        href: "#term-step-competition",
        cta: "Cuộc thi & đội"
      };
    } else if (peopleCount === 0) {
      nextAction = {
        title: "Bước tiếp: Nhân sự kỳ",
        description: "Xem thí sinh, mentor và giám khảo trên các cuộc thi.",
        href: "#term-step-people",
        cta: "Mở Nhân sự"
      };
    } else {
      nextAction = {
        title: "Bước tiếp: Kết quả & repo",
        description: "Xếp hạng, phiếu chấm và repository theo toàn kỳ.",
        href: "#term-step-results",
        cta: "Xem kết quả"
      };
    }

    return { microSteps, nextAction };
  }, [stats, loading]);
}
