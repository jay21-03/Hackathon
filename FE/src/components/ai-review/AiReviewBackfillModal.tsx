import { useState } from "react";
import { Button } from "../ui/Button";

export interface AiReviewBackfillFormValues {
  since: string;
  until: string;
  runReview: boolean;
}

interface AiReviewBackfillModalProps {
  open: boolean;
  teamLabel: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: AiReviewBackfillFormValues) => void;
}

function defaultSince() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 16);
}

function defaultUntil() {
  return new Date().toISOString().slice(0, 16);
}

export function AiReviewBackfillModal({
  open,
  teamLabel,
  loading = false,
  onClose,
  onSubmit
}: AiReviewBackfillModalProps) {
  const [since, setSince] = useState(defaultSince);
  const [until, setUntil] = useState(defaultUntil);
  const [runReview, setRunReview] = useState(true);

  const sinceDate = since ? new Date(since) : null;
  const untilDate = until ? new Date(until) : null;
  const sinceError = since ? null : "since is required";
  const untilError =
    sinceDate && untilDate && untilDate.getTime() < sinceDate.getTime()
      ? "until must be greater than or equal to since"
      : null;
  const rangeError =
    sinceDate && untilDate && untilDate.getTime() - sinceDate.getTime() > 90 * 24 * 60 * 60 * 1000
      ? "backfill range must not exceed 90 days"
      : null;
  const formInvalid = Boolean(sinceError || untilError || rangeError);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/40 p-md">
      <div
        className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container p-lg shadow-lg"
        role="dialog"
        aria-labelledby="backfill-title"
      >
        <h2 id="backfill-title" className="font-title-sm text-on-surface">
          Backfill commit - {teamLabel}
        </h2>
        <p className="mt-xs font-body-sm text-on-surface-variant">
          Import lịch sử commit từ GitHub vào hệ thống. Tùy chọn chạy AI sau khi import.
        </p>
        <form
          className="mt-md space-y-md"
          onSubmit={(e) => {
            e.preventDefault();
            if (formInvalid || !sinceDate || !untilDate) {
              return;
            }
            onSubmit({
              since: sinceDate.toISOString(),
              until: untilDate.toISOString(),
              runReview
            });
          }}
        >
          <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
            Từ
            <input
              type="datetime-local"
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
              value={since}
              onChange={(e) => setSince(e.target.value)}
              required
            />
            {sinceError ? <span className="font-body-xs text-error">{sinceError}</span> : null}
          </label>
          <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
            Đến
            <input
              type="datetime-local"
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              required
            />
            {untilError ? <span className="font-body-xs text-error">{untilError}</span> : null}
            {rangeError ? <span className="font-body-xs text-error">{rangeError}</span> : null}
          </label>
          <label className="flex items-center gap-sm font-body-sm text-on-surface">
            <input
              type="checkbox"
              checked={runReview}
              onChange={(e) => setRunReview(e.target.checked)}
            />
            Chạy đánh giá AI sau khi import
          </label>
          <div className="flex justify-end gap-sm pt-sm">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" size="sm" loading={loading} disabled={formInvalid || loading}>
              Backfill
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
