import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/ui/Icon";

const demoTeams = [
  { id: "T-042", name: "Neural Navigators", members: 4, board: "Board Alpha-1", status: "Confirmed" as const },
  { id: "T-043", name: "Syntax Errors", members: 5, board: "Board Beta-3", status: "Pending Check-in" as const },
  { id: "T-044", name: "Quantum Quokkas", members: 2, board: "Unassigned", status: "Waitlist" as const },
  { id: "T-045", name: "Data Miners Inc", members: 4, board: "Board Gamma-2", status: "Confirmed" as const }
];

function teamStatusTone(status: string) {
  if (status === "Confirmed") return "success";
  if (status.includes("Pending")) return "warning";
  return "neutral";
}

export function OrganizerDashboardPage() {
  return (
    <div className="space-y-lg">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-md border-b border-outline-variant pb-md">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge tone="active">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block mr-1" />
              Live Event
            </Badge>
            <span className="font-mono-data text-on-surface-variant">ID: SEAL-26-X</span>
          </div>
          <h1 className="font-headline-lg text-on-surface">SEAL Hackathon 2026</h1>
        </div>
        <div className="flex flex-wrap gap-sm">
          <button
            type="button"
            className="px-4 py-2 bg-surface-variant hover:bg-surface-bright text-on-surface border border-outline-variant rounded-lg font-label-md flex items-center gap-2"
          >
            <Icon name="functions" className="text-[18px]" />
            Calculate Rankings
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-primary-container text-on-primary-container rounded-lg font-label-md flex items-center gap-2 hover:opacity-90 shadow-[0_0_15px_rgba(77,142,255,0.2)]"
          >
            <Icon name="publish" className="text-[18px]" />
            Publish Results
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-12 gap-md">
        <div className="md:col-span-3 bg-surface-container rounded-xl p-md border border-outline-variant/50 relative overflow-hidden group hover:border-outline-variant transition-colors">
          <Icon
            name="group"
            className="absolute top-3 right-3 text-[64px] opacity-10 group-hover:opacity-20"
          />
          <h3 className="font-label-sm text-on-surface-variant mb-sm">Registration Quota</h3>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-headline-md text-on-surface">42</span>
            <span className="font-body-sm text-on-surface-variant">/ 50 Max Teams</span>
          </div>
          <div className="h-1.5 w-full bg-surface-variant rounded-full mt-sm mb-md overflow-hidden">
            <div className="h-full bg-primary rounded-full w-[84%]" />
          </div>
          <div className="pt-sm border-t border-outline-variant/30 flex justify-between">
            <span className="font-body-sm text-on-surface-variant">Team Size Limit</span>
            <span className="font-mono-data bg-surface-variant px-2 py-0.5 rounded">1 - 5</span>
          </div>
        </div>

        <div className="md:col-span-6 bg-surface-container rounded-xl p-md border border-outline-variant/50">
          <h3 className="font-label-sm text-on-surface-variant mb-sm">Tong quan cuoc thi</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
            {[
              { label: "Registered", value: "156", sub: "+12%" },
              { label: "Checked-in", value: "148", sub: "94% Rate" },
              { label: "Boards", value: "12", sub: "Active" },
              { label: "Judging", value: "68%", sub: "Round 1" }
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col px-sm first:pl-0">
                <span className="font-body-sm text-on-surface-variant mb-1">{stat.label}</span>
                <span className="font-headline-md text-on-surface">{stat.value}</span>
                <span className="font-label-sm text-secondary mt-1 normal-case">{stat.sub}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-3 ai-glow-panel rounded-xl p-md flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-sm relative z-10">
            <h3 className="font-label-sm text-primary flex items-center gap-1 normal-case">
              <Icon name="psychology" className="text-[16px]" />
              AI Auditor Status
            </h3>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
          </div>
          <div className="my-md relative z-10">
            <span className="font-body-sm text-on-surface-variant block mb-1">
              Next Global Review Cycle
            </span>
            <div className="font-mono-data text-headline-sm bg-surface/50 border border-outline-variant/30 inline-block px-3 py-1 rounded">
              08:45 <span className="text-primary text-sm">MIN</span>
            </div>
          </div>
          <button
            type="button"
            className="w-full py-1.5 font-label-sm text-primary border border-primary/30 rounded bg-primary/5 hover:bg-primary/10 relative z-10 mt-auto normal-case"
          >
            Force Early Run
          </button>
        </div>
      </section>

      <section className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-md border-b border-outline-variant flex flex-col sm:flex-row justify-between gap-md bg-surface-variant/30">
          <div>
            <h2 className="font-headline-sm text-on-surface">Team Directory</h2>
            <p className="font-body-sm text-on-surface-variant">
              Manage team statuses, board assignments, and check-ins.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]"
            />
            <input
              type="text"
              placeholder="Search teams..."
              className="w-full bg-surface border border-outline-variant rounded-lg pl-9 pr-3 py-1.5 font-body-sm focus:outline-none focus:border-primary-container"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface-variant/50 border-b border-outline-variant">
                {["Team ID", "Team Name", "Members", "Board", "Status"].map((h) => (
                  <th key={h} className="py-3 px-md font-label-sm text-on-surface-variant normal-case">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50 font-body-sm">
              {demoTeams.map((team) => (
                <tr key={team.id} className="hover:bg-surface-variant/30 transition-colors">
                  <td className="py-3 px-md font-mono-data text-outline">{team.id}</td>
                  <td className="py-3 px-md font-medium">{team.name}</td>
                  <td className="py-3 px-md">
                    <span className="flex items-center gap-1">
                      <Icon name="person" className="text-[16px] text-outline-variant" />
                      {team.members}
                    </span>
                  </td>
                  <td className="py-3 px-md">
                    <span className="bg-surface border border-outline-variant px-2 py-0.5 rounded text-xs">
                      {team.board}
                    </span>
                  </td>
                  <td className="py-3 px-md">
                    <Badge tone={teamStatusTone(team.status)}>{team.status}</Badge>
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
