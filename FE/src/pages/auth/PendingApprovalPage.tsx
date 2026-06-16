import { Link, Navigate, useLocation } from "react-router-dom";
import { AuthAlert, AuthFormShell } from "../../components/auth/AuthFormShell";
import { clearAccessToken } from "../../auth/tokenStorage";
import { setAuthenticated } from "../../auth/authSession";
import { Button } from "../../components/ui/Button";
import { isStaffInvitationActionPath } from "../../utils/staffInvitationPaths";

export function PendingApprovalPage() {
  const location = useLocation();
  const returnTo = (location.state as { from?: string } | null)?.from?.trim();

  if (returnTo && isStaffInvitationActionPath(returnTo)) {
    return <Navigate to={returnTo} replace />;
  }

  function handleLogout() {
    setAuthenticated(false);
    clearAccessToken();
    window.location.href = "/login";
  }

  return (
    <AuthFormShell
      title="Chờ ban tổ chức duyệt"
      subtitle="Tài khoản của bạn đã được tạo và đang chờ phê duyệt trước khi tham gia cuộc thi."
      footer={
        <>
          Đã được duyệt?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Đăng nhập lại
          </Link>
        </>
      }
    >
      <AuthAlert tone="warning">
        Ban tổ chức sẽ xem xét thông tin MSSV/trường và kích hoạt tài khoản. Sau khi được duyệt, bạn có thể đăng ký
        đội và nộp bài.
      </AuthAlert>
      <Button type="button" variant="ghost" className="w-full justify-center" onClick={handleLogout}>
        Đăng xuất
      </Button>
    </AuthFormShell>
  );
}
