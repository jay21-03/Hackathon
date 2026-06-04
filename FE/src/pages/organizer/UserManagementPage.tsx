import { useEffect, useState } from "react";
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
import { assignUserRole, fetchAdminUsers, type UserSummaryResponse } from "../../services/userService";

export function UserManagementPage() {
  const { notify } = useToast();
  const [density, setDensity] = useState<TableDensity>("comfortable");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const cell = getDensityCellClass(density);

  useEffect(() => {
    fetchAdminUsers()
      .then(setUsers)
      .catch(() => setError("Khong tai duoc danh sach nguoi dung."))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter((user) =>
    [user.fullName, user.email, user.roles.join(" ")].some((value) =>
      value.toLowerCase().includes(search.trim().toLowerCase())
    )
  );

  async function handleAssignRole(userId: number, role: "ORGANIZER" | "MENTOR" | "JUDGE") {
    setAssigningId(userId);
    try {
      const updated = await assignUserRole(userId, role);
      setUsers((current) => current.map((user) => (user.id === userId ? updated : user)));
      notify(`Da gan vai tro ${role}.`, "success");
    } catch {
      notify("Gan vai tro that bai.", "danger");
    } finally {
      setAssigningId(null);
    }
  }

  if (loading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Nguoi dung va vai tro"
        title="Phan quyen he thong"
        description="Quan ly tai khoan theo vai tro participant, organizer, mentor va judge."
      />

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface">{error}</p>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <TableToolbar
          searchValue={search}
          searchPlaceholder="Tim ten, email hoac vai tro"
          onSearchChange={setSearch}
          filters={<TableDensityToggle value={density} onChange={setDensity} />}
        />
        <DataTable headers={["Ho ten", "Email", "Vai tro", "Trang thai", "Gan vai tro"]}>
          {filteredUsers.map((user) => (
            <tr key={user.id} className="font-body-sm text-on-surface">
              <td className={cell}>{user.fullName}</td>
              <td className={`${cell} break-all`}>{user.email}</td>
              <td className={cell}>{user.roles.join(", ")}</td>
              <td className={cell}>
                <Badge tone={getStatusTone(user.status)}>{getStatusLabel(user.status)}</Badge>
              </td>
              <td className={cell}>
                <div className="flex flex-wrap gap-1">
                  {(["MENTOR", "JUDGE", "ORGANIZER"] as const).map((role) => (
                    <Button
                      key={role}
                      size="sm"
                      variant="ghost"
                      disabled={assigningId === user.id || user.roles.includes(role)}
                      onClick={() => handleAssignRole(user.id, role)}
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </section>
    </div>
  );
}
