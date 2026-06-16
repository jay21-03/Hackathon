import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ModuleSkeleton } from "../ui/ModuleSkeleton";
import { useActiveTerm } from "../../hooks/useActiveTerm";
import { queryKeys } from "../../lib/queryKeys";
import {
  defaultTabForStep,
  TERM_HUB_TABS,
  TERM_TAB_LABELS,
  type TermHubStep,
  type TermScopedTab
} from "../../pages/organizer/termHubUtils";
import {
  PROVISION_STATUS_LABELS,
  type RepositoryProvisionStatus
} from "../../services/repositoryProvisioningService";
import {
  fetchTermEvents,
  fetchTermJudges,
  fetchTermMentors,
  fetchTermParticipants,
  fetchTermRankings,
  fetchTermRepositories,
  fetchTermScoreSheets,
  fetchTermTeams,
  type TermEventItem,
  type TermParticipant,
  type TermRankingItem,
  type TermRepositoryItem,
  type TermScoreSheetItem,
  type TermScopedList,
  type TermTeamItem,
  type TermUserSummary
} from "../../services/academicTermService";

interface TermScopedResourcesPanelProps {
  hubStep: TermHubStep;
  termId?: number | null;
  termCode?: string | null;
}

export function TermScopedResourcesPanel({
  hubStep,
  termId: termIdOverride,
  termCode
}: TermScopedResourcesPanelProps) {
  const activeTerm = useActiveTerm();
  const termId = termIdOverride ?? activeTerm.termId;
  const enabled = termIdOverride != null ? true : activeTerm.enabled;
  const term = termIdOverride != null ? null : activeTerm.term;
  const [tab, setTab] = useState<TermScopedTab>(() => defaultTabForStep(hubStep));
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    const tabs = TERM_HUB_TABS[hubStep];
    if (tabs.length === 0) return;
    setTab((prev) => (tabs.includes(prev) ? prev : tabs[0]));
    setPage(0);
  }, [hubStep]);

  const eventsQuery = useQuery({
    queryKey: [...queryKeys.academicTerms.detail(termId), "scoped", "events", page],
    queryFn: () => (termId ? fetchTermEvents(termId, page, pageSize) : null),
    enabled: enabled && termId != null && tab === "events"
  });

  const teamsQuery = useQuery({
    queryKey: [...queryKeys.academicTerms.detail(termId), "scoped", "teams", page],
    queryFn: () => (termId ? fetchTermTeams(termId, page, pageSize) : null),
    enabled: enabled && termId != null && tab === "teams"
  });

  const participantsQuery = useQuery({
    queryKey: [...queryKeys.academicTerms.detail(termId), "scoped", "participants", page],
    queryFn: () => (termId ? fetchTermParticipants(termId, page, pageSize) : null),
    enabled: enabled && termId != null && tab === "participants"
  });

  const mentorsQuery = useQuery({
    queryKey: [...queryKeys.academicTerms.detail(termId), "scoped", "mentors", page],
    queryFn: () => (termId ? fetchTermMentors(termId, page, pageSize) : null),
    enabled: enabled && termId != null && tab === "mentors"
  });

  const judgesQuery = useQuery({
    queryKey: [...queryKeys.academicTerms.detail(termId), "scoped", "judges", page],
    queryFn: () => (termId ? fetchTermJudges(termId, page, pageSize) : null),
    enabled: enabled && termId != null && tab === "judges"
  });

  const rankingsQuery = useQuery({
    queryKey: [...queryKeys.academicTerms.detail(termId), "scoped", "rankings", page],
    queryFn: () => (termId ? fetchTermRankings(termId, page, pageSize) : null),
    enabled: enabled && termId != null && tab === "rankings"
  });

  const repositoriesQuery = useQuery({
    queryKey: [...queryKeys.academicTerms.detail(termId), "scoped", "repositories", page],
    queryFn: () => (termId ? fetchTermRepositories(termId, page, pageSize) : null),
    enabled: enabled && termId != null && tab === "repositories"
  });

  const scoreSheetsQuery = useQuery({
    queryKey: [...queryKeys.academicTerms.detail(termId), "scoped", "score-sheets", page],
    queryFn: () => (termId ? fetchTermScoreSheets(termId, page, pageSize) : null),
    enabled: enabled && termId != null && tab === "score-sheets"
  });

  if (!enabled || !termId || hubStep === "#term-step-overview") return null;

  const subTabs = TERM_HUB_TABS[hubStep];

  const listQuery =
    tab === "events"
      ? eventsQuery
      : tab === "teams"
        ? teamsQuery
        : tab === "participants"
          ? participantsQuery
          : tab === "mentors"
            ? mentorsQuery
            : tab === "judges"
              ? judgesQuery
              : tab === "rankings"
                ? rankingsQuery
                : tab === "repositories"
                  ? repositoriesQuery
                  : scoreSheetsQuery;
  const data = listQuery.data;
  const totalPages = data?.totalPages ?? 1;

  const stepTitles: Record<Exclude<TermHubStep, "#term-step-overview">, string> = {
    "#term-step-competition": "Cuộc thi & đội",
    "#term-step-people": "Nhân sự kỳ",
    "#term-step-results": "Kết quả & kỹ thuật"
  };

  return (
    <section className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
      <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-headline-sm text-on-surface">{stepTitles[hubStep]}</h2>
          <p className="font-body-sm text-on-surface-variant">
            {term?.code ?? termCode
              ? `${term?.code ?? termCode} — dữ liệu trên mọi cuộc thi trong kỳ`
              : "Đang tải…"}
          </p>
        </div>
        <div className="flex flex-wrap gap-xs">
          {subTabs.map((key) => (
            <button
              key={key}
              type="button"
              className={`rounded-lg px-md py-xs font-label-md ${
                tab === key ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface"
              }`}
              onClick={() => {
                setTab(key);
                setPage(0);
              }}
            >
              {TERM_TAB_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {listQuery.isLoading ? (
        <ModuleSkeleton rows={3} />
      ) : !data || data.items.length === 0 ? (
        <p className="font-body-sm text-on-surface-variant">Chưa có dữ liệu cho mục này.</p>
      ) : (
        <>
          <TermScopedListItems tab={tab} data={data} />
          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-sm pt-sm">
              <button
                type="button"
                className="font-label-md text-primary disabled:opacity-40"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Trang trước
              </button>
              <span className="font-body-sm text-on-surface-variant">
                Trang {page + 1} / {totalPages} ({data.totalElements} mục)
              </span>
              <button
                type="button"
                className="font-label-md text-primary disabled:opacity-40"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau
              </button>
            </div>
          ) : (
            <p className="font-body-sm text-on-surface-variant pt-sm">{data.totalElements} mục</p>
          )}
        </>
      )}
    </section>
  );
}

function TermScopedListItems({
  tab,
  data
}: {
  tab: TermScopedTab;
  data:
    | TermScopedList<TermEventItem>
    | TermScopedList<TermTeamItem>
    | TermScopedList<TermParticipant>
    | TermScopedList<TermUserSummary>
    | TermScopedList<TermRankingItem>
    | TermScopedList<TermRepositoryItem>
    | TermScopedList<TermScoreSheetItem>;
}) {
  if (tab === "events") {
    const events = data as TermScopedList<TermEventItem>;
    return (
      <ul className="space-y-xs font-body-sm">
        {events.items.map((event) => (
          <li key={event.id} className="flex justify-between gap-sm border-b border-outline-variant py-xs">
            <span>{event.name}</span>
            <span className="text-on-surface-variant">{event.status}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "teams") {
    const teams = data as TermScopedList<TermTeamItem>;
    return (
      <ul className="space-y-xs font-body-sm">
        {teams.items.map((team) => (
          <li key={team.id} className="flex justify-between gap-sm border-b border-outline-variant py-xs">
            <span>{team.name}</span>
            <span className="text-on-surface-variant">{team.status}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "participants") {
    const participants = data as TermScopedList<TermParticipant>;
    return (
      <ul className="space-y-xs font-body-sm">
        {participants.items.map((p) => (
          <li key={`${p.email}-${p.teamId}`} className="flex justify-between gap-sm border-b border-outline-variant py-xs">
            <span>{p.fullName}</span>
            <span className="text-on-surface-variant">{p.email}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "mentors" || tab === "judges") {
    const users = data as TermScopedList<TermUserSummary>;
    return (
      <ul className="space-y-xs font-body-sm">
        {users.items.map((u) => (
          <li key={u.id} className="flex justify-between gap-sm border-b border-outline-variant py-xs">
            <span>{u.fullName}</span>
            <span className="text-on-surface-variant">{u.email}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "rankings") {
    const rankings = data as TermScopedList<TermRankingItem>;
    return (
      <ul className="space-y-xs font-body-sm">
        {rankings.items.map((r) => (
          <li key={r.id} className="flex justify-between gap-sm border-b border-outline-variant py-xs">
            <span>
              Hạng {r.rank} — đội #{r.teamId}
            </span>
            <span className="text-on-surface-variant">{r.averageScore}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "repositories") {
    const repos = data as TermScopedList<TermRepositoryItem>;
    return (
      <ul className="space-y-xs font-body-sm">
        {repos.items.map((repo) => (
          <li key={repo.id} className="flex justify-between gap-sm border-b border-outline-variant py-xs">
            <span className="truncate">Đội #{repo.teamId}</span>
            <span className="truncate text-on-surface-variant">
              {repo.repositoryUrl ??
                (repo.provisionStatus
                  ? (PROVISION_STATUS_LABELS[repo.provisionStatus as RepositoryProvisionStatus] ??
                    repo.provisionStatus)
                  : "Chưa có repo")}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  const sheets = data as TermScopedList<TermScoreSheetItem>;
  return (
    <ul className="space-y-xs font-body-sm">
      {sheets.items.map((sheet) => (
        <li key={sheet.id} className="flex justify-between gap-sm border-b border-outline-variant py-xs">
          <span>
            {sheet.teamName ?? `Đội #${sheet.teamId}`} — {sheet.judgeName ?? `GK #${sheet.judgeId}`}
          </span>
          <span className="text-on-surface-variant">{sheet.status ?? "—"}</span>
        </li>
      ))}
    </ul>
  );
}
