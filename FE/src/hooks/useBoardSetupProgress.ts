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
    const hasAssignments = assignedCount > 0;

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
        label: "Bảng",
        detail: hasBoards ? `${boardsCount} bảng` : "Thêm ít nhất một bảng",
        state: !hasRounds ? "blocked" : hasBoards ? "done" : "active",
        anchor: "#board-step-board"
      },
      {
        label: "Vị trí & gán đội",
        detail: hasSlots
          ? hasAssignments
            ? `${assignedCount}/${slotsCount} vị trí đã gán`
            : `${slotsCount} vị trí — chưa gán`
          : "Thêm vị trí và gán đội trên cùng màn",
        state: !hasBoards ? "blocked" : hasAssignments ? "done" : hasSlots ? "active" : "next",
        anchor: "#board-step-slots"
      },
      {
        label: "Tiếp theo",
        detail: "Đề thi & phân công",
        state: hasAssignments ? "next" : "blocked",
        to: hasAssignments ? "/organizer/problems" : undefined
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
    } else if (!hasBoards) {
      nextAction = {
        title: "Bước tiếp: Thêm bảng",
        description: "Dùng «Tên bảng mới» + «Thêm bảng» cho vòng đang chọn.",
        href: "#board-step-board",
        cta: "Đi tới form bảng"
      };
      completedMacroIndex = 2;
    } else if (!hasSlots || !hasAssignments) {
      nextAction = {
        title: "Bước tiếp: Vị trí & gán đội",
        description:
          "Thêm vị trí và gán đội ngay trên cùng màn — dùng «Phân công ngẫu nhiên» hoặc chọn từng vị trí.",
        href: "#board-step-slots",
        cta: "Đi tới vị trí & gán đội"
      };
      completedMacroIndex = 3;
    } else {
      nextAction = {
        title: "Hoàn tất bảng thi — sang bước tiếp",
        description: "Cấu hình đề thi theo bảng, sau đó gán mentor và giám khảo.",
        to: "/organizer/problems",
        cta: "Cấu hình đề thi"
      };
      completedMacroIndex = 4;
    }

    return {
      microSteps,
      nextAction,
      completedMacroIndex,
      stats: { roundsCount, boardsCount, slotsCount, assignedCount }
    };
  }, [roundsCount, boards]);
}
