import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/ui/Icon";

const demoMembers = [
  { initials: "JD", name: "John Doe", role: "Captain" },
  { initials: "SJ", name: "Sarah Jenkins", role: "Member" },
  { initials: "MK", name: "Mike Kim", role: "Member" }
];

export function MyTeamPage() {
  return (
    <div className="space-y-lg max-w-2xl">
      <header>
        <h1 className="font-headline-md text-on-surface mb-xs">My Team Hub</h1>
        <p className="font-body-md text-on-surface-variant">
          Team size limit: 1–5 members. Invite teammates via email.
        </p>
      </header>

      <article className="glass-panel rounded-xl p-lg space-y-md">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-headline-sm">Team Alpha</h2>
            <p className="font-body-sm text-on-surface-variant">Event: SEAL Hackathon</p>
          </div>
          <Badge tone="success">Confirmed</Badge>
        </div>

        <ul className="space-y-sm">
          {demoMembers.map((m) => (
            <li
              key={m.initials}
              className="flex items-center gap-sm bg-surface p-sm rounded-lg border border-outline-variant/30"
            >
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
                {m.initials}
              </div>
              <div className="flex-1">
                <p className="font-body-md">{m.name}</p>
                <p className="font-body-sm text-on-surface-variant">{m.role}</p>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="w-full py-sm border border-dashed border-outline-variant text-on-surface-variant rounded-lg font-label-md hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <Icon name="person_add" />
          Invite Member
        </button>
      </article>

      <Link
        to="/me/check-in"
        className="inline-flex items-center gap-2 text-primary font-label-md"
      >
        Proceed to Check-in
        <Icon name="arrow_forward" className="text-sm" />
      </Link>
    </div>
  );
}
