import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { getRankingRows } from "../../services/readModelService";
import { fetchPublishedResults } from "../../services/resultService";
import { formatNumber } from "../../utils/validation";

interface ResultsPortalPageProps {
  participantView?: boolean;
}

export function ResultsPortalPage({ participantView = false }: ResultsPortalPageProps) {
  const [rows, setRows] = useState(getRankingRows());
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPublishedResults()
      .then((result) => {
        if (cancelled) return;
        setRows(result.data);
        setUsingFallback(result.usingFallback);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <ModuleSkeleton rows={4} />;
  }

  const published = true;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow={participantView ? "Ket qua doi thi" : "Cong thong tin ket qua"}
        title="Ket qua SEAL Hackathon 2026"
        description="Ket qua chi hien thi sau khi ban to chuc cong bo. Diem danh gia AI khong anh huong xep hang."
        actions={
          <Badge tone={usingFallback ? "warning" : "active"}>{published ? "Da cong bo" : "Ban nhap"}</Badge>
        }
      />

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="table-header-bg">
              <tr className="font-label-sm text-on-surface-variant">
                <th className="px-md py-sm">Hang</th>
                <th className="px-md py-sm">Doi thi</th>
                <th className="px-md py-sm">Bang</th>
                <th className="px-md py-sm">Diem TB</th>
                <th className="px-md py-sm">Phieu da chot</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {rows.map((row, index) => (
                <tr key={row.team.id} className="font-body-sm text-on-surface">
                  <td className="px-md py-md">#{index + 1}</td>
                  <td className="px-md py-md">
                    <p className="font-label-md">{row.team.name}</p>
                    <p className="text-on-surface-variant">AI tham khao: {row.team.aiReviewScore}/100</p>
                  </td>
                  <td className="px-md py-md">{row.team.board}</td>
                  <td className="px-md py-md">{formatNumber(row.averageScore)}</td>
                  <td className="px-md py-md">{row.submittedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {!participantView && (
        <ButtonLink to="/events" variant="secondary" icon={<Icon name="arrow_back" />}>
          Quay lai danh sach cuoc thi
        </ButtonLink>
      )}
    </div>
  );
}
