import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { resolveRoleFromApiRoles, setAuthSession, getAuthSession } from "../../auth/authSession";
import { ModuleSkeleton } from "../ui/ModuleSkeleton";
import { PageHeader } from "../ui/PageHeader";
import { ButtonLink } from "../ui/Button";
import { useApiRoles } from "../../hooks/useApiRoles";

/**
 * Đảm bảo tài khoản có role ORGANIZER trên server (JWT), không chỉ vai trò UI local/dev switcher.
 */
export function OrganizerApiGate() {
  const { user, hasOrganizer, loading, error } = useApiRoles();
  const session = getAuthSession();

  useEffect(() => {
    if (!user) return;
    const role = resolveRoleFromApiRoles(user.roles);
    if (session.email !== user.email || session.role !== role) {
      setAuthSession({ role, email: user.email, name: user.fullName });
    }
  }, [user, session.email, session.role]);

  if (loading) {
    return (
      <div className="p-lg">
        <ModuleSkeleton rows={4} />
      </div>
    );
  }

  if (error || !hasOrganizer) {
    return (
      <div className="space-y-lg p-lg">
        <PageHeader
          eyebrow="Ban tổ chức"
          title="Không có quyền ban tổ chức"
          description={
            error
              ? "Không kiểm tra được quyền tài khoản. Hãy đăng nhập lại."
              : "Tài khoản hiện tại chưa có quyền ban tổ chức. Liên hệ quản trị viên để được gán quyền, sau đó đăng xuất và đăng nhập lại."
          }
        />
        <div className="flex flex-wrap gap-sm">
          <ButtonLink to="/login" variant="secondary">
            Đăng nhập lại
          </ButtonLink>
          <ButtonLink to="/events">Danh sách cuộc thi</ButtonLink>
        </div>
        {import.meta.env.DEV && import.meta.env.VITE_ENABLE_ROLE_SWITCHER === "true" ? (
          <p className="rounded-lg border border-warning/40 bg-warning-container/30 p-md font-body-sm text-on-surface">
            Dev: đổi vai trò trên giao diện không thay quyền thật — cần gán quyền ban tổ chức trong hệ thống.
          </p>
        ) : null}
      </div>
    );
  }

  return <Outlet />;
}
