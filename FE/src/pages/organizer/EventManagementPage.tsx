import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoEvent, demoPublicEvents } from "../../services/demoDataService";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", { dateStyle: "medium" });
}

export function EventManagementPage() {
  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Cuoc thi"
        title="Quan ly cau hinh cuoc thi"
        description="Theo doi thoi gian dang ky, quota, kich thuoc doi va trang thai cong bo cua tung cuoc thi."
        actions={
          <Link to="/organizer/events/new" className="btn-primary inline-flex items-center gap-2">
            <Icon name="add_circle" />
            Tao cuoc thi
          </Link>
        }
      />

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Quota" value={`${demoEvent.confirmedTeams}/${demoEvent.quota}`} helper="Doi da xac nhan" icon="groups" />
        <StatCard label="Kich thuoc doi" value={`${demoEvent.minTeamSize}-${demoEvent.maxTeamSize}`} helper="Thanh vien moi doi" icon="group" tone="success" />
        <StatCard label="Mo de" value={formatDate(demoEvent.releaseAt)} helper="Theo release_at" icon="schedule" tone="warning" />
      </section>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="table-header-bg">
              <tr className="font-label-sm text-on-surface-variant">
                <th className="px-md py-sm">Cuoc thi</th>
                <th className="px-md py-sm">Dang ky</th>
                <th className="px-md py-sm">Dien ra</th>
                <th className="px-md py-sm">Trang thai</th>
                <th className="px-md py-sm">Thao tac</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {demoPublicEvents.map((event) => (
                <tr key={event.id} className="font-body-sm text-on-surface">
                  <td className="px-md py-md font-label-md">{event.name}</td>
                  <td className="px-md py-md">{formatDate(event.registrationStartAt)} - {formatDate(event.registrationEndAt)}</td>
                  <td className="px-md py-md">{formatDate(event.startDate)} - {formatDate(event.endDate)}</td>
                  <td className="px-md py-md">
                    <Badge tone={getStatusTone(event.status)}>{getStatusLabel(event.status)}</Badge>
                  </td>
                  <td className="px-md py-md">
                    <Link to="/organizer/events/basic-info" className="btn-secondary inline-flex items-center gap-2">
                      <Icon name="edit" />
                      Chinh sua
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
