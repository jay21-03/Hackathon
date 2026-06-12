import { useMemo } from "react";
import type { NextStepAction } from "../components/ui/NextStepPanel";
import type { WorkflowStepState } from "../domain/organizerWorkflow";

interface BoardOpsProgressInput {
  boardsCount: number;
  slotsCount: number;
  assignedCount: number;
  hasProblem: boolean;
  mentorCount: number;
  judgeCount: number;
}

export function useBoardOperationsProgress({
  boardsCount,
  slotsCount,
  assignedCount,
  hasProblem,
  mentorCount,
  judgeCount
}: BoardOpsProgressInput) {
  return useMemo(() => {
    const hasBoards = boardsCount > 0;
    const hasSlots = slotsCount > 0;
    const hasAssignments = assignedCount > 0;
    const hasMentor = mentorCount > 0;
    const hasJudge = judgeCount > 0;
    const setupComplete = hasAssignments && hasMentor && hasJudge && hasProblem;

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
        label: "Mentor",
        detail: hasMentor ? `${mentorCount} mentor` : "Gán ít nhất một mentor",
        state: !hasAssignments ? "blocked" : hasMentor ? "done" : "active",
        anchor: "#ops-step-mentor"
      },
      {
        label: "Giám khảo",
        detail: hasJudge ? `${judgeCount} giám khảo` : "Gán ít nhất một giám khảo",
        state: !hasMentor ? "blocked" : hasJudge ? "done" : "active",
        anchor: "#ops-step-judge"
      },
      {
        label: "Đề thi",
        detail: hasProblem ? "Đã có đề trên bảng đang chọn" : "Tạo hoặc cập nhật đề",
        state: !hasJudge ? "blocked" : hasProblem ? "done" : "active",
        anchor: "#ops-step-problem"
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
        description: "Tạo vòng, bảng và vị trí trong mục Bảng thi trước.",
        to: "/organizer/boards",
        cta: "Đi tới Bảng thi"
      };
    } else if (!hasAssignments) {
      nextAction = {
        title: "Bước tiếp: Gán đội",
        description: "Gán đội đã xác nhận vào vị trí trên bảng đang chọn.",
        href: "#ops-step-teams",
        cta: "Đi tới gán đội"
      };
    } else if (!hasMentor) {
      nextAction = {
        title: "Bước tiếp: Gán mentor",
        description: "Chọn mentor phụ trách bảng đang chọn.",
        href: "#ops-step-mentor",
        cta: "Đi tới phân công mentor"
      };
    } else if (!hasJudge) {
      nextAction = {
        title: "Bước tiếp: Gán giám khảo",
        description: "Chọn giám khảo chấm điểm cho bảng đang chọn.",
        href: "#ops-step-judge",
        cta: "Đi tới phân công GK"
      };
    } else if (!hasProblem) {
      nextAction = {
        title: "Bước tiếp: Cấu hình đề thi",
        description: "Nhập tên đề, thời gian mở/đóng và lưu cho bảng đang chọn.",
        href: "#ops-step-problem",
        cta: "Đi tới form đề thi"
      };
    } else {
      nextAction = {
        title: "Hoàn tất vận hành bảng — sang Bài nộp & repo",
        description: "Đội, staff và đề đã sẵn sàng cho bảng đang chọn.",
        to: "/organizer/artifacts-hub",
        cta: "Đi tới Bài nộp & repo"
      };
    }

    return { microSteps, nextAction, setupComplete };
  }, [assignedCount, boardsCount, hasProblem, judgeCount, mentorCount, slotsCount]);
}
