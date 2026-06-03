import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import type { DemoAnnouncement } from "../../services/readModelService";
import { fetchNotifications } from "../../services/hackathonApi";

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

export function NotificationCenterPage() {
  const [notifications, setNotifications] = useState<DemoAnnouncement[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications()
      .then((result) => {
        setNotifications(result.data);
        setUsingFallback(result.usingFallback);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ModuleSkeleton rows={3} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Thong bao he thong"
        title="Trung tam thong bao"
        description="Theo doi cac thong bao se gui cho thi sinh, mentor, judge va finalist."
        actions={usingFallback ? <Badge tone="warning">Du lieu minh hoa</Badge> : <Badge tone="success">Du lieu he thong</Badge>}
      />

      {usingFallback ? (
        <div className="rounded-xl border border-primary/20 bg-primary-fixed p-md">
          <p className="font-body-sm text-on-surface-variant">
            Trung tam thong bao hien dang doc tu du lieu minh hoa. Khi backend notification san sang, noi dung se duoc
            lay tu he thong thay vi mock.
          </p>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="table-header-bg">
              <tr className="font-label-sm text-on-surface-variant">
                <th className="px-md py-sm">Noi dung</th>
                <th className="px-md py-sm">Nguoi nhan</th>
                <th className="px-md py-sm">Lich gui</th>
                <th className="px-md py-sm">Trang thai</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {notifications.map((item) => (
                <tr key={item.id} className="font-body-sm text-on-surface">
                  <td className="px-md py-md font-label-md">{item.title}</td>
                  <td className="px-md py-md">{item.audience}</td>
                  <td className="px-md py-md">{formatDate(item.scheduledAt)}</td>
                  <td className="px-md py-md">
                    <Badge tone={getStatusTone(item.status)}>{getStatusLabel(item.status)}</Badge>
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
