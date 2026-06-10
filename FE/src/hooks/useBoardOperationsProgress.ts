import { useMemo } from "react";
import type { NextStepAction } from "../components/ui/NextStepPanel";
import type { WorkflowStepState } from "../domain/organizerWorkflow";

interface BoardOpsProgressInput {
  boardsCount: number;
  hasProblem: boolean;
  mentorCount: number;
  judgeCount: number;
}

export function useBoardOperationsProgress({
  boardsCount,
  hasProblem,
  mentorCount,
  judgeCount
}: BoardOpsProgressInput) {
  return useMemo(() => {
    const hasBoards = boardsCount > 0;
    const hasMentor = mentorCount > 0;
    const hasJudge = judgeCount > 0;
    const setupComplete = hasProblem && hasMentor && hasJudge;

    const microSteps: Array<{
      label: string;
      detail: string;
      state: WorkflowStepState;
      anchor?: string;
      to?: string;
    }> = [
      {
        label: "Đề thi",
        detail: hasProblem ? "Đã có đề trên bảng đang chọn" : "Tạo hoặc cập nhật đề",
        state: !hasBoards ? "blocked" : hasProblem ? "done" : "active",
        anchor: "#ops-step-problem"
      },
      {
        label: "Mentor",
        detail: hasMentor ? `${mentorCount} mentor` : "Gán ít nhất một mentor",
        state: !hasProblem ? "blocked" : hasMentor ? "done" : "active",
        anchor: "#ops-step-mentor"
      },
      {
        label: "Giám khảo",
        detail: hasJudge ? `${judgeCount} giám khảo` : "Gán ít nhất một giám khảo",
        state: !hasProblem ? "blocked" : hasJudge ? "done" : hasMentor ? "active" : "next",
        anchor: "#ops-step-judge"
      },
      {
        label: "Tiếp theo",
        detail: "Tiêu chí chấm",
        state: setupComplete ? "next" : "blocked",
        to: setupComplete ? "/organizer/results-hub" : undefined
      }
    ];

    let nextAction: NextStepAction;
    if (!hasBoards) {
      nextAction = {
        title: "Chưa có bảng thi",
        description: "Tạo vòng, bảng và gán đội trong mục Bảng thi trước.",
        to: "/organizer/boards",
        cta: "Đi tới Bảng thi"
      };
    } else if (!hasProblem) {
      nextAction = {
        title: "Bước tiếp: Cấu hình đề thi",
        description: "Nhập tên đề, thời gian mở/đóng và lưu cho bảng đang chọn.",
        href: "#ops-step-problem",
        cta: "Đi tới form đề thi"
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
    } else {
      nextAction = {
        title: "Hoàn tất vận hành bảng — sang tiêu chí chấm",
        description: "Đề, mentor và giám khảo đã sẵn sàng cho bảng đang chọn.",
        to: "/organizer/results-hub",
        cta: "Đi tới Kết quả"
      };
    }

    return { microSteps, nextAction, setupComplete };
  }, [boardsCount, hasProblem, mentorCount, judgeCount]);
}
