import { useEffect, useMemo, useState } from "react";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableToolbar } from "../../components/ui/TableToolbar";
import {
  getDensityCellClass,
  TableDensityToggle,
  type TableDensity
} from "../../components/ui/TableDensityToggle";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { useUserManagement } from "../../hooks/useUserManagement";
import { assignRoleSchema } from "../../domain/schemas";
import { assignUserRole, updateUserApproval } from "../../services/userService";
import { resolveApiError } from "../../utils/apiError";

export function UserManagementPage() {
  const { notify } = useToast();
  const [density, setDensity] = useState<TableDensity>("comfortable");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING_APPROVAL">("ALL");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "PARTICIPANT" | "MENTOR" | "JUDGE" | "ORGANIZER">("ALL");
  const [listPage, setListPage] = useState(0);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const pageSize = 25;
  const { users, total, totalPages, loading, error, invalidate, refetch } = useUserManagement(
    listPage,
    pageSize,
    debouncedSearch
  );
  const cell = getDensityCellClass(density);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const statusMatch = statusFilter === "ALL" || user.status === statusFilter;
      const roleMatch = roleFilter === "ALL" || user.roles.includes(roleFilter);
      return statusMatch && roleMatch;
    });
  }, [roleFilter, statusFilter, users]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setListPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  async function handleAssignRole(userId: number, role: "ORGANIZER" | "MENTOR" | "JUDGE") {
    const parsed = assignRoleSchema.safeParse({ role });
    if (!parsed.success) {
      notify(parsed.error.issues[0]?.message ?? "Vai trò không hợp lệ.", "warning");
      return;
    }
    setAssigningId(userId);
    try {
      await assignUserRole(userId, parsed.data.role);
      await invalidate();
      notify("Đã gán vai trò.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Gán vai trò thất bại."), "danger");
    } finally {
      setAssigningId(null);
    }
  }

  async function handleApproval(userId: number, action: "APPROVE" | "REJECT") {
    setApprovingId(userId);
    try {
      await updateUserApproval(userId, action);
      await invalidate();
      notify(action === "APPROVE" ? "Đã duyệt tài khoản." : "Đã từ chối tài khoản.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Cập nhật duyệt tài khoản thất bại."), "danger");
    } finally {
      setApprovingId(null);
    }
  }

  if (loading) return <ModuleSkeleton rows={5} variant="table" />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Quản trị"
        title="Người dùng hệ thống"
        description="Duyệt tài khoản thí sinh và gán vai trò ban tổ chức, mentor hoặc giám khảo."
      />

      {error ? (
        <RetryPanel
          message={error}
          onRetry={() => {
            void refetch();
            void invalidate();
          }}
        />
      ) : null}

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <TableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm theo tên, email, MSSV…"
          actions={
            <div className="flex flex-wrap items-center gap-sm">
              <select
                className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-body-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "ALL" | "PENDING_APPROVAL")}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING_APPROVAL">Chờ duyệt</option>
              </select>
              <select
                className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 font-body-sm"
                value={roleFilter}
                onChange={(e) =>
                  setRoleFilter(e.target.value as "ALL" | "PARTICIPANT" | "MENTOR" | "JUDGE" | "ORGANIZER")
                }
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="PARTICIPANT">Thí sinh</option>
                <option value="MENTOR">Mentor</option>
                <option value="JUDGE">Giám khảo</option>
                <option value="ORGANIZER">Ban tổ chức</option>
              </select>
              <TableDensityToggle value={density} onChange={setDensity} />
            </div>
          }
        />
        <DataTable
          headers={["Họ tên", "Email", "Loại SV", "MSSV", "Trường", "Vai trò", "Trạng thái", "Thao tác"]}
        >
          {filteredUsers.map((user) => (
            <tr key={user.id} className="font-body-sm text-on-surface">
              <td className={cell}>{user.fullName}</td>
              <td className={`${cell} break-all`}>{user.email}</td>
              <td className={cell}>
                {user.studentType === "FPT"
                  ? "FPT"
                  : user.studentType === "EXTERNAL"
                    ? "Ngoài trường"
                    : "—"}
              </td>
              <td className={cell}>{user.studentId ?? "—"}</td>
              <td className={cell}>{user.university ?? "—"}</td>
              <td className={cell}>
                {user.roles
                  .map((role) =>
                    role === "ORGANIZER"
                      ? "Ban tổ chức"
                      : role === "MENTOR"
                        ? "Mentor"
                        : role === "JUDGE"
                          ? "Giám khảo"
                          : role === "PARTICIPANT"
                            ? "Thí sinh"
                            : role
                  )
                  .join(", ")}
              </td>
              <td className={cell}>
                <Badge tone={getStatusTone(user.status)}>{getStatusLabel(user.status)}</Badge>
              </td>
              <td className={cell}>
                <div className="flex flex-col gap-1">
                  {user.status === "PENDING_APPROVAL" ? (
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        disabled={approvingId === user.id}
                        onClick={() => void handleApproval(user.id, "APPROVE")}
                      >
                        Duyệt
                      </Button>
                      <ConfirmAction
                        title="Từ chối tài khoản?"
                        message={`${user.fullName || user.email} sẽ bị vô hiệu hóa và không tham gia được.`}
                        confirmLabel="Từ chối"
                        onConfirm={() => void handleApproval(user.id, "REJECT")}
                      >
                        <Button size="sm" variant="ghost" disabled={approvingId === user.id}>
                          Từ chối
                        </Button>
                      </ConfirmAction>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-1">
                    {(
                      [
                        ["MENTOR", "Mentor"],
                        ["JUDGE", "Giám khảo"],
                        ["ORGANIZER", "Ban tổ chức"]
                      ] as const
                    ).map(([role, label]) => {
                      const disabled = assigningId === user.id || user.roles.includes(role);
                      if (role === "ORGANIZER" && !disabled) {
                        return (
                          <ConfirmAction
                            key={role}
                            title="Gán quyền ban tổ chức?"
                            message={`${user.fullName || user.email} sẽ có quyền quản trị cuộc thi và dữ liệu nhạy cảm.`}
                            confirmLabel="Gán quyền"
                            onConfirm={() => void handleAssignRole(user.id, role)}
                          >
                            <Button size="sm" variant="ghost">
                              {label}
                            </Button>
                          </ConfirmAction>
                        );
                      }
                      return (
                        <Button
                          key={role}
                          size="sm"
                          variant="ghost"
                          disabled={disabled}
                          onClick={() => void handleAssignRole(user.id, role)}
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
        {totalPages > 1 ? (
          <div className="flex items-center justify-between gap-md border-t border-outline-variant px-md py-sm">
            <p className="font-body-sm text-on-surface-variant">
              Trang {listPage + 1}/{totalPages} · {total} người dùng
            </p>
            <div className="flex gap-sm">
              <Button
                type="button"
                variant="ghost"
                disabled={listPage <= 0}
                onClick={() => setListPage((p) => Math.max(0, p - 1))}
              >
                Trước
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={listPage >= totalPages - 1}
                onClick={() => setListPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
