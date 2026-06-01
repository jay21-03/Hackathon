import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/ui/Icon";

export function ParticipantDashboardPage() {
  return (
    <div className="space-y-lg">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md border-b border-outline-variant pb-md">
        <div>
          <h1 className="font-headline-lg text-on-surface mb-xs">Participant Dashboard</h1>
          <p className="font-body-md text-on-surface-variant">
            Welcome back. Competition is currently active.
          </p>
        </div>
        <div className="flex items-center gap-sm px-md py-sm bg-surface-container rounded-full border border-outline-variant">
          <span className="w-2 h-2 rounded-full bg-secondary" />
          <span className="font-label-sm normal-case text-on-surface">Checked In</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
        <div className="md:col-span-8 bg-surface-container rounded-xl p-lg border border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="font-label-sm text-on-surface-variant mb-sm flex items-center gap-1 normal-case">
              <Icon name="timer" className="text-[16px]" />
              Next Milestone: Competition End
            </h3>
            <div className="flex items-baseline gap-md font-mono-data">
              <div>
                <span className="text-5xl md:text-6xl font-bold text-primary leading-none">14</span>
                <span className="font-label-sm text-on-surface-variant block mt-1 normal-case">
                  Hours
                </span>
              </div>
              <span className="text-5xl text-outline-variant">:</span>
              <div>
                <span className="text-5xl md:text-6xl font-bold text-on-surface leading-none">
                  22
                </span>
                <span className="font-label-sm text-on-surface-variant block mt-1 normal-case">
                  Mins
                </span>
              </div>
              <span className="text-5xl text-outline-variant">:</span>
              <div>
                <span className="text-5xl md:text-6xl font-bold text-on-surface leading-none">
                  45
                </span>
                <span className="font-label-sm text-on-surface-variant block mt-1 normal-case">
                  Secs
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-variant h-1 mt-md rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full w-[65%]" />
            </div>
          </div>
        </div>

        <div className="md:col-span-4 bg-surface-container rounded-xl p-lg border border-white/5 flex flex-col">
          <div className="flex justify-between items-start mb-md">
            <h3 className="font-headline-sm">My Team</h3>
            <Badge tone="success">Confirmed</Badge>
          </div>
          <p className="font-label-sm text-on-surface-variant mb-sm normal-case">Members (demo)</p>
          <div className="flex flex-col gap-sm flex-1">
            {["Captain", "Member 2", "Member 3"].map((m) => (
              <div
                key={m}
                className="flex items-center gap-sm bg-surface p-xs rounded border border-outline-variant/30"
              >
                <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[10px] font-bold">
                  {m[0]}
                </div>
                <span className="font-body-sm">{m}</span>
              </div>
            ))}
          </div>
          <Link
            to="/me/team"
            className="w-full mt-md py-sm border border-primary/50 text-primary rounded-lg font-label-md text-center hover:bg-primary/5 transition-colors"
          >
            Manage Team
          </Link>
        </div>

        <div className="md:col-span-8 bg-surface-container rounded-xl border border-white/5 overflow-hidden">
          <div className="bg-surface-variant px-lg py-sm border-b border-outline-variant/30">
            <h3 className="font-label-sm text-on-surface-variant flex items-center gap-1 normal-case">
              <Icon name="code" className="text-[16px]" />
              Active Problem Statement
            </h3>
          </div>
          <div className="p-lg">
            <h4 className="font-headline-md mb-md">Optimize Latency in Distributed Sensor Networks</h4>
            <p className="font-body-md text-on-surface-variant mb-lg">
              Develop a routing algorithm capable of reducing transmission latency across a
              simulated IoT network while maintaining data integrity.
            </p>
            <div className="flex gap-sm flex-wrap">
              <Link
                to="/me/problem"
                className="bg-primary text-on-primary px-md py-sm rounded font-label-md"
              >
                View Full Spec
              </Link>
              <button
                type="button"
                className="border border-outline-variant text-on-surface px-md py-sm rounded font-label-md flex items-center gap-1 hover:bg-surface-variant"
              >
                <Icon name="download" className="text-[18px]" />
                Dataset
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 ai-glow-panel rounded-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-ai/10 blur-3xl rounded-full pointer-events-none" />
          <div className="bg-surface-variant px-lg py-sm border-b border-outline-variant/30 flex justify-between relative z-10">
            <h3 className="font-label-sm text-ai flex items-center gap-1 normal-case">
              <Icon name="psychology" className="text-[16px]" />
              AI Auditor
            </h3>
            <span className="font-mono-data text-[10px] text-on-surface-variant">Live feed</span>
          </div>
          <div className="p-md flex flex-col gap-md relative z-10 max-h-[280px] overflow-y-auto">
            <div className="border-l-2 border-ai pl-md">
              <p className="font-label-sm text-on-surface mb-xs normal-case">Commit Review: 10m ago</p>
              <p className="font-body-sm text-on-surface-variant">
                Potential memory leak in{" "}
                <code className="text-primary text-xs">src/routing_core.cpp</code>.
              </p>
            </div>
            <div className="border-l-2 border-outline-variant pl-md opacity-70">
              <p className="font-label-sm text-on-surface mb-xs normal-case">Commit Review: 45m ago</p>
              <p className="font-body-sm text-on-surface-variant">
                Consider refactoring nested loops in NodeMatrix.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
