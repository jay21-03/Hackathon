import { Badge } from "./Badge";
import type { CommitConnectionStatus } from "../../hooks/useCommitUpdates";

const LABELS: Record<CommitConnectionStatus, string> = {
  disconnected: "Commit ngoại tuyến",
  connecting: "Đang kết nối commit…",
  connected: "Commit thời gian thực"
};

const TONES: Record<CommitConnectionStatus, "success" | "warning" | "neutral"> = {
  disconnected: "neutral",
  connecting: "warning",
  connected: "success"
};

export function CommitConnectionBadge({ status }: { status: CommitConnectionStatus }) {
  return <Badge tone={TONES[status]}>{LABELS[status]}</Badge>;
}
