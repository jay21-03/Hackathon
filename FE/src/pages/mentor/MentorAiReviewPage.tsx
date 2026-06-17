import { useEffect, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useSearchParams } from "react-router-dom";

import { AiReviewHistoryPanel } from "../../components/ai-review/AiReviewHistoryPanel";

import { AiReviewView } from "../../components/ai-review/AiReviewView";

import { EmptyState } from "../../components/ui/EmptyState";

import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";

import { PageHeader } from "../../components/ui/PageHeader";

import {

  fetchLatestTeamAiReview,

  fetchTeamAiReviewHistory,

  type AiReviewResponse

} from "../../services/aiReviewApi";

import {

  fetchMentorAssignments,

  fetchMentorBoardTeams

} from "../../services/assignmentService";

import { formatBoardAssignmentShortLabel } from "../../utils/judgeAssignmentUtils";



export function MentorAiReviewPage() {

  const [searchParams] = useSearchParams();

  const boardIdParam = searchParams.get("boardId");

  const teamIdParam = searchParams.get("teamId");



  const assignmentsQuery = useQuery({

    queryKey: ["assignments", "mentor"],

    queryFn: fetchMentorAssignments

  });

  const assignments = assignmentsQuery.data ?? [];

  const [boardId, setBoardId] = useState<number | "">("");

  const [teamId, setTeamId] = useState<number | "">("");
  const [selectedHistoryReview, setSelectedHistoryReview] = useState<AiReviewResponse | null>(null);



  const boardOptions = useMemo(() => {

    const map = new Map<number, string>();

    for (const item of assignments) {

      map.set(item.boardId, formatBoardAssignmentShortLabel(item));

    }

    return [...map.entries()].map(([id, name]) => ({ id, name }));

  }, [assignments]);



  useEffect(() => {

    const parsedBoardId = boardIdParam ? Number(boardIdParam) : NaN;

    const parsedTeamId = teamIdParam ? Number(teamIdParam) : NaN;

    if (Number.isFinite(parsedBoardId) && boardOptions.some((item) => item.id === parsedBoardId)) {

      setBoardId(parsedBoardId);

    }

    if (Number.isFinite(parsedTeamId)) {

      setTeamId(parsedTeamId);

    }

  }, [boardIdParam, boardOptions, teamIdParam]);



  const teamsQuery = useQuery({

    queryKey: ["mentor", "board-teams", boardId],

    queryFn: () => fetchMentorBoardTeams(Number(boardId)),

    enabled: boardId !== ""

  });



  const reviewQuery = useQuery({

    queryKey: ["mentor", "ai-review", teamId],

    queryFn: () => fetchLatestTeamAiReview(Number(teamId)),

    enabled: teamId !== ""

  });



  const historyQuery = useQuery({

    queryKey: ["mentor", "ai-review-history", teamId],

    queryFn: () => fetchTeamAiReviewHistory(Number(teamId)),

    enabled: teamId !== ""

  });

  useEffect(() => {
    setSelectedHistoryReview(null);
  }, [teamId]);

  const displayedReview = selectedHistoryReview ?? reviewQuery.data ?? null;
  const displayedSelectedId = selectedHistoryReview?.id ?? reviewQuery.data?.id ?? null;



  if (assignmentsQuery.isLoading) return <ModuleSkeleton rows={4} />;



  return (

    <div className="space-y-lg">

      <PageHeader

        eyebrow="Mentor"

        title="Đánh giá AI"

        description="Xem phân tích kỹ thuật repository của đội trên bảng bạn phụ trách."

      />



      {boardOptions.length === 0 ? (

        <EmptyState icon="psychology" title="Chưa có phân công" description="Chờ BTC gán mentor cho bảng." />

      ) : (

        <section className="flex flex-wrap gap-md rounded-xl border border-outline-variant bg-surface-container p-md">

          <label className="flex min-w-[12rem] flex-col gap-1 font-label-sm text-on-surface-variant">

            Vòng · Bảng

            <select

              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"

              value={boardId}

              onChange={(e) => {

                setBoardId(e.target.value ? Number(e.target.value) : "");

                setTeamId("");

              }}

            >

              <option value="">Chọn bảng</option>

              {boardOptions.map((item) => (

                <option key={item.id} value={item.id}>

                  {item.name}

                </option>

              ))}

            </select>

          </label>

          <label className="flex min-w-[12rem] flex-col gap-1 font-label-sm text-on-surface-variant">

            Đội

            <select

              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"

              value={teamId}

              onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : "")}

              disabled={!boardId}

            >

              <option value="">Chọn đội</option>

              {(teamsQuery.data ?? []).map((team) => (

                <option key={team.teamId} value={team.teamId}>

                  {team.teamName}

                </option>

              ))}

            </select>

          </label>

        </section>

      )}



      {teamId ? (

        <div className="space-y-md">

          <AiReviewHistoryPanel

            reviews={historyQuery.data ?? []}

            loading={historyQuery.isLoading}

            selectedId={displayedSelectedId}

            onSelect={(item) => setSelectedHistoryReview(item)}

          />

          <AiReviewView
            review={displayedReview}
            loading={reviewQuery.isLoading && !selectedHistoryReview}
            detailedRubric
          />

        </div>

      ) : null}

    </div>

  );

}
