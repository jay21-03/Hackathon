import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import type { EventAwards } from "../../services/awardApi";

interface EventAwardsViewProps {
  awards: EventAwards;
  highlightTeamId?: number | null;
}

export function EventAwardsView({ awards, highlightTeamId }: EventAwardsViewProps) {
  const categoriesWithWinners = [...awards.categories]
    .filter((c) => c.winners.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
    .map((c) => ({
      ...c,
      winners: [...c.winners].sort(
        (a, b) => new Date(a.awardedAt).getTime() - new Date(b.awardedAt).getTime() || a.id - b.id
      )
    }));

  if (!awards.published || categoriesWithWinners.length === 0) {
    return (
      <EmptyState
        icon="emoji_events"
        title="Chưa công bố giải thưởng"
        description="Ban tổ chức sẽ công bố danh sách giải sau khi hoàn tất chấm điểm."
      />
    );
  }

  return (
    <section className="rounded-xl border border-outline-variant p-lg space-y-md">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <h2 className="font-headline-sm">Kết quả trao giải</h2>
        <Badge tone="active">Đã công bố</Badge>
      </div>
      <ul className="space-y-md">
        {categoriesWithWinners.map((category) => (
          <li key={category.id} className="rounded-lg border border-outline-variant p-md">
            <div className="flex flex-wrap items-baseline justify-between gap-sm mb-sm">
              <h3 className="font-label-lg">{category.name}</h3>
              {category.prizeValue ? (
                <span className="font-body-sm text-on-surface-variant">{category.prizeValue}</span>
              ) : null}
            </div>
            {category.description ? (
              <p className="font-body-sm text-on-surface-variant mb-sm">{category.description}</p>
            ) : null}
            <ul className="space-y-xs font-body-sm">
              {category.winners.map((winner) => {
                const highlighted = highlightTeamId != null && winner.teamId === highlightTeamId;
                return (
                  <li
                    key={winner.id}
                    className={highlighted ? "font-medium text-primary" : undefined}
                  >
                    {winner.teamName}
                    {winner.note ? (
                      <span className="text-on-surface-variant"> — {winner.note}</span>
                    ) : null}
                    {highlighted ? (
                      <Badge tone="active" className="ml-sm align-middle">
                        Đội của bạn
                      </Badge>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
