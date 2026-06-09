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
    id: "registrations",
    label: "Đăng ký đội",
    detail: "Duyệt đội và danh sách chờ",
    path: "/organizer/registrations"
  },
  {
    id: "invitations",
    label: "Mời thành viên",
    detail: "Theo dõi và gửi lại mời thành viên",
    path: "/organizer/invitations"
  },
  {
    id: "boards",
    label: "Bảng thi",
    detail: "Vòng, bảng, vị trí, gán đội",
    path: "/organizer/boards"
  },
  {
    id: "problems",
    label: "Đề thi",
    detail: "Mở đề theo bảng",
    path: "/organizer/problems"
  },
  {
    id: "assignments",
    label: "Phân công",
    detail: "Mentor & giám khảo",
    path: "/organizer/assignments"
  },
  {
    id: "rubric",
    label: "Tiêu chí chấm",
    detail: "Rubric trước khi chấm điểm",
    path: "/organizer/rubric"
  }
];

