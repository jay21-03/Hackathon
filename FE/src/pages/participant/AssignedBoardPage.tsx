import { Badge } from "../../components/ui/Badge";
import { PageHeader } from "../../components/ui/PageHeader";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoBoards, demoTeams, getTeamById } from "../../services/demoDataService";

export function AssignedBoardPage() {
  const team = demoTeams[0];
  const board = demoBoards.find((item) => item.teamIds.includes(team.id)) ?? demoBoards[0];

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Bang thi"
        title={board.name}
        description="Doi thi chi thuoc mot bang trong cung round. Judge chi cham cac doi trong bang duoc phan cong."
        actions={<Badge tone={getStatusTone(board.status)}>{getStatusLabel(board.status)}</Badge>}
      />
      <section className="grid gap-lg lg:grid-cols-[1fr_320px]">
        <article className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <h2 className="font-headline-sm text-on-surface">Doi trong bang</h2>
          <div className="mt-md divide-y divide-outline-variant/60">
            {board.teamIds.map((id) => {
              const row = getTeamById(id);
              return (
                <div key={id} className="flex items-center justify-between gap-md py-md">
                  <div>
                    <p className="font-label-md text-on-surface">{row?.name}</p>
                    <p className="font-body-sm text-on-surface-variant">{row?.track}</p>
                  </div>
                  <Badge tone={row?.id === team.id ? "active" : "neutral"}>
                    {row?.id === team.id ? "Doi cua toi" : "Cung bang"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </article>
        <aside className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <h2 className="font-headline-sm text-on-surface">Phan cong</h2>
          <div className="mt-md space-y-sm font-body-sm text-on-surface-variant">
            <p>Round: {board.round}</p>
            <p>Mentor: {board.mentor}</p>
            <p>Judge: {board.judges.join(", ")}</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
