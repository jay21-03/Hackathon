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
            onSubmit({
              since: new Date(since).toISOString(),
              until: new Date(until).toISOString(),
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
            <Button type="submit" size="sm" loading={loading}>
              Backfill
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
