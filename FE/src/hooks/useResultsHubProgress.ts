import { useMemo } from "react";
import type { NextStepAction } from "../components/ui/NextStepPanel";
import type { WorkflowStepState } from "../domain/organizerWorkflow";

interface ResultsHubProgressInput {
  hasBoards: boolean;
  hasRubric: boolean;
  scoringComplete: boolean;
  hasRankings: boolean;
  hasPublished: boolean;
  showFinalsStep: boolean;
  finalsDone: boolean;
  awardsPublished: boolean;
}

export function useResultsHubProgress({
  hasBoards,
  hasRubric,
  scoringComplete,
  hasRankings,
  hasPublished,
  showFinalsStep,
  finalsDone,
  awardsPublished
}: ResultsHubProgressInput) {
  return useMemo(() => {
    const microSteps: Array<{
      label: string;
      detail: string;
      state: WorkflowStepState;
      anchor?: string;
      to?: string;
    }> = [
      {
        label: "Tiến độ chấm",
        detail: scoringComplete ? "Phiếu đã nộp đủ" : "Theo dõi GK nộp phiếu",
        state: !hasBoards || !hasRubric ? "blocked" : scoringComplete ? "done" : "active",
        anchor: "#results-step-scoring"
      },
      {
        label: "Xếp hạng",
        detail: hasRankings ? "Đã tính BXH" : "Tính điểm theo bảng/vòng",
        state: !scoringComplete ? "blocked" : hasRankings ? "done" : "active",
        anchor: "#results-step-ranking"
      },
      {
        label: "Công bố",
        detail: hasPublished ? "Đã công bố vòng nguồn" : "Công bố trước khi chuyển vòng",
        state: !hasRankings ? "blocked" : hasPublished ? "done" : "active",
        anchor: "#results-step-publish"
      }
    ];

    if (showFinalsStep) {
      microSteps.push({
        label: "Chung kết",
        detail: finalsDone ? "Đã chuyển đội" : "Top-N sang vòng tiếp theo",
        state: !hasPublished ? "blocked" : finalsDone ? "done" : "active",
        anchor: "#results-step-finals"
      });
    }

    microSteps.push({
      label: "Trao giải",
      detail: awardsPublished ? "Đã công bố giải" : "Gán hạng mục & công bố",
      state: !hasPublished ? "blocked" : awardsPublished ? "done" : "active",
      anchor: "#results-step-awards"
    });

    microSteps.push({
      label: "Xuất kết quả",
      detail: "CSV / PDF",
      state: hasPublished ? "done" : "blocked",
      anchor: "#results-step-export"
    });

    let nextAction: NextStepAction;
    if (!hasBoards) {
      nextAction = {
        title: "Chưa có bảng thi",
        description: "Hoàn thành Bảng thi và Vận hành bảng trước.",
        to: "/organizer/boards",
        cta: "Đi tới Bảng thi"
      };
    } else if (!hasRubric) {
      nextAction = {
        title: "Bước tiếp: Tiêu chí chấm",
        description: "Thiết lập rubric trong mục Bài nộp & repo trước khi giám khảo chấm.",
        to: "/organizer/artifacts-hub",
        cta: "Đi tới Bài nộp & repo"
      };
    } else if (!scoringComplete) {
      nextAction = {
        title: "Bước tiếp: Tiến độ chấm",
        description: "Theo dõi phiếu chấm và nhắc GK nếu cần.",
        href: "#results-step-scoring",
        cta: "Đi tới tiến độ chấm"
      };
    } else if (!hasRankings) {
      nextAction = {
        title: "Bước tiếp: Tính xếp hạng",
        description: "Tính BXH sau khi đủ phiếu chấm.",
        href: "#results-step-ranking",
        cta: "Đi tới xếp hạng"
      };
    } else if (!hasPublished) {
      nextAction = {
        title: "Bước tiếp: Công bố kết quả",
        description: "Công bố BXH vòng nguồn trước khi chuyển đội sang chung kết.",
        href: "#results-step-publish",
        cta: "Đi tới công bố"
      };
    } else if (showFinalsStep && !finalsDone) {
      nextAction = {
        title: "Bước tiếp: Chuyển đội chung kết",
        description: "Chọn đội từ BXH đã công bố để sang vòng tiếp theo.",
        href: "#results-step-finals",
        cta: "Đi tới chung kết"
      };
    } else if (!awardsPublished) {
      nextAction = {
        title: "Bước tiếp: Trao giải",
        description: "Tạo hạng mục giải, gán đội và công bố kết quả trao giải.",
        href: "#results-step-awards",
        cta: "Đi tới trao giải"
      };
    } else {
      nextAction = {
        title: "Hoàn tất — xuất hoặc xem kết quả công khai",
        description: "Tải CSV/PDF hoặc mở cổng kết quả.",
        href: "#results-step-export",
        cta: "Đi tới xuất kết quả"
      };
    }

    const setupComplete = hasPublished && (!showFinalsStep || finalsDone) && awardsPublished;

    return { microSteps, nextAction, setupComplete };
  }, [
    awardsPublished,
    finalsDone,
    hasBoards,
    hasPublished,
    hasRankings,
    hasRubric,
    scoringComplete,
    showFinalsStep
  ]);
}

