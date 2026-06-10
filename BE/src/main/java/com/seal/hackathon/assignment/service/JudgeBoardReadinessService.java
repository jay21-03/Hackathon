package com.seal.hackathon.assignment.service;

import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.assignment.dto.AssignmentResponse;
import com.seal.hackathon.assignment.entity.JudgeAssignment;
import com.seal.hackathon.common.enums.JudgeBoardReadiness;
import com.seal.hackathon.common.enums.RepositoryProvisionStatus;
import com.seal.hackathon.common.enums.ScoreSheetStatus;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Problem;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.ProblemRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.github.repository.ProblemRepositoryTemplateRepository;
import com.seal.hackathon.scoring.entity.ScoreCriteria;
import com.seal.hackathon.scoring.entity.ScoreSheet;
import com.seal.hackathon.scoring.repository.ScoreCriteriaRepository;
import com.seal.hackathon.scoring.repository.ScoreSheetRepository;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class JudgeBoardReadinessService {

    private final BoardRepository boardRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final ProblemRepository problemRepository;
    private final RoundRepository roundRepository;
    private final ScoreCriteriaRepository scoreCriteriaRepository;
    private final ScoreSheetRepository scoreSheetRepository;
    private final TeamRepositoryEntityRepository teamRepositoryEntityRepository;
    private final ProblemRepositoryTemplateRepository problemRepositoryTemplateRepository;

    @Value("${app.github.org:}")
    private String githubOrg;

    @Transactional(readOnly = true)
    public AssignmentResponse enrichJudgeAssignment(AssignmentResponse response, Long judgeId) {
        if (response.getBoardId() == null) {
            return response;
        }
        Board board = boardRepository.findById(response.getBoardId()).orElse(null);
        if (board == null) {
            return response;
        }
        ReadinessSnapshot snapshot = computeReadiness(board, judgeId);
        response.setReadiness(snapshot.readiness());
        response.setTeamsCount(snapshot.teamsCount());
        response.setSubmittedSheetsCount(snapshot.submittedCount());
        response.setDraftSheetsCount(snapshot.draftCount());
        response.setProblemReleaseAt(snapshot.problemReleaseAt());
        response.setProblemCloseAt(snapshot.problemCloseAt());
        return response;
    }

    @Transactional(readOnly = true)
    public boolean isBoardReadyToScore(Long boardId) {
        Board board = boardRepository.findById(boardId).orElse(null);
        if (board == null) {
            return false;
        }
        return computeReadiness(board, null).readiness() == JudgeBoardReadiness.READY_TO_SCORE;
    }

    private ReadinessSnapshot computeReadiness(Board board, Long judgeId) {
        OffsetDateTime now = OffsetDateTime.now();
        List<BoardSlot> slots = boardSlotRepository.findByBoardIdOrderByTeamNumberAsc(board.getId()).stream()
                .filter(slot -> slot.getTeamId() != null)
                .toList();
        int teamsCount = slots.size();

        Problem problem = resolvePrimaryProblem(board.getId(), now);
        if (problem == null) {
            return ReadinessSnapshot.of(JudgeBoardReadiness.NO_PROBLEM, teamsCount, 0, 0, null, null);
        }

        OffsetDateTime releaseAt = problem.getReleaseAt();
        OffsetDateTime closeAt = problem.getCloseAt();
        boolean problemReleased = releaseAt == null || !now.isBefore(releaseAt);
        boolean problemClosed = closeAt != null && !now.isBefore(closeAt);

        if (!problemReleased) {
            return ReadinessSnapshot.of(
                    JudgeBoardReadiness.WAITING_PROBLEM_RELEASE, teamsCount, 0, 0, releaseAt, closeAt);
        }

        Round round = board.getRoundId() == null
                ? null
                : roundRepository.findById(board.getRoundId()).orElse(null);
        List<ScoreCriteria> criteria = round == null
                ? List.of()
                : scoreCriteriaRepository.findByRoundIdOrderBySortOrderAsc(round.getId());
        if (criteria.isEmpty()) {
            return ReadinessSnapshot.of(
                    JudgeBoardReadiness.WAITING_RUBRIC, teamsCount, 0, 0, releaseAt, closeAt);
        }

        if (teamsCount == 0) {
            return ReadinessSnapshot.of(
                    JudgeBoardReadiness.WAITING_TEAMS, teamsCount, 0, 0, releaseAt, closeAt);
        }

        if (!problemClosed
                && requiresProvisionedRepositories(problem.getId())
                && !allTeamsHaveProvisionedRepo(problem.getId(), slots)) {
            return ReadinessSnapshot.of(
                    JudgeBoardReadiness.WAITING_REPOSITORIES, teamsCount, 0, 0, releaseAt, closeAt);
        }

        int submittedCount = 0;
        int draftCount = 0;
        if (judgeId != null) {
            List<ScoreSheet> sheets = scoreSheetRepository.findByBoardIdAndJudgeId(board.getId(), judgeId);
            submittedCount = (int) sheets.stream()
                    .filter(sheet -> sheet.getStatus() == ScoreSheetStatus.SUBMITTED)
                    .count();
            draftCount = (int) sheets.stream()
                    .filter(sheet -> sheet.getStatus() == ScoreSheetStatus.DRAFT)
                    .count();
        }
        if (judgeId != null && teamsCount > 0 && submittedCount >= teamsCount) {
            return ReadinessSnapshot.of(
                    JudgeBoardReadiness.COMPLETED, teamsCount, submittedCount, draftCount, releaseAt, closeAt);
        }
        if (judgeId != null && (draftCount > 0 || submittedCount > 0)) {
            JudgeBoardReadiness readiness = problemClosed ? JudgeBoardReadiness.PROBLEM_CLOSED : JudgeBoardReadiness.IN_PROGRESS;
            return ReadinessSnapshot.of(readiness, teamsCount, submittedCount, draftCount, releaseAt, closeAt);
        }
        if (problemClosed) {
            return ReadinessSnapshot.of(
                    JudgeBoardReadiness.PROBLEM_CLOSED, teamsCount, submittedCount, draftCount, releaseAt, closeAt);
        }

        return ReadinessSnapshot.of(
                JudgeBoardReadiness.READY_TO_SCORE, teamsCount, submittedCount, draftCount, releaseAt, closeAt);
    }

    private Problem resolvePrimaryProblem(Long boardId, OffsetDateTime now) {
        List<Problem> problems = problemRepository.findByBoardId(boardId);
        if (problems.isEmpty()) {
            return null;
        }
        List<Problem> sorted = problems.stream()
                .sorted(Comparator.comparing(Problem::getReleaseAt, Comparator.nullsLast(OffsetDateTime::compareTo))
                        .thenComparing(Problem::getId, Comparator.nullsLast(Long::compareTo)))
                .toList();

        for (Problem problem : sorted) {
            if (isProblemOpen(problem, now)) {
                return problem;
            }
        }

        for (Problem problem : sorted) {
            if (problem.getReleaseAt() != null && now.isBefore(problem.getReleaseAt())) {
                return problem;
            }
        }

        return sorted.stream()
                .filter(problem -> problem.getCloseAt() != null && !now.isBefore(problem.getCloseAt()))
                .max(Comparator.comparing(Problem::getCloseAt, Comparator.nullsLast(OffsetDateTime::compareTo))
                        .thenComparing(Problem::getId, Comparator.nullsLast(Long::compareTo)))
                .orElse(sorted.get(sorted.size() - 1));
    }

    private boolean isProblemOpen(Problem problem, OffsetDateTime now) {
        if (problem.getReleaseAt() != null && now.isBefore(problem.getReleaseAt())) {
            return false;
        }
        if (problem.getCloseAt() != null && !now.isBefore(problem.getCloseAt())) {
            return false;
        }
        return true;
    }

    private boolean requiresProvisionedRepositories(Long problemId) {
        if (!org.springframework.util.StringUtils.hasText(githubOrg)) {
            return false;
        }
        return problemRepositoryTemplateRepository.findByProblemId(problemId)
                .map(template -> Boolean.TRUE.equals(template.getEnabled()))
                .orElse(false);
    }

    private boolean allTeamsHaveProvisionedRepo(Long problemId, List<BoardSlot> slots) {
        Set<Long> teamIds = slots.stream()
                .map(BoardSlot::getTeamId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (teamIds.isEmpty()) {
            return false;
        }
        long provisionedTeams = teamRepositoryEntityRepository.findByProblemIdOrderByTeamIdAsc(problemId).stream()
                .filter(repo -> teamIds.contains(repo.getTeamId()))
                .filter(repo -> repo.getProvisionStatus() == RepositoryProvisionStatus.CREATED)
                .map(repo -> repo.getTeamId())
                .distinct()
                .count();
        return provisionedTeams >= teamIds.size();
    }

    public AssignmentResponse enrichJudgeAssignment(JudgeAssignment assignment, AssignmentResponse base) {
        return enrichJudgeAssignment(base, assignment.getJudgeId());
    }

    private record ReadinessSnapshot(
            JudgeBoardReadiness readiness,
            int teamsCount,
            int submittedCount,
            int draftCount,
            OffsetDateTime problemReleaseAt,
            OffsetDateTime problemCloseAt) {

        private static ReadinessSnapshot of(
                JudgeBoardReadiness readiness,
                int teamsCount,
                int submittedCount,
                int draftCount,
                OffsetDateTime problemReleaseAt,
                OffsetDateTime problemCloseAt) {
            return new ReadinessSnapshot(
                    readiness, teamsCount, submittedCount, draftCount, problemReleaseAt, problemCloseAt);
        }
    }
}
