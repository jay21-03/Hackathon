import { useMemo } from "react";
import type { NextStepAction } from "../components/ui/NextStepPanel";
import type { WorkflowStepState } from "../domain/organizerWorkflow";
import type { BoardSlotResponse } from "../services/contestApi";

interface BoardWithSlots {
  slots: BoardSlotResponse[];
}

export function useBoardSetupProgress(
  roundsCount: number,
  boards: BoardWithSlots[]
) {
  return useMemo(() => {
    const boardsCount = boards.length;
    const slotsCount = boards.reduce((sum, item) => sum + item.slots.length, 0);
    const assignedCount = boards.reduce(
      (sum, item) => sum + item.slots.filter((slot) => slot.teamId).length,
      0
    );

    const hasRounds = roundsCount > 0;
    const hasBoards = boardsCount > 0;
    const hasSlots = slotsCount > 0;
    const structureReady = hasRounds && hasBoards && hasSlots;

    const microSteps: Array<{
      label: string;
      detail: string;
      state: WorkflowStepState;
      anchor?: string;
      to?: string;
    }> = [
      {
        label: "Vòng thi",
        detail: hasRounds ? `${roundsCount} vòng` : "Tạo vòng đầu tiên",
        state: hasRounds ? "done" : "active",
        anchor: "#board-step-round"
      },
      {
        label: "Bảng & vị trí",
        detail: hasBoards
          ? hasSlots
            ? `${boardsCount} bảng · ${slotsCount} vị trí`
            : `${boardsCount} bảng — thêm vị trí`
          : "Thêm bảng và vị trí trên cùng màn",
        state: !hasRounds ? "blocked" : structureReady ? "done" : hasBoards ? "active" : "next",
        anchor: "#board-step-layout"
      },
      {
        label: "Tiếp theo",
        detail: "Đội & lời mời",
        state: structureReady ? "next" : "blocked",
        to: structureReady ? "/organizer/teams-hub" : undefined
      }
    ];

    let nextAction: NextStepAction;
    let completedMacroIndex: number;

    if (!hasRounds) {
      nextAction = {
        title: "Bước tiếp: Tạo vòng thi",
        description: "Nhập tên vòng, thời gian và bấm «Tạo vòng thi».",
        href: "#board-step-round",
        cta: "Đi tới form vòng"
      };
      completedMacroIndex = 1;
    } else if (!structureReady) {
      nextAction = {
        title: "Bước tiếp: Bảng & vị trí",
        description: "Thêm bảng và vị trí — gán đội sẽ làm ở Vận hành bảng khi đã có đội.",
        href: "#board-step-layout",
        cta: "Đi tới bảng & vị trí"
      };
      completedMacroIndex = 2;
    } else {
      nextAction = {
        title: "Hoàn tất khung bảng — sang Đội & lời mời",
        description: "Theo dõi đăng ký và lời mời trong lúc chờ đủ đội.",
        to: "/organizer/teams-hub",
        cta: "Đi tới Đội & lời mời"
      };
      completedMacroIndex = 3;
    }

    return {
      microSteps,
      nextAction,
      completedMacroIndex,
      stats: { roundsCount, boardsCount, slotsCount, assignedCount }
    };
  }, [roundsCount, boards]);
}
