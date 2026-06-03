import { useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableToolbar } from "../../components/ui/TableToolbar";
import {
  getDensityCellClass,
  TableDensityToggle,
  type TableDensity
} from "../../components/ui/TableDensityToggle";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoUsers } from "../../services/demoDataService";

export function UserManagementPage() {
  const [density, setDensity] = useState<TableDensity>("comfortable");
  const [search, setSearch] = useState("");
  const cell = getDensityCellClass(density);
  const filteredUsers = demoUsers.filter((user) =>
    [user.fullName, user.email, user.role].some((value) =>
      value.toLowerCase().includes(search.trim().toLowerCase())
    )
  );

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Nguoi dung va vai tro"
        title="Phan quyen he thong"
        description="Quan ly tai khoan theo vai tro participant, organizer, mentor va judge."
      />
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <TableToolbar
          searchValue={search}
          searchPlaceholder="Tim ten, email hoac vai tro"
          onSearchChange={setSearch}
          filters={<TableDensityToggle value={density} onChange={setDensity} />}
          actions={
            <Button variant="ghost" icon={<Icon name="download" />}>
              Xuat danh sach
            </Button>
          }
        />
        <DataTable headers={["Ho ten", "Email", "Vai tro", "Trang thai"]}>
          {filteredUsers.map((user) => (
            <tr key={user.id} className="font-body-sm text-on-surface">
              <td className={cell}>{user.fullName}</td>
              <td className={`${cell} break-all`}>{user.email}</td>
              <td className={cell}>{user.role}</td>
              <td className={cell}>
                <Badge tone={getStatusTone(user.status)}>{getStatusLabel(user.status)}</Badge>
              </td>
            </tr>
          ))}
        </DataTable>
      </section>
    </div>
  );
}
