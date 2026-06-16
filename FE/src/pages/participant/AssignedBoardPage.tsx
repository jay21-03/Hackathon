import { useMemo } from "react";
import { Badge } from "../../components/ui/Badge";
import { DataTable } from "../../components/ui/DataTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { ParticipantWorkflowBar } from "../../components/participant/ParticipantWorkflowBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { RoundCountdown } from "../../components/ui/RoundCountdown";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventRound } from "../../hooks/useEventRound";
import { useMyBoard } from "../../hooks/useMyBoard";
import { useMyTeam } from "../../hooks/useMyTeam";
import { useParticipantTeamGuard } from "../../hooks/useParticipantTeamGuard";
import { ParticipantTeamBlocked } from "../../components/participant/ParticipantTeamBlocked";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { formatBoardWithRoundLabel } from "../../utils/boardLabels";

const reasonMessages: Record<string, string> = {
  NO_TEAM: "Bạn chưa đăng ký đội cho cuộc thi này.",
  TEAM_WAITLIST: "Đội đang trong danh sách chờ — chờ ban tổ chức xác nhận.",
  TEAM_REJECTED: "Hồ sơ đội đã bị từ chối.",
  TEAM_DISQUALIFIED: "Đội đã bị loại khỏi cuộc thi.",
  TEAM_NOT_CONFIRMED: "Đội chưa được xác nhận — chờ ban tổ chức duyệt hoặc thành viên xác nhận email.",
  NOT_ASSIGNED: "Ban tổ chức chưa gán đội bạn vào bảng. Hãy quay lại sau khi BTC hoàn tất phân bảng."
};

export function AssignedBoardPage() {
  const { event, eventId, loading: eventLoading } = useActiveEvent();
  const { team, loading: teamLoading } = useMyTeam(eventId);
  const { board, loading: boardLoading, error, refetch } = useMyBoard(eventId);
  const { round, rounds, roundId, countdown, loading: roundLoading } = useEventRound(eventId);
  const activeRound = useMemo(
    () => rounds.find((item) => item.id === (board?.roundId ?? roundId)) ?? round,
    [board?.roundId, round, roundId, rounds]
  );
  const teamGuard = useParticipantTeamGuard(team);

  if (eventLoading || teamLoading || boardLoading) {
    return <ModuleSkeleton rows={4} />;
  }

  if (!team) {
    return (
      <div className="space-y-lg">
        <PageHeader eyebrow="Bảng thi" title="Chưa có đội" description="Đăng ký đội để xem bảng thi." />
        <EmptyState icon="grid_view" title="Chưa có đội thi" description="Đăng ký đội trước khi được phân công bảng." />
      </div>
    );
  }

  if (teamGuard.blocked && teamGuard.message) {
    return (
      <div className="space-y-lg">
        <PageHeader eyebrow="Bảng thi" title={team.name} description={event?.name ?? ""} />
        <ParticipantTeamBlocked message={teamGuard.message} />
      </div>
    );
  }

  if (team.status !== "CONFIRMED") {
    return (
      <div className="space-y-lg">
        <PageHeader
          eyebrow="Bảng thi"
          title={team.name}
          description="Đội cần được xác nhận trước khi ban tổ chức phân công bảng."
          actions={<Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>}
        />
        <EmptyState
          icon="grid_view"
          title="Chưa được phân công bảng"
          description={`Đội đang ở trạng thái ${getStatusLabel(team.status)}. Vui lòng chờ ban tổ chức duyệt.`}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-lg">
        <PageHeader eyebrow="Bảng thi" title={team.name} description={event?.name ?? ""} />
        <RetryPanel message={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  if (!board?.assigned) {
    const hint = reasonMessages[board?.reason ?? "NOT_ASSIGNED"] ?? reasonMessages.NOT_ASSIGNED;
    return (
      <div className="space-y-lg">
        <PageHeader
          eyebrow="Bảng thi"
          title={team.name}
          description={event?.name ?? "Thông tin bảng sẽ hiện khi ban tổ chức gán đội vào bảng."}
          actions={<Badge tone="warning">Chờ phân công bảng</Badge>}
        />
        <RoundCountdown
          roundId={roundId}
          countdown={countdown}
          loading={roundLoading}
          phaseStatus={activeRound?.status}
          phaseName={activeRound?.name}
        />
        <EmptyState icon="grid_view" title="Chưa có thông tin bảng" description={hint} />
      </div>
    );
  }

  const peers = board.peers ?? [];

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Bảng thi"
        title={team.name}
        description={[board.roundName, board.boardName].filter(Boolean).join(" · ")}
        actions={<Badge tone="success">Đã phân bảng</Badge>}
      />

      <ParticipantWorkflowBar active="board" />

      <RoundCountdown
        roundId={board.roundId ?? roundId}
        countdown={countdown}
        loading={roundLoading}
        phaseStatus={activeRound?.status}
        phaseName={activeRound?.name ?? board.roundName}
      />

      <section className="grid gap-md md:grid-cols-3">
        <div className="rounded-xl border border-outline-variant bg-surface-container p-md">
          <p className="font-label-sm normal-case text-on-surface-variant">Bảng</p>
          <p className="mt-xs font-headline-sm text-on-surface">{board.boardName}</p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container p-md">
          <p className="font-label-sm normal-case text-on-surface-variant">Vòng</p>
          <p className="mt-xs font-headline-sm text-on-surface">{board.roundName}</p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container p-md">
          <p className="font-label-sm normal-case text-on-surface-variant">Vị trí</p>
          <p className="mt-xs font-headline-sm text-on-surface">#{board.slotNumber}</p>
        </div>
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface-container">
        <div className="border-b border-outline-variant px-md py-md">
          <h2 className="font-headline-sm text-on-surface">Đội cùng bảng</h2>
          <p className="font-body-sm text-on-surface-variant">
            {peers.length} đội đã được gán vào{" "}
            {formatBoardWithRoundLabel(board.boardName ?? "Bảng", board.roundName)}.
          </p>
        </div>
        <DataTable headers={["Đội", "Vị trí"]}>
          {peers.map((peer) => (
            <tr key={peer.teamId} className="font-body-sm text-on-surface">
              <td className="px-md py-md">
                <span className="font-label-md">
                  {peer.teamName}
                  {peer.teamId === board.teamId ? (
                    <span className="ml-2 text-primary">(đội của bạn)</span>
                  ) : null}
                </span>
              </td>
              <td className="px-md py-md">#{peer.slotNumber}</td>
            </tr>
          ))}
        </DataTable>
      </section>
    </div>
  );
}
