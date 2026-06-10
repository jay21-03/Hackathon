import { useMemo } from "react";
import type { NextStepAction } from "../components/ui/NextStepPanel";
import type { WorkflowStepState } from "../domain/organizerWorkflow";

interface TeamsHubProgressInput {
  confirmedTeams: number;
  pendingTeams: number;
  showStaffInvitations: boolean;
}

export function useTeamsHubProgress({
  confirmedTeams,
  pendingTeams,
  showStaffInvitations
}: TeamsHubProgressInput) {
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
        state: hasTeams ? "done" : "blocked",
        anchor: "#teams-step-invitations-members"
      }
    ];

    if (showStaffInvitations) {
      microSteps.push(
        {
          label: "Mời mentor/GK",
          detail: "Lời mời staff theo bảng",
          state: hasTeams ? "active" : "blocked",
          anchor: "#teams-step-invitations-staff"
        },
        {
          label: "Mẫu email",
          detail: "Tùy chỉnh nội dung lời mời",
          state: hasTeams ? "next" : "blocked",
          anchor: "#teams-step-invitations-templates"
        }
      );
    }

    microSteps.push({
      label: "Tiếp theo",
      detail: "Bảng thi",
      state: hasTeams ? "next" : "blocked",
      to: hasTeams ? "/organizer/boards" : undefined
    });

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
        title: "Chưa có đội xác nhận",
        description: "Import CSV hoặc chờ đội đăng ký và xác nhận thành viên.",
        href: "#teams-step-registrations",
        cta: "Đi tới đăng ký đội"
      };
    } else if (showStaffInvitations) {
      nextAction = {
        title: "Bước tiếp: Mời mentor/GK",
        description: `Đã có ${confirmedTeams} đội — gửi lời mời staff hoặc chỉnh mẫu email.`,
        href: "#teams-step-invitations-staff",
        cta: "Mời staff"
      };
    } else {
      nextAction = {
        title: "Bước tiếp: Thiết lập bảng thi",
        description: `Đã có ${confirmedTeams} đội — tạo vòng, bảng và gán đội.`,
        to: "/organizer/boards",
        cta: "Đi tới Bảng thi"
      };
    }

    return { microSteps, nextAction, hasTeams };
  }, [confirmedTeams, pendingTeams, showStaffInvitations]);
}
