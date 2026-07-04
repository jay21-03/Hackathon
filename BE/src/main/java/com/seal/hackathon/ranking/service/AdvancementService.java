package com.seal.hackathon.ranking.service;

import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.common.util.ContestOrdering;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.contest.service.ContestPhaseGuardService;
import com.seal.hackathon.ranking.dto.AdvancementCandidateDto;
import com.seal.hackathon.ranking.dto.AdvancementPreviewResponse;
import com.seal.hackathon.ranking.dto.AdvancementResponse;
import com.seal.hackathon.ranking.dto.ExecuteAdvancementRequest;
import com.seal.hackathon.ranking.dto.ExecuteAdvancementResponse;
import com.seal.hackathon.ranking.entity.Advancement;
import com.seal.hackathon.ranking.entity.RankingResult;
import com.seal.hackathon.ranking.repository.AdvancementRepository;
import com.seal.hackathon.ranking.repository.RankingResultRepository;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.scoring.service.ScoringRepositoryGuardService;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdvancementService {

    private final RoundRepository roundRepository;
    private final BoardRepository boardRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final RankingResultRepository rankingResultRepository;
    private final AdvancementRepository advancementRepository;
    private final TeamRepository teamRepository;
    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final ContestPhaseGuardService contestPhaseGuardService;
    private final ScoringRepositoryGuardService scoringRepositoryGuardService;

    @Transactional(readOnly = true)
    public AdvancementPreviewResponse previewAdvancements(Long eventId, Long fromRoundId, Long toRoundId, int topN) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        contestPhaseGuardService.assertEventAllowsAdvancement(eventId);
        Round fromRound = loadRoundForEvent(fromRoundId, eventId);
        Round toRound = loadRoundForEvent(toRoundId, eventId);
        assertForwardAdvancement(fromRound, toRound);
        List<AdvancementCandidateDto> eligibleTeams = collectAllEligibleTeams(fromRound.getId());
        List<AdvancementCandidateDto> candidates = collectSuggestedCandidates(fromRound.getId(), topN);
        return AdvancementPreviewResponse.builder()
                .eventId(eventId)
                .fromRoundId(fromRoundId)
                .toRoundId(toRoundId)
                .topNPerBoard(topN)
                .candidates(candidates)
                .eligibleTeams(eligibleTeams)
                .build();
    }

    @Transactional
    public ExecuteAdvancementResponse executeAdvancements(
            Long eventId, ExecuteAdvancementRequest request, Long currentUserId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        contestPhaseGuardService.assertEventAllowsAdvancement(eventId);
        Round fromRound = loadRoundForEvent(request.getFromRoundId(), eventId);
        Round toRound = loadRoundForEvent(request.getToRoundId(), eventId);
        assertForwardAdvancement(fromRound, toRound);
        int topN = Math.max(request.getTopNPerBoard(), 1);

        List<AdvancementCandidateDto> candidates = resolveCandidatesForExecute(
                fromRound.getId(), topN, request.getTeamIds());
        if (candidates.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "NO_PUBLISHED_RANKINGS_TO_ADVANCE");
        }

        Board targetBoard = resolveTargetBoard(toRound.getId(), request.getTargetBoardId());
        List<BoardSlot> emptySlots = boardSlotRepository.findByBoardIdOrderByTeamNumberAsc(targetBoard.getId()).stream()
                .filter(slot -> slot.getTeamId() == null)
                .sorted(Comparator.comparing(BoardSlot::getTeamNumber, Comparator.nullsLast(Integer::compareTo)))
                .toList();

        OffsetDateTime now = OffsetDateTime.now();
        List<AdvancementResponse> saved = new ArrayList<>();
        int slotsAssigned = 0;
        List<Advancement> existingAdvancements =
                advancementRepository.findByToRoundIdOrderByCreatedAtDescIdDesc(toRound.getId());
        List<AdvancementCandidateDto> candidatesToAdvance = candidates.stream()
                .filter(candidate -> existingAdvancements.stream()
                        .noneMatch(a -> a.getTeamId().equals(candidate.getTeamId())))
                .toList();
        Set<Long> targetRoundTeamIds = boardSlotRepository.findByRoundId(toRound.getId()).stream()
                .map(BoardSlot::getTeamId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());
        List<Long> duplicateTargetTeamIds = candidatesToAdvance.stream()
                .map(AdvancementCandidateDto::getTeamId)
                .filter(targetRoundTeamIds::contains)
                .toList();
        if (!duplicateTargetTeamIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "TEAM_ALREADY_IN_TARGET_ROUND:" + duplicateTargetTeamIds);
        }
        if (candidatesToAdvance.size() > emptySlots.size()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "TARGET_ROUND_NOT_ENOUGH_SLOTS");
        }

        for (AdvancementCandidateDto candidate : candidatesToAdvance) {
            Advancement advancement = Advancement.builder()
                    .fromRoundId(fromRound.getId())
                    .fromBoardId(candidate.getFromBoardId())
                    .toRoundId(toRound.getId())
                    .toBoardId(targetBoard.getId())
                    .teamId(candidate.getTeamId())
                    .basisRank(candidate.getRank())
                    .basisScore(candidate.getAverageScore())
                    .createdBy(currentUserId)
                    .createdAt(now)
                    .build();
            advancement = advancementRepository.save(advancement);
            saved.add(toAdvancementResponse(advancement, candidate.getTeamName()));

            BoardSlot slot = emptySlots.get(slotsAssigned);
            slot.setTeamId(candidate.getTeamId());
            slot.setAssignedAt(now);
            slot.setAssignedBy(currentUserId);
            boardSlotRepository.save(slot);
            slotsAssigned++;
        }

        return ExecuteAdvancementResponse.builder()
                .teamsAdvanced(saved.size())
                .slotsAssigned(slotsAssigned)
                .advancements(saved)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdvancementResponse> listAdvancements(Long eventId, Long toRoundId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        loadRoundForEvent(toRoundId, eventId);
        List<Advancement> advancements =
                advancementRepository.findByToRoundIdOrderByCreatedAtDescIdDesc(toRoundId);
        Map<Long, Team> teamsById = loadTeamsById(advancements.stream().map(Advancement::getTeamId).toList());
        return advancements.stream()
                .map(adv -> {
                    Team team = teamsById.get(adv.getTeamId());
                    return toAdvancementResponse(adv, team != null ? team.getName() : "Team #" + adv.getTeamId());
                })
                .toList();
    }

    private List<AdvancementCandidateDto> resolveCandidatesForExecute(
            Long fromRoundId, int topN, List<Long> teamIds) {
        if (teamIds != null && !teamIds.isEmpty()) {
            Map<Long, AdvancementCandidateDto> eligibleByTeamId = collectAllEligibleTeams(fromRoundId).stream()
                    .collect(Collectors.toMap(
                            AdvancementCandidateDto::getTeamId,
                            Function.identity(),
                            (left, right) -> left,
                            LinkedHashMap::new));
            List<AdvancementCandidateDto> selected = new ArrayList<>();
            for (Long teamId : teamIds) {
                AdvancementCandidateDto candidate = eligibleByTeamId.get(teamId);
                if (candidate == null) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "TEAM_NOT_ELIGIBLE:" + teamId);
                }
                selected.add(candidate);
            }
            return selected;
        }
        return collectSuggestedCandidates(fromRoundId, topN);
    }

    private List<AdvancementCandidateDto> collectSuggestedCandidates(Long fromRoundId, int topN) {
        return collectEligibleCandidates(fromRoundId, topN, true);
    }

    private List<AdvancementCandidateDto> collectAllEligibleTeams(Long fromRoundId) {
        return collectEligibleCandidates(fromRoundId, Integer.MAX_VALUE, false);
    }

    private List<AdvancementCandidateDto> collectEligibleCandidates(Long fromRoundId, int topNPerBoard, boolean sortByName) {
        List<Board> boards = ContestOrdering.sortBoards(boardRepository.findByRoundId(fromRoundId));
        Map<Long, List<RankingResult>> rankingsByBoard = new LinkedHashMap<>();
        Set<Long> teamIds = new LinkedHashSet<>();
        for (Board board : boards) {
            List<RankingResult> published = rankingResultRepository.findByBoardIdOrderByRankAsc(board.getId()).stream()
                    .filter(r -> r.getPublishedAt() != null)
                    .toList();
            rankingsByBoard.put(board.getId(), published);
            published.forEach(r -> teamIds.add(r.getTeamId()));
        }
        Map<Long, Team> teamsById = loadTeamsById(teamIds);

        List<AdvancementCandidateDto> candidates = new ArrayList<>();
        Set<Long> seenTeams = new LinkedHashSet<>();
        for (Board board : boards) {
            List<RankingResult> rankings = rankingsByBoard.getOrDefault(board.getId(), List.of()).stream()
                    .filter(r -> isConfirmedTeam(teamsById.get(r.getTeamId())))
                    .filter(r -> scoringRepositoryGuardService.hasScorableRepositoryForBoard(board.getId(), r.getTeamId()))
                    .limit(topNPerBoard)
                    .toList();
            for (RankingResult result : rankings) {
                if (!seenTeams.add(result.getTeamId())) {
                    continue;
                }
                candidates.add(toCandidateDto(board, result, teamsById.get(result.getTeamId())));
            }
        }
        Comparator<AdvancementCandidateDto> comparator = Comparator
                .comparing(AdvancementCandidateDto::getFromBoardName, Comparator.nullsLast(String::compareToIgnoreCase))
                .thenComparing(AdvancementCandidateDto::getRank, Comparator.nullsLast(Integer::compareTo));
        if (sortByName) {
            comparator = comparator.thenComparing(
                    AdvancementCandidateDto::getTeamName, Comparator.nullsLast(String::compareToIgnoreCase));
        }
        candidates.sort(comparator);
        return candidates;
    }

    private AdvancementCandidateDto toCandidateDto(Board board, RankingResult result, Team team) {
        return AdvancementCandidateDto.builder()
                .teamId(result.getTeamId())
                .teamName(team != null ? team.getName() : "Team #" + result.getTeamId())
                .teamStatus(team != null && team.getStatus() != null ? team.getStatus().name() : null)
                .fromBoardId(board.getId())
                .fromBoardName(board.getName())
                .rank(result.getRank())
                .averageScore(result.getAverageScore())
                .build();
    }

    private Map<Long, Team> loadTeamsById(Iterable<Long> teamIds) {
        Set<Long> ids = new LinkedHashSet<>();
        teamIds.forEach(id -> {
            if (id != null) {
                ids.add(id);
            }
        });
        if (ids.isEmpty()) {
            return Map.of();
        }
        return teamRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Team::getId, Function.identity()));
    }

    private boolean isConfirmedTeam(Team team) {
        return team != null && team.getStatus() == TeamStatus.CONFIRMED;
    }

    private Board resolveTargetBoard(Long toRoundId, Long targetBoardId) {
        if (targetBoardId != null) {
            Board board = boardRepository.findById(targetBoardId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "BOARD_NOT_FOUND"));
            if (!toRoundId.equals(board.getRoundId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TARGET_BOARD_NOT_IN_ROUND");
            }
            return board;
        }
        return boardRepository.findByRoundId(toRoundId).stream()
                .min(Comparator.comparing(Board::getBoardOrder, Comparator.nullsLast(Integer::compareTo)))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "NO_TARGET_BOARD"));
    }

    private Round loadRoundForEvent(Long roundId, Long eventId) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ROUND_NOT_FOUND"));
        if (!eventId.equals(round.getEventId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ROUND_NOT_IN_EVENT");
        }
        return round;
    }

    private void assertForwardAdvancement(Round fromRound, Round toRound) {
        if (fromRound.getId().equals(toRound.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADVANCEMENT_SAME_ROUND");
        }
        Integer fromOrder = fromRound.getRoundOrder();
        Integer toOrder = toRound.getRoundOrder();
        if (fromOrder != null && toOrder != null && toOrder <= fromOrder) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADVANCEMENT_TARGET_NOT_AFTER_SOURCE");
        }
    }

    private AdvancementResponse toAdvancementResponse(Advancement advancement, String teamName) {
        return AdvancementResponse.builder()
                .id(advancement.getId())
                .fromRoundId(advancement.getFromRoundId())
                .fromBoardId(advancement.getFromBoardId())
                .toRoundId(advancement.getToRoundId())
                .toBoardId(advancement.getToBoardId())
                .teamId(advancement.getTeamId())
                .teamName(teamName)
                .basisRank(advancement.getBasisRank())
                .basisScore(advancement.getBasisScore())
                .createdAt(advancement.getCreatedAt())
                .build();
    }
}
