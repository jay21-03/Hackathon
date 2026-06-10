package com.seal.hackathon.ranking.service;

import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
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

    @Transactional(readOnly = true)
    public AdvancementPreviewResponse previewAdvancements(Long eventId, Long fromRoundId, Long toRoundId, int topN) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        Round fromRound = loadRoundForEvent(fromRoundId, eventId);
        loadRoundForEvent(toRoundId, eventId);
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
        Round fromRound = loadRoundForEvent(request.getFromRoundId(), eventId);
        Round toRound = loadRoundForEvent(request.getToRoundId(), eventId);
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

        for (AdvancementCandidateDto candidate : candidates) {
            if (advancementRepository.findByToRoundId(toRound.getId()).stream()
                    .anyMatch(a -> a.getTeamId().equals(candidate.getTeamId()))) {
                continue;
            }
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

            if (slotsAssigned < emptySlots.size()) {
                BoardSlot slot = emptySlots.get(slotsAssigned);
                slot.setTeamId(candidate.getTeamId());
                slot.setAssignedAt(now);
                slot.setAssignedBy(currentUserId);
                boardSlotRepository.save(slot);
                slotsAssigned++;
            }
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
        return advancementRepository.findByToRoundId(toRoundId).stream()
                .map(adv -> {
                    Team team = teamRepository.findById(adv.getTeamId()).orElse(null);
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
        List<AdvancementCandidateDto> candidates = new ArrayList<>();
        Set<Long> seenTeams = new LinkedHashSet<>();
        for (Board board : boardRepository.findByRoundId(fromRoundId)) {
            List<RankingResult> rankings = rankingResultRepository.findByBoardIdOrderByRankAsc(board.getId()).stream()
                    .filter(r -> r.getPublishedAt() != null)
                    .limit(topN)
                    .toList();
            for (RankingResult result : rankings) {
                if (!seenTeams.add(result.getTeamId())) {
                    continue;
                }
                candidates.add(toCandidateDto(board, result));
            }
        }
        return candidates;
    }

    private List<AdvancementCandidateDto> collectAllEligibleTeams(Long fromRoundId) {
        List<AdvancementCandidateDto> all = new ArrayList<>();
        Set<Long> seenTeams = new LinkedHashSet<>();
        for (Board board : boardRepository.findByRoundId(fromRoundId)) {
            List<RankingResult> rankings = rankingResultRepository.findByBoardIdOrderByRankAsc(board.getId()).stream()
                    .filter(r -> r.getPublishedAt() != null)
                    .toList();
            for (RankingResult result : rankings) {
                if (!seenTeams.add(result.getTeamId())) {
                    continue;
                }
                all.add(toCandidateDto(board, result));
            }
        }
        all.sort(Comparator
                .comparing(AdvancementCandidateDto::getFromBoardName, Comparator.nullsLast(String::compareToIgnoreCase))
                .thenComparing(AdvancementCandidateDto::getRank, Comparator.nullsLast(Integer::compareTo)));
        return all;
    }

    private AdvancementCandidateDto toCandidateDto(Board board, RankingResult result) {
        Team team = teamRepository.findById(result.getTeamId()).orElse(null);
        return AdvancementCandidateDto.builder()
                .teamId(result.getTeamId())
                .teamName(team != null ? team.getName() : "Team #" + result.getTeamId())
                .fromBoardId(board.getId())
                .fromBoardName(board.getName())
                .rank(result.getRank())
                .averageScore(result.getAverageScore())
                .build();
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
