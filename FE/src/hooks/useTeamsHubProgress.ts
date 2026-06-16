import { useMemo } from "react";
import type { NextStepAction } from "../components/ui/NextStepPanel";
import type { WorkflowStepState } from "../domain/organizerWorkflow";

interface TeamsHubProgressInput {
  confirmedTeams: number;
  pendingTeams: number;
}

export function useTeamsHubProgress({ confirmedTeams, pendingTeams }: TeamsHubProgressInput) {
  return useMemo(() => {
    const hasTeams = confirmedTeams > 0;
    const microSteps: Array<{
      label: string;
      detail: string;
      state: WorkflowStepState;
      anchor?: string;
      to?: string;
    }> = [
      {
        label: "Đăng ký đội",
        detail: hasTeams
          ? `${confirmedTeams} đội xác nhận`
          : pendingTeams > 0
            ? `${pendingTeams} đội chờ duyệt`
            : "Duyệt và theo dõi đội",
        state: hasTeams ? "done" : "active",
        anchor: "#teams-step-registrations"
      },
      {
        label: "Lời mời thành viên",
        detail: "Theo dõi email mời đội",
        state: hasTeams ? "done" : "next",
        anchor: "#teams-step-invitations-members"
      },
      {
        label: "Tiếp theo",
        detail: "Vận hành bảng",
        state: hasTeams ? "next" : "blocked",
        to: hasTeams ? "/organizer/board-ops" : undefined
      }
    ];

    let nextAction: NextStepAction;
    if (!hasTeams && pendingTeams > 0) {
      nextAction = {
        title: "Bước tiếp: Duyệt đội",
        description: `${pendingTeams} đội đang chờ — duyệt hoặc chờ xác nhận email.`,
        href: "#teams-step-registrations",
        cta: "Đi tới đăng ký đội"
      };
    } else if (!hasTeams) {
      nextAction = {
        title: "Theo dõi đăng ký đội",
        description: "Chờ đội đăng ký — có thể sang Vận hành bảng khi cần gán đội.",
        href: "#teams-step-registrations",
        cta: "Đi tới đăng ký đội"
      };
    } else {
      nextAction = {
        title: "Bước tiếp: Vận hành bảng",
        description: `Đã có ${confirmedTeams} đội — gán đội vào vị trí trên bảng.`,
        to: "/organizer/board-ops",
        cta: "Đi tới Vận hành bảng"
      };
    }

    return { microSteps, nextAction, hasTeams };
  }, [confirmedTeams, pendingTeams]);
}
