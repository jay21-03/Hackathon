import { useMemo } from "react";
import type { NextStepAction } from "../components/ui/NextStepPanel";
import type { WorkflowStepState } from "../domain/organizerWorkflow";
import type { BoardSlotResponse } from "../services/contestApi";

interface BoardWithSlots {
  slots: BoardSlotResponse[];
}

interface BoardSetupProgressInput {
  roundsCount: number;
  boards: BoardWithSlots[];
  mentorCount: number;
  judgeCount: number;
  hasProblem: boolean;
  hasRubric: boolean;
  showRubricStep: boolean;
  hasAwards: boolean;
  showAwardsStep: boolean;
}

export function useBoardSetupProgress({
  roundsCount,
  boards,
  mentorCount,
  judgeCount,
  hasProblem,
  hasRubric,
  showRubricStep,
  hasAwards,
  showAwardsStep
}: BoardSetupProgressInput) {
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
    const hasMentor = mentorCount > 0;
    const hasJudge = judgeCount > 0;
    const staffReady = hasMentor && hasJudge;
    const rubricReady = !showRubricStep || hasRubric;
    const awardsReady = !showAwardsStep || hasAwards;
    const prepReady = structureReady && staffReady && hasProblem && rubricReady && awardsReady;

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
            : `${boardsCount} bảng - thêm vị trí`
          : "Thêm bảng và vị trí trên cùng màn",
        state: !hasRounds ? "blocked" : structureReady ? "done" : hasBoards ? "active" : "next",
        anchor: "#board-step-layout"
      },
      {
        label: "Mentor & giám khảo",
        detail: staffReady
          ? `${mentorCount} mentor · ${judgeCount} GK`
          : hasMentor || hasJudge
            ? "Bổ sung mentor hoặc giám khảo còn thiếu"
            : "Mời và gán ít nhất một mentor và một giám khảo",
        state: !structureReady ? "blocked" : staffReady ? "done" : "active",
        anchor: "#board-step-staff"
      },
      {
        label: "Đề thi",
        detail: hasProblem ? "Đã có đề trên bảng đang chọn" : "Tạo hoặc cập nhật đề",
        state: !staffReady ? "blocked" : hasProblem ? "done" : "active",
        anchor: "#board-step-problem"
      }
    ];

    if (showRubricStep) {
      microSteps.push({
        label: "Tiêu chí chấm",
        detail: hasRubric ? "Đã có rubric" : "Cấu hình rubric theo vòng",
        state: !hasProblem ? "blocked" : hasRubric ? "done" : "active",
        anchor: "#board-step-rubric"
      });
    }

    if (showAwardsStep) {
      microSteps.push({
        label: "Giải thưởng",
        detail: hasAwards ? "Đã có cơ cấu giải" : "Cấu hình hạng mục và giá trị giải",
        state: !hasProblem || (showRubricStep && !hasRubric) ? "blocked" : hasAwards ? "done" : "active",
        anchor: "#board-step-awards"
      });
    }

    microSteps.push({
      label: "Tiếp theo",
      detail: "Đội & lời mời",
      state: prepReady ? "next" : "blocked",
      to: prepReady ? "/organizer/teams-hub" : undefined
    });

    let nextAction: NextStepAction;
    let completedMacroIndex: number;

    if (!hasRounds) {
      nextAction = {
        title: "Bước tiếp: Tạo vòng thi",
        description: "Nhập tên vòng, thời gian và bấm tạo vòng thi.",
        href: "#board-step-round",
        cta: "Đi tới form vòng"
      };
      completedMacroIndex = 1;
    } else if (!structureReady) {
      nextAction = {
        title: "Bước tiếp: Bảng & vị trí",
        description: "Thêm bảng và vị trí; gán đội sẽ làm sau khi mở đăng ký và có đội xác nhận.",
        href: "#board-step-layout",
        cta: "Đi tới bảng & vị trí"
      };
      completedMacroIndex = 2;
    } else if (!staffReady) {
      nextAction = {
        title: "Bước tiếp: Mentor & giám khảo",
        description: "Gán mentor và giám khảo cho bảng trước khi mở đăng ký.",
        href: "#board-step-staff",
        cta: "Đi tới phân công"
      };
      completedMacroIndex = 2;
    } else if (!hasProblem) {
      nextAction = {
        title: "Bước tiếp: Cấu hình đề thi",
        description: "Nhập tên đề, thời gian mở/đóng và lưu cho bảng đang chọn.",
        href: "#board-step-problem",
        cta: "Đi tới form đề thi"
      };
      completedMacroIndex = 2;
    } else if (showRubricStep && !hasRubric) {
      nextAction = {
        title: "Bước tiếp: Tiêu chí chấm",
        description: "Thiết lập rubric trước khi mở đăng ký và vận hành cuộc thi.",
        href: "#board-step-rubric",
        cta: "Đi tới rubric"
      };
      completedMacroIndex = 2;
    } else if (showAwardsStep && !hasAwards) {
      nextAction = {
        title: "Bước tiếp: Cấu hình giải thưởng",
        description: "Thiết lập hạng mục, số đội nhận giải và giá trị giải để hiển thị cho thí sinh.",
        href: "#board-step-awards",
        cta: "Đi tới giải thưởng"
      };
      completedMacroIndex = 2;
    } else {
      nextAction = {
        title: "Hoàn tất chuẩn bị bảng - sang Đội & lời mời",
        description: "Khung bảng, staff, đề, rubric và giải thưởng đã sẵn sàng - có thể mở đăng ký.",
        to: "/organizer/teams-hub",
        cta: "Đi tới Đội & lời mời"
      };
      completedMacroIndex = 3;
    }

    return {
      microSteps,
      nextAction,
      completedMacroIndex,
      stats: { roundsCount, boardsCount, slotsCount, assignedCount },
      prepReady
    };
  }, [
    boards,
    hasAwards,
    hasProblem,
    hasRubric,
    judgeCount,
    mentorCount,
    roundsCount,
    showAwardsStep,
    showRubricStep
  ]);
}
