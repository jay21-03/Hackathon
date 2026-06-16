import { useMemo } from "react";
import type { NextStepAction } from "../components/ui/NextStepPanel";
import type { WorkflowStepState } from "../domain/organizerWorkflow";

interface BoardOpsProgressInput {
  boardsCount: number;
  slotsCount: number;
  assignedCount: number;
}

/** Vận hành bảng — chỉ gán đội sau khi đã có đội xác nhận từ đăng ký. */
export function useBoardOperationsProgress({
  boardsCount,
  slotsCount,
  assignedCount
}: BoardOpsProgressInput) {
  return useMemo(() => {
    const hasBoards = boardsCount > 0;
    const hasSlots = slotsCount > 0;
    const hasAssignments = assignedCount > 0;
    const setupComplete = hasAssignments;

    const microSteps: Array<{
      label: string;
      detail: string;
      state: WorkflowStepState;
      anchor?: string;
      to?: string;
    }> = [
      {
        label: "Gán đội",
        detail: hasAssignments
          ? `${assignedCount} vị trí đã gán`
          : hasSlots
            ? `${slotsCount} vị trí — chưa gán`
            : "Cần vị trí trên bảng",
        state: !hasBoards || !hasSlots ? "blocked" : hasAssignments ? "done" : "active",
        anchor: "#ops-step-teams"
      },
      {
        label: "Tiếp theo",
        detail: "Bài nộp & repo",
        state: setupComplete ? "next" : "blocked",
        to: setupComplete ? "/organizer/artifacts-hub" : undefined
      }
    ];

    let nextAction: NextStepAction;
    if (!hasBoards || !hasSlots) {
      nextAction = {
        title: "Chưa có khung bảng",
        description: "Hoàn thành Quản lý bảng thi (vòng, bảng, staff, đề) trước.",
        to: "/organizer/boards",
        cta: "Đi tới Quản lý bảng thi"
      };
    } else if (!hasAssignments) {
      nextAction = {
        title: "Bước tiếp: Gán đội",
        description: "Gán đội đã xác nhận vào vị trí trên bảng đang chọn.",
        href: "#ops-step-teams",
        cta: "Đi tới gán đội"
      };
    } else {
      nextAction = {
        title: "Hoàn tất gán đội — sang Bài nộp & repo",
        description: "Các đội đã vào bảng — tiếp tục theo dõi repository và nộp bài.",
        to: "/organizer/artifacts-hub",
        cta: "Đi tới Bài nộp & repo"
      };
    }

    return { microSteps, nextAction, setupComplete };
  }, [assignedCount, boardsCount, slotsCount]);
}
