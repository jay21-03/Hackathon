import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { useToast } from "../../components/feedback/ToastProvider";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { queryKeys } from "../../lib/queryKeys";
import { fetchEventRankings } from "../../services/rankingApi";
import { resolveApiError } from "../../utils/apiError";
import { downloadRankingsCsv } from "../../utils/exportRankingsCsv";
import { downloadRankingsPdf } from "../../utils/exportRankingsPdf";
import { buildRankingWorkflowSteps } from "../../utils/rankingWorkflow";

export function ExportSuccessPage() {
  const { notify } = useToast();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const [exporting, setExporting] = useState(false);

  const rankingsQuery = useQuery({
    queryKey: [...queryKeys.rankings.event(eventId), "export"],
    queryFn: () => fetchEventRankings(eventId!),
    enabled: Boolean(eventId)
  });

  function filteredBoards(publishedOnly: boolean) {
    const boards = rankingsQuery.data?.boards ?? [];
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
      <PageHeader
        eyebrow="Xuất dữ liệu"
        title="Xuất bảng xếp hạng"
        description="Tải CSV UTF-8 từ xếp hạng đã tính (nháp hoặc đã công bố)."
        actions={<EventSelector events={events} eventId={eventId} onChange={setEventId} />}
      />

      <WorkflowSteps
        title="Quy trình kết quả"
        description="Xuất báo cáo sau khi tính và (tuỳ chọn) công bố kết quả."
        steps={buildRankingWorkflowSteps("export")}
      />

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
            <Link to="/organizer/ranking">
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
    </div>
  );
}
