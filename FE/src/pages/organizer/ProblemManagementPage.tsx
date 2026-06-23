import { Navigate } from "react-router-dom";

/** @deprecated Dùng Quản lý bảng thi — giữ route để tương thích link cũ. */
export function ProblemManagementPage() {
  return (
    <Navigate
      to="/organizer/boards#board-step-problem"
      replace
      state={{
        message: "Trang quản lý đề cũ đã chuyển sang Quản lý bảng thi → bước Đề thi."
      }}
    />
  );
}
