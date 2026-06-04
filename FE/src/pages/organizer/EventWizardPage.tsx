import { Navigate } from "react-router-dom";

/** Luồng quy trình đã gộp vào trang chỉnh sửa — giữ route để link cũ vẫn hoạt động. */
export function EventWizardPage() {
  return <Navigate to="/organizer/events/basic-info" replace />;
}
