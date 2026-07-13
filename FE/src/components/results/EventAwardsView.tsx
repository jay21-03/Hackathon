import { useMemo } from "react";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import type { EventAwards } from "../../services/awardApi";
import { groupAwardCategoriesByRound } from "../../utils/awardLabels";

interface EventAwardsViewProps {
  awards: EventAwards;
  highlightTeamId?: number | null;
  roundNameById?: Record<number, string>;
}

export function EventAwardsView({
  awards,
  highlightTeamId,
  roundNameById = {}
}: EventAwardsViewProps) {
  const categoryGroups = useMemo(() => {
    const withWinners = awards.categories
      .map((c) => ({
        ...c,
        winners: [...c.winners]
          .filter((w) => !w.teamStatus || w.teamStatus === "CONFIRMED")
          .sort(
            (a, b) => new Date(a.awardedAt).getTime() - new Date(b.awardedAt).getTime() || a.id - b.id
          )
      }))
      .filter((c) => c.winners.length > 0);
    return groupAwardCategoriesByRound(withWinners, roundNameById);
  }, [awards.categories, roundNameById]);

  if (!awards.published) {
    return (
      <EmptyState
        icon="emoji_events"
        title="Chưa công bố giải thưởng"
        description="Ban tổ chức sẽ công bố danh sách giải sau khi hoàn tất chấm điểm."
      />
    );
  }

  if (categoryGroups.length === 0) {
    return (
      <EmptyState
        icon="emoji_events"
        title="Chưa có đội nhận giải"
        description="Giải đã công bố nhưng chưa có đội được gán, hoặc các đội nhận giải không còn đủ điều kiện."
      />
    );
  }

  return (
    <section className="rounded-xl border border-outline-variant p-lg space-y-md">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <h2 className="font-headline-sm">Kết quả trao giải</h2>
        <Badge tone="active">Đã công bố</Badge>
      </div>
      <div className="space-y-lg">
        {categoryGroups.map((group) => (
          <div key={group.key} className="space-y-md">
            <h3 className="font-label-md text-on-surface-variant">{group.roundName}</h3>
            <ul className="space-y-md">
              {group.categories.map((category) => (
                <li key={category.id} className="rounded-lg border border-outline-variant p-md">
                  <div className="flex flex-wrap items-baseline justify-between gap-sm mb-sm">
                    <h4 className="font-label-lg">{category.name}</h4>
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
          </div>
        ))}
      </div>
    </section>
  );
}
