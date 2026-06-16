import { Navigate } from "react-router-dom";

/** @deprecated Dùng Quản lý bảng thi — giữ route để tương thích link cũ. */
export function AssignmentManagementPage() {
  return <Navigate to="/organizer/boards#board-step-staff" replace />;
}
