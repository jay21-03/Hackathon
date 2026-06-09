import { useState } from "react";
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
import { assignUserRole } from "../../services/userService";
import { resolveApiError } from "../../utils/apiError";

export function UserManagementPage() {
  const { notify } = useToast();
  const [density, setDensity] = useState<TableDensity>("comfortable");
  const [search, setSearch] = useState("");
  const [listPage, setListPage] = useState(0);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const pageSize = 25;
  const { users, total, totalPages, loading, error, invalidate } = useUserManagement(listPage, pageSize);
  const cell = getDensityCellClass(density);

  const filteredUsers = users.filter((user) =>
    [user.fullName, user.email, user.roles.join(" ")].some((value) =>
      value.toLowerCase().includes(search.trim().toLowerCase())
    )
  );

  async function handleAssignRole(userId: number, role: "ORGANIZER" | "MENTOR" | "JUDGE") {
    setAssigningId(userId);
    try {
      await assignUserRole(userId, role);
      await invalidate();
      notify("Đã gán vai trò.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Gán vai trò thất bại."), "danger");
    } finally {
      setAssigningId(null);
    }
  }

  if (loading) return <ModuleSkeleton rows={5} variant="table" />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Quản trị"
        title="Người dùng hệ thống"
        description="Gán vai trò ban tổ chức, mentor hoặc giám khảo cho tài khoản đã đăng nhập."
      />

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface">{error}</p>
        </div>
      ) : null}

      <section className="rounded-xl border border-outline-variant bg-surface-container p-lg">
        <TableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm theo tên, email, vai trò…"
          actions={<TableDensityToggle value={density} onChange={setDensity} />}
        />
        <DataTable headers={["Họ tên", "Email", "Vai trò", "Trạng thái", "Gán vai trò"]}>
          {filteredUsers.map((user) => (
            <tr key={user.id} className="font-body-sm text-on-surface">
              <td className={cell}>{user.fullName}</td>
              <td className={`${cell} break-all`}>{user.email}</td>
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
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ["MENTOR", "Mentor"],
                      ["JUDGE", "Giám khảo"],
                      ["ORGANIZER", "Ban tổ chức"]
                    ] as const
                  ).map(([role, label]) => (
                    <Button
                      key={role}
                      size="sm"
                      variant="ghost"
                      disabled={assigningId === user.id || user.roles.includes(role)}
                      onClick={() => void handleAssignRole(user.id, role)}
                    >
                      {label}
                    </Button>
                  ))}
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
