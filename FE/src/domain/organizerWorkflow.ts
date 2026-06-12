export type WorkflowStepState = "done" | "active" | "next" | "blocked";

export interface OrganizerMacroStep {
  id: string;
  label: string;
  detail: string;
  path: string;
}

/** Luồng vận hành BTC (macro) — dùng trên nhiều trang. */
export const ORGANIZER_MACRO_STEPS: OrganizerMacroStep[] = [
  {
    id: "basic",
    label: "Thông tin",
    detail: "Tên, quota, mở đăng ký",
    path: "/organizer/events/basic-info"
  },
  {
    id: "boards",
    label: "Bảng thi",
    detail: "Vòng, bảng và vị trí",
    path: "/organizer/boards"
  },
  {
    id: "teams-hub",
    label: "Đội & lời mời",
    detail: "Đăng ký, duyệt đội và theo dõi lời mời",
    path: "/organizer/teams-hub"
  },
  {
    id: "board-ops",
    label: "Vận hành bảng",
    detail: "Gán đội, mentor, giám khảo & đề thi",
    path: "/organizer/board-ops"
  },
  {
    id: "artifacts-hub",
    label: "Bài nộp & repo",
    detail: "Tiêu chí chấm, repository GitHub và nộp bài",
    path: "/organizer/artifacts-hub"
  },
  {
    id: "results-hub",
    label: "Kết quả",
    detail: "Chấm điểm, xếp hạng, công bố & chung kết",
    path: "/organizer/results-hub"
  }
];
