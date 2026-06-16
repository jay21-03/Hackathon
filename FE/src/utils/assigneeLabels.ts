import type { AssignmentResponse } from "../services/assignmentService";

/** Hiển thị tên người được gán mentor/GK — ưu tiên dữ liệu từ API phân công. */
export function resolveAssigneeLabel(
  row: Pick<AssignmentResponse, "assigneeId" | "assigneeName" | "assigneeEmail">,
  userNameById?: Record<number, string>
): string {
  return (
    row.assigneeName?.trim() ||
    userNameById?.[row.assigneeId]?.trim() ||
    row.assigneeEmail?.trim() ||
    `Người dùng #${row.assigneeId}`
  );
}
