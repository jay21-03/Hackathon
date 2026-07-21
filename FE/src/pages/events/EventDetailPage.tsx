import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/ui/Icon";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { getAuthSession, getRoleHome, isAuthenticated, roleLabels } from "../../auth/authSession";
import { resolveEventCardAction } from "../../domain/eventParticipantFlow";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { useMyTeam } from "../../hooks/useMyTeam";
import { useEventDetail } from "../../hooks/useEventDetail";
import type { EventListItem } from "../../types/entities";
import { enableAnnouncements, enableAwards, enableRanking } from "../../config/features";
import { queryKeys } from "../../lib/queryKeys";
import { fetchPublishedAnnouncements } from "../../services/announcementService";
import { fetchPublicEventAwards, isAwardCategoryActive } from "../../services/awardApi";
import { looksLikeRichHtml, sanitizeRichHtml } from "../../utils/sanitizeProblemHtml";
import { rememberActiveEvent } from "../../utils/enterEvent";
import {
  canRegisterForEvent,
  isRegistrationStatusOpen,
  registrationWindowHint
} from "../../utils/registrationErrors";

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch {
    return value;
  }
}

export function EventDetailPage() {
  const authenticated = isAuthenticated();
  const session = getAuthSession();
  const roleHome = getRoleHome(session.role);
  const roleLabel = roleLabels[session.role];
  const { eventId: eventIdParam } = useParams();
  const eventIdNum = eventIdParam ? Number(eventIdParam) : null;
  const { event, loading, error } = useEventDetail(eventIdParam);
  const { team, loading: teamLoading } = useMyTeam(
    authenticated && session.role === "participant" ? eventIdNum : null
  );

  const announcementsQuery = useQuery({
    queryKey: queryKeys.announcements.byEvent(eventIdNum),
    queryFn: () => fetchPublishedAnnouncements(eventIdNum!),
    enabled: enableAnnouncements && eventIdNum != null && !Number.isNaN(eventIdNum)
  });

  const awardsQuery = useQuery({
    queryKey: queryKeys.awards.public(eventIdNum),
    queryFn: () => fetchPublicEventAwards(eventIdNum!),
    enabled: enableAwards && eventIdNum != null && !Number.isNaN(eventIdNum)
  });

  const pageLoading = loading || (authenticated && session.role === "participant" && teamLoading);

  if (pageLoading) {
    return <ModuleSkeleton rows={3} />;
  }

  if (!event) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface p-md shadow-sm">
        <p className="text-error font-body-md">Không tìm thấy cuộc thi.</p>
        <Link to="/events" className="text-primary font-label-md mt-md inline-block">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const listItem: EventListItem = {
    id: event.id,
    name: event.name,
    startDate: event.startDate,
    endDate: event.endDate,
    registrationStartAt: event.registrationStartAt ?? "",
    registrationEndAt: event.registrationEndAt ?? "",
    status: event.status
  };

  const primaryAction = resolveEventCardAction({
    authenticated,
    role: session.role,
    event: listItem,
    team: team ?? null,
    surface: "detail"
  });

  const statusOpen = isRegistrationStatusOpen(event.status);
  const registrationOpen = canRegisterForEvent(
    event.status,
    event.registrationStartAt,
    event.registrationEndAt
  );
  const windowHint = registrationWindowHint(
    event.registrationStartAt,
    event.registrationEndAt
  );
  const publishedAnnouncements = announcementsQuery.data ?? [];
  const awardCategories = (awardsQuery.data?.categories ?? [])
    .filter(isAwardCategoryActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  function handlePrimaryClick() {
    if (eventIdNum != null && !Number.isNaN(eventIdNum)) {
      rememberActiveEvent(eventIdNum);
    }
  }

  return (
    <div className="space-y-lg max-w-3xl mx-auto">
      <Link to="/events" className="inline-flex items-center gap-1 text-primary font-label-md">
        <Icon name="arrow_back" className="text-[18px]" />
        Danh sách các cuộc thi
      </Link>

      {error && (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface-variant">{error}</p>
        </div>
      )}

      <article className="space-y-md rounded-xl border border-outline-variant bg-surface p-md shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-md">
          <div>
            <h1 className="font-headline-lg text-on-surface">{event.name}</h1>
            {event.description ? (
              <p className="font-body-md text-on-surface-variant mt-sm whitespace-pre-wrap">{event.description}</p>
            ) : null}
            <p className="font-body-md text-on-surface-variant mt-xs">
              {team
                ? `Bạn đã có đội trong cuộc thi này: ${team.name} (${getStatusLabel(team.status)}).`
                : authenticated
                  ? "Mỗi cuộc thi một đội riêng — bạn có thể xem thông tin các cuộc thi khác và đăng ký nếu chưa có đội."
                  : "Thông tin công khai — không cần tham gia cuộc thi để xem. Đăng nhập khi muốn đăng ký đội."}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge tone={getStatusTone(event.status)}>{getStatusLabel(event.status)}</Badge>
            {team ? (
              <Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-md font-body-sm text-on-surface-variant">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-md">
            <Icon name="calendar_today" className="text-primary mb-sm" />
            <p className="font-label-sm normal-case text-on-surface">Thời gian thi</p>
            <p>{formatDateTime(event.startDate)}</p>
            <p>{formatDateTime(event.endDate)}</p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-md">
            <Icon name="groups" className="text-primary mb-sm" />
            <p className="font-label-sm normal-case text-on-surface">Quy mô đội</p>
            <p>
              {event.minTeamSize} – {event.maxTeamSize} thành viên
            </p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-md">
            <Icon name="emoji_events" className="text-primary mb-sm" />
            <p className="font-label-sm normal-case text-on-surface">Số đội tối đa</p>
            <p>{event.maxTeams} đội</p>
          </div>
        </div>

        {event.registrationStartAt && event.registrationEndAt ? (
          <div className="space-y-xs font-body-sm text-on-surface-variant">
            <p>
              Khung đăng ký: {formatDateTime(event.registrationStartAt)} –{" "}
              {formatDateTime(event.registrationEndAt)}
            </p>
            {statusOpen && !registrationOpen && windowHint ? (
              <p className="text-on-tertiary-container">{windowHint}</p>
            ) : null}
            {registrationOpen ? (
              <p className="text-secondary">Đang trong khung đăng ký — có thể gửi hồ sơ đội.</p>
            ) : null}
          </div>
        ) : null}

        <section className="space-y-sm border-t border-outline-variant/30 pt-md">
          <h2 className="font-headline-sm text-on-surface">Quy chế thi</h2>
          {event.rules ? (
            looksLikeRichHtml(event.rules) ? (
              <div
                className="problem-content font-body-md text-on-surface-variant prose prose-invert max-w-none [&_a]:text-primary"
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(event.rules) }}
              />
            ) : (
              <p className="whitespace-pre-wrap font-body-md text-on-surface-variant">{event.rules}</p>
            )
          ) : (
            <p className="font-body-md text-on-surface-variant">BTC chưa cập nhật quy chế thi.</p>
          )}
        </section>

        {enableAwards ? (
          <section className="space-y-sm border-t border-outline-variant/30 pt-md">
            <div className="flex flex-wrap items-center justify-between gap-sm">
              <h2 className="font-headline-sm text-on-surface">Cơ cấu giải thưởng</h2>
              {awardsQuery.data?.published ? <Badge tone="active">Đã công bố đội thắng</Badge> : null}
            </div>
            {awardsQuery.isLoading ? (
              <ModuleSkeleton rows={2} />
            ) : awardCategories.length > 0 ? (
              <ul className="grid gap-sm md:grid-cols-2">
                {awardCategories.map((category) => (
                  <li key={category.id} className="rounded-lg border border-outline-variant/50 bg-surface-container-low p-md">
                    <div className="flex flex-wrap items-start justify-between gap-sm">
                      <div>
                        <h3 className="font-label-lg text-on-surface">{category.name}</h3>
                        <p className="font-body-sm text-on-surface-variant">
                          {category.awardType === "RANK" ? "Giải xếp hạng" : "Giải do BTC lựa chọn"}
                          {" · "}
                          Tối đa {category.maxWinners} đội
                        </p>
                      </div>
                      {category.prizeValue ? (
                        <Badge tone="success">{category.prizeValue}</Badge>
                      ) : null}
                    </div>
                    {category.description ? (
                      <p className="mt-sm font-body-sm text-on-surface-variant">{category.description}</p>
                    ) : null}
                    {awardsQuery.data?.published && category.winners.length > 0 ? (
                      <ul className="mt-sm space-y-xs font-body-sm text-on-surface">
                        {category.winners.map((winner) => (
                          <li key={winner.id}>{winner.teamName}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-body-md text-on-surface-variant">BTC chưa cập nhật cơ cấu giải thưởng.</p>
            )}
          </section>
        ) : null}

        <div className="flex flex-wrap gap-sm pt-md border-t border-outline-variant/30">
          {enableRanking ? (
            <Link
              to={`/events/${event.id}/results`}
              className="inline-flex items-center gap-2 border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-label-md hover:bg-surface-container-high"
            >
              <Icon name="leaderboard" className="text-[18px]" />
              Xem kết quả
            </Link>
          ) : null}
          {!authenticated ? (
            <Link
              to="/login"
              state={{ from: `/events/${event.id}` }}
              className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md"
            >
              <Icon name="account_circle" className="text-[18px]" />
              Đăng nhập để tham gia
            </Link>
          ) : session.role === "participant" ? (
            <>
              <Link
                to={primaryAction.to}
                onClick={handlePrimaryClick}
                className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md"
              >
                <Icon name={primaryAction.icon} className="text-[18px]" />
                {primaryAction.label}
              </Link>
              {team ? (
                <Link
                  to="/me"
                  onClick={handlePrimaryClick}
                  className="inline-flex items-center gap-2 border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-label-md hover:bg-surface-container-high"
                >
                  <Icon name="dashboard" className="text-[18px]" />
                  Tiếp tục không gian thi
                </Link>
              ) : null}
            </>
          ) : (
            <Link
              to={roleHome}
              onClick={handlePrimaryClick}
              className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-label-md"
            >
              <Icon name="dashboard" className="text-[18px]" />
              Vào {roleLabel}
            </Link>
          )}
        </div>
      </article>

      {enableAnnouncements && publishedAnnouncements.length > 0 ? (
        <section className="space-y-sm rounded-xl border border-outline-variant bg-surface p-md shadow-sm">
          <h2 className="font-headline-sm text-on-surface">Thông báo từ ban tổ chức</h2>
          <ul className="space-y-sm">
            {publishedAnnouncements.map((item) => (
              <li key={item.id} className="rounded-lg border border-outline-variant/50 bg-surface-container-low p-md">
                <p className="font-headline-sm text-on-surface">{item.title}</p>
                <p className="mt-xs font-label-sm text-outline">{formatDateTime(item.publishedAt ?? item.createdAt)}</p>
                {looksLikeRichHtml(item.content) ? (
                  <div
                    className="problem-content mt-sm font-body-md text-on-surface-variant prose prose-invert max-w-none [&_a]:text-primary"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(item.content) }}
                  />
                ) : (
                  <p className="mt-sm whitespace-pre-wrap font-body-md text-on-surface-variant">{item.content}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
