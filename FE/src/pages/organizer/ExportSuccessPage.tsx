import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { useToast } from "../../components/feedback/ToastProvider";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { queryKeys } from "../../lib/queryKeys";
import { fetchEventAwards } from "../../services/awardApi";
import { fetchEventRankings } from "../../services/rankingApi";
import { resolveApiError } from "../../utils/apiError";
import { downloadAwardsCsv } from "../../utils/exportAwardsCsv";
import { downloadAwardsPdf } from "../../utils/exportAwardsPdf";
import { downloadAwardsExcel } from "../../utils/exportAwardsExcel";
import { downloadRankingsCsv } from "../../utils/exportRankingsCsv";
import { downloadRankingsExcel } from "../../utils/exportRankingsExcel";
import { downloadRankingsPdf } from "../../utils/exportRankingsPdf";
import { sortBoardRankings } from "../../utils/sortContestData";
import { buildRankingWorkflowSteps } from "../../utils/rankingWorkflow";

export function ExportSuccessPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { notify } = useToast();
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const [exporting, setExporting] = useState(false);

  const rankingsQuery = useQuery({
    queryKey: [...queryKeys.rankings.event(eventId), "export"],
    queryFn: () => fetchEventRankings(eventId!),
    enabled: Boolean(eventId)
  });

  const awardsQuery = useQuery({
    queryKey: [...queryKeys.awards.event(eventId), "export"],
    queryFn: () => fetchEventAwards(eventId!),
    enabled: Boolean(eventId)
  });

  function filteredBoards(publishedOnly: boolean) {
    const boards = sortBoardRankings(rankingsQuery.data?.boards ?? []);
    return publishedOnly ? boards.filter((b) => b.published) : boards;
  }

  function handleExportCsv(publishedOnly: boolean) {
    const filtered = filteredBoards(publishedOnly);
    if (filtered.length === 0 || filtered.every((b) => b.entries.length === 0)) {
      notify("Không có dữ liệu để xuất.", "warning");
      return;
    }
    setExporting(true);
    try {
      downloadRankingsCsv(filtered, `rankings-event-${eventId}${publishedOnly ? "-published" : ""}.csv`);
      notify("Đã tải file CSV.", "success");
    } finally {
      setExporting(false);
    }
  }

  function handleExportExcel(publishedOnly: boolean) {
    const filtered = filteredBoards(publishedOnly);
    if (filtered.length === 0 || filtered.every((b) => b.entries.length === 0)) {
      notify("Không có dữ liệu để xuất.", "warning");
      return;
    }
    setExporting(true);
    try {
      downloadRankingsExcel(filtered, `rankings-event-${eventId}${publishedOnly ? "-published" : ""}.xlsx`);
      notify("Đã tải file Excel.", "success");
    } finally {
      setExporting(false);
    }
  }

  function handleExportPdf(publishedOnly: boolean) {
    const filtered = filteredBoards(publishedOnly);
    if (filtered.length === 0 || filtered.every((b) => b.entries.length === 0)) {
      notify("Không có dữ liệu để xuất.", "warning");
      return;
    }
    setExporting(true);
    try {
      downloadRankingsPdf(filtered, `rankings-event-${eventId}${publishedOnly ? "-published" : ""}.pdf`);
      notify("Đã mở bản in PDF — chọn «Lưu thành PDF» trong hộp thoại in.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Xuất PDF thất bại.", "danger");
    } finally {
      setExporting(false);
    }
  }

  if (eventLoading || rankingsQuery.isLoading) {
    return <ModuleSkeleton rows={4} />;
  }

  const boards = rankingsQuery.data?.boards ?? [];
  const hasData = boards.some((b) => b.entries.length > 0);

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <>
          <PageHeader
            eyebrow="Xuất dữ liệu"
            title="Xuất bảng xếp hạng"
            description="Tải CSV/Excel/PDF xếp hạng và danh sách trao giải."
            actions={<OrganizerContextBar />}
          />
          <WorkflowSteps
            title="Quy trình kết quả"
            description="Xuất báo cáo sau khi tính và (tuỳ chọn) công bố kết quả."
            steps={buildRankingWorkflowSteps("export")}
          />
        </>
      ) : null}

      {rankingsQuery.error ? (
        <RetryPanel
          message={resolveApiError(rankingsQuery.error, "Không tải được dữ liệu xuất báo cáo.")}
          onRetry={() => void rankingsQuery.refetch()}
        />
      ) : null}

      {!hasData ? (
        <EmptyState
          icon="download"
          title="Chưa có xếp hạng"
          description="Tính xếp hạng tại trang Bảng xếp hạng trước khi xuất."
          action={
            <Link to={embedded ? "/organizer/results-hub#results-step-ranking" : "/organizer/ranking"}>
              <Button type="button" variant="ghost">
                Đến bảng xếp hạng
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-wrap gap-md">
          <Button type="button" loading={exporting} onClick={() => handleExportCsv(false)}>
            Xuất CSV (tất cả)
          </Button>
          <Button type="button" variant="secondary" loading={exporting} onClick={() => handleExportCsv(true)}>
            Xuất CSV (đã công bố)
          </Button>
          <Button type="button" variant="secondary" loading={exporting} onClick={() => handleExportExcel(false)}>
            Xuất Excel (tất cả)
          </Button>
          <Button type="button" variant="secondary" loading={exporting} onClick={() => handleExportExcel(true)}>
            Xuất Excel (đã công bố)
          </Button>
          <Button type="button" variant="ghost" loading={exporting} onClick={() => handleExportPdf(false)}>
            In / PDF (tất cả)
          </Button>
          <Button type="button" variant="ghost" loading={exporting} onClick={() => handleExportPdf(true)}>
            In / PDF (đã công bố)
          </Button>
          {eventId ? (
            <Link
              to={`/events/${eventId}/results`}
              className="self-center font-label-md text-primary hover:underline"
            >
              Xem trang công khai
            </Link>
          ) : null}
        </div>
      )}

      {awardsQuery.data && awardsQuery.data.categories.some((c) => c.winners.length > 0) ? (
        <section className="rounded-xl border border-outline-variant p-lg space-y-md">
          <h2 className="font-headline-sm">Xuất danh sách trao giải</h2>
          <p className="font-body-sm text-on-surface-variant">
            {awardsQuery.data.published
              ? "Dữ liệu đã công bố — phù hợp chia sẻ chính thức."
              : "Đang ở trạng thái nháp — công bố giải trước khi chia sẻ rộng rãi."}
          </p>
          <div className="flex flex-wrap gap-md">
            <Button
              type="button"
              variant="secondary"
              loading={exporting}
              onClick={() => {
                if (!awardsQuery.data) return;
                downloadAwardsCsv(awardsQuery.data, `awards-event-${eventId}.csv`);
                notify("Đã tải CSV giải thưởng.", "success");
              }}
            >
              CSV giải thưởng
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={exporting}
              onClick={() => {
                if (!awardsQuery.data) return;
                downloadAwardsExcel(awardsQuery.data, `awards-event-${eventId}.xlsx`);
                notify("Đã tải Excel giải thưởng.", "success");
              }}
            >
              Excel giải thưởng
            </Button>
            <Button
              type="button"
              variant="ghost"
              loading={exporting}
              onClick={() => {
                if (!awardsQuery.data) return;
                try {
                  downloadAwardsPdf(awardsQuery.data, `awards-event-${eventId}.pdf`);
                  notify("Đã mở bản in PDF giải thưởng.", "success");
                } catch (err) {
                  notify(err instanceof Error ? err.message : "Xuất PDF thất bại.", "danger");
                }
              }}
            >
              In / PDF giải thưởng
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
