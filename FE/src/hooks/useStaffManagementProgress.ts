import { useMemo } from "react";
import type { NextStepAction } from "../components/ui/NextStepPanel";
import type { WorkflowStepState } from "../domain/organizerWorkflow";

interface StaffManagementProgressInput {
  showCarryover: boolean;
  carryoverApplied: boolean;
  invitationCount: number;
}

export function useStaffManagementProgress({
  showCarryover,
  carryoverApplied,
  invitationCount
}: StaffManagementProgressInput) {
  return useMemo(() => {
    const readyForBoards = carryoverApplied || invitationCount > 0;

    const microSteps: Array<{
      label: string;
      detail: string;
      state: WorkflowStepState;
      anchor?: string;
      to?: string;
    }> = [];

    if (showCarryover) {
      microSteps.push({
        label: "Chuyển từ kỳ cũ",
        detail: carryoverApplied ? "Đã chuyển staff từ kỳ trước" : "Tick chọn GK/mentor kỳ trước",
        state: carryoverApplied ? "done" : "active",
        anchor: "#staff-step-carryover"
      });
    }

    microSteps.push(
      {
        label: "Mời mentor/GK",
        detail:
          invitationCount > 0
            ? `${invitationCount} lời mời đang theo dõi`
            : "Gửi lời mời email (người ngoài)",
        state:
          showCarryover && !carryoverApplied
            ? "next"
            : invitationCount > 0
              ? "done"
              : "active",
        anchor: "#staff-step-invitations"
      },
      {
        label: "Tiếp theo",
        detail: "Gán trên bảng thi",
        state: readyForBoards ? "next" : "blocked",
        to: readyForBoards ? "/organizer/boards#board-step-staff" : undefined
      }
    );

    let nextAction: NextStepAction;
    if (showCarryover && !carryoverApplied && invitationCount === 0) {
      nextAction = {
        title: "Bước tiếp: Chuyển từ kỳ cũ",
        description: "Chọn GK/mentor nội bộ từ kỳ trước — chuyển thẳng sang kỳ mới, không gửi email.",
        href: "#staff-step-carryover",
        cta: "Đi tới chuyển kỳ"
      };
    } else if (!readyForBoards) {
      nextAction = {
        title: "Bước tiếp: Mời mentor/GK",
        description: "Chuyển từ kỳ cũ hoặc gửi lời mời email cho người mới.",
        href: "#staff-step-invitations",
        cta: "Đi tới lời mời"
      };
    } else {
      nextAction = {
        title: "Bước tiếp: Gán trên bảng thi",
        description: "Staff đã trong pool kỳ mới — gán mentor/GK trên từng bảng.",
        to: "/organizer/boards#board-step-staff",
        cta: "Đi tới Quản lý bảng thi"
      };
    }

    return { microSteps, nextAction };
  }, [carryoverApplied, invitationCount, showCarryover]);
}
