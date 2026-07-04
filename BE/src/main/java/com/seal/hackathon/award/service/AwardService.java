package com.seal.hackathon.award.service;

import com.seal.hackathon.award.dto.AwardCategoryResponse;
import com.seal.hackathon.award.dto.CreateAwardCategoryRequest;
import com.seal.hackathon.award.dto.CreateTeamAwardRequest;
import com.seal.hackathon.award.dto.EventAwardsResponse;
import com.seal.hackathon.award.dto.PublishAwardsResponse;
import com.seal.hackathon.award.dto.SuggestAwardsFromRankingRequest;
import com.seal.hackathon.award.dto.SuggestAwardsFromRankingResponse;
import com.seal.hackathon.award.dto.TeamAwardResponse;
import com.seal.hackathon.award.dto.UpdateAwardCategoryRequest;
import com.seal.hackathon.award.entity.AwardCategory;
import com.seal.hackathon.award.entity.TeamAward;
import com.seal.hackathon.award.enums.AwardType;
import com.seal.hackathon.award.repository.AwardCategoryRepository;
import com.seal.hackathon.award.repository.TeamAwardRepository;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.common.util.ContestOrdering;
import com.seal.hackathon.notification.service.NotificationService;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.ranking.entity.RankingResult;
import com.seal.hackathon.ranking.repository.RankingResultRepository;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.repository.TeamRepository;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
public class AwardService {

    private final AwardCategoryRepository awardCategoryRepository;
    private final TeamAwardRepository teamAwardRepository;
    private final EventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final BoardRepository boardRepository;
    private final TeamRepository teamRepository;
    private final RankingResultRepository rankingResultRepository;
    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<AwardCategoryResponse> listCategories(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        return buildCategoryResponses(eventId, awardCategoryRepository.findByEventIdOrderBySortOrderAscIdAsc(eventId), true);
    }

    @Transactional
    public AwardCategoryResponse createCategory(Long eventId, CreateAwardCategoryRequest request) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        assertAwardsEditable(eventId);
        validateRoundBelongsToEvent(request.getRoundId(), eventId);
        String code = normalizeCode(request.getCode());
        if (awardCategoryRepository.existsByEventIdAndCode(eventId, code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "AWARD_CATEGORY_CODE_EXISTS");
        }
        OffsetDateTime now = OffsetDateTime.now();
        AwardCategory category = AwardCategory.builder()
                .eventId(eventId)
                .roundId(request.getRoundId())
                .name(request.getName().trim())
                .code(code)
                .description(request.getDescription())
                .awardType(request.getAwardType())
                .rankOrder(request.getRankOrder())
                .maxWinners(Math.max(request.getMaxWinners(), 1))
                .prizeValue(request.getPrizeValue())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : nextSortOrder(eventId))
                .isActive(request.getIsActive() == null || request.getIsActive())
                .createdAt(now)
                .updatedAt(now)
                .build();
        category = awardCategoryRepository.save(category);
        return buildCategoryResponse(category, List.of(), true);
    }

    @Transactional
    public AwardCategoryResponse updateCategory(Long categoryId, UpdateAwardCategoryRequest request) {
        AwardCategory category = awardCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "AWARD_CATEGORY_NOT_FOUND"));
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(category.getEventId());
        assertAwardsEditable(category.getEventId());
        if (request.getRoundId() != null) {
            validateRoundBelongsToEvent(request.getRoundId(), category.getEventId());
            category.setRoundId(request.getRoundId());
        }
        if (request.getName() != null) {
            category.setName(request.getName().trim());
        }
        if (request.getCode() != null) {
            String code = normalizeCode(request.getCode());
            if (awardCategoryRepository.existsByEventIdAndCodeAndIdNot(category.getEventId(), code, categoryId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "AWARD_CATEGORY_CODE_EXISTS");
            }
            category.setCode(code);
        }
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }
        if (request.getAwardType() != null) {
            category.setAwardType(request.getAwardType());
        }
        if (request.getRankOrder() != null) {
            category.setRankOrder(request.getRankOrder());
        }
        if (request.getMaxWinners() != null) {
            int currentWinners = (int) teamAwardRepository.countByAwardCategoryId(categoryId);
            if (request.getMaxWinners() < currentWinners) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "MAX_WINNERS_BELOW_CURRENT_COUNT");
            }
            category.setMaxWinners(request.getMaxWinners());
        }
        if (request.getPrizeValue() != null) {
            category.setPrizeValue(request.getPrizeValue());
        }
        if (request.getSortOrder() != null) {
            category.setSortOrder(request.getSortOrder());
        }
        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }
        category.setUpdatedAt(OffsetDateTime.now());
        category = awardCategoryRepository.save(category);
        List<TeamAward> winners = sortWinners(teamAwardRepository.findByAwardCategoryIdOrderByAwardedAtAscIdAsc(categoryId));
        return buildCategoryResponse(category, winners, true);
    }

    @Transactional
    public void deleteCategory(Long categoryId) {
        AwardCategory category = awardCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "AWARD_CATEGORY_NOT_FOUND"));
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(category.getEventId());
        assertAwardsEditable(category.getEventId());
        teamAwardRepository.deleteAll(
                teamAwardRepository.findByAwardCategoryIdOrderByAwardedAtAscIdAsc(categoryId));
        awardCategoryRepository.delete(category);
    }

    @Transactional(readOnly = true)
    public EventAwardsResponse listAwardsForOrganizer(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        return buildEventAwardsResponse(eventId, false);
    }

    @Transactional
    public TeamAwardResponse assignAward(Long eventId, CreateTeamAwardRequest request, Long awardedBy) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        assertAwardsEditable(eventId);
        AwardCategory category = awardCategoryRepository.findByIdAndEventId(request.getAwardCategoryId(), eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "AWARD_CATEGORY_NOT_FOUND"));
        if (!Boolean.TRUE.equals(category.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "AWARD_CATEGORY_INACTIVE");
        }
        Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TEAM_NOT_FOUND"));
        if (!eventId.equals(team.getEventId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TEAM_EVENT_MISMATCH");
        }
        assertTeamAwardEligible(team);
        if (teamAwardRepository.existsByAwardCategoryIdAndTeamId(category.getId(), team.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "TEAM_ALREADY_AWARDED_IN_CATEGORY");
        }
        long currentCount = teamAwardRepository.countByAwardCategoryId(category.getId());
        if (currentCount >= category.getMaxWinners()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "MAX_WINNERS_EXCEEDED");
        }
        Long roundId = request.getRoundId() != null ? request.getRoundId() : category.getRoundId();
        if (roundId != null) {
            validateRoundBelongsToEvent(roundId, eventId);
            assertTeamRankedInRound(team.getId(), roundId);
        }
        OffsetDateTime now = OffsetDateTime.now();
        TeamAward award = TeamAward.builder()
                .eventId(eventId)
                .roundId(roundId)
                .awardCategoryId(category.getId())
                .teamId(team.getId())
                .awardedBy(awardedBy)
                .awardedAt(now)
                .note(request.getNote())
                .published(false)
                .createdAt(now)
                .updatedAt(now)
                .build();
        award = teamAwardRepository.save(award);
        return toTeamAwardResponse(award, category, team);
    }

    @Transactional
    public void removeAward(Long awardId) {
        TeamAward award = teamAwardRepository.findById(awardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TEAM_AWARD_NOT_FOUND"));
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(award.getEventId());
        assertAwardsEditable(award.getEventId());
        teamAwardRepository.delete(award);
    }

    @Transactional
    public PublishAwardsResponse publishAwards(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        List<TeamAward> awards = teamAwardRepository.findByEventIdOrderByAwardCategoryIdAscIdAsc(eventId);
        if (awards.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "NO_AWARDS_TO_PUBLISH");
        }
        Map<Long, Team> teamsById = loadTeams(awards);
        for (TeamAward award : awards) {
            Team team = teamsById.get(award.getTeamId());
            assertTeamAwardEligible(team);
            if (award.getRoundId() != null) {
                assertTeamRankedInRound(award.getTeamId(), award.getRoundId());
            }
        }
        OffsetDateTime now = OffsetDateTime.now();
        for (TeamAward award : awards) {
            award.setPublished(true);
            award.setUpdatedAt(now);
        }
        teamAwardRepository.saveAll(awards);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        notificationService.notifyAwardsPublished(event, awards);
        return PublishAwardsResponse.builder()
                .awardsPublished(awards.size())
                .published(true)
                .build();
    }

    @Transactional
    public PublishAwardsResponse unpublishAwards(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        List<TeamAward> awards = teamAwardRepository.findByEventIdOrderByAwardCategoryIdAscIdAsc(eventId);
        OffsetDateTime now = OffsetDateTime.now();
        for (TeamAward award : awards) {
            award.setPublished(false);
            award.setUpdatedAt(now);
        }
        teamAwardRepository.saveAll(awards);
        return PublishAwardsResponse.builder()
                .awardsPublished(awards.size())
                .published(false)
                .build();
    }

    @Transactional(readOnly = true)
    public EventAwardsResponse getPublicAwards(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        List<TeamAward> publishedAwards =
                filterEligibleAwards(teamAwardRepository.findByEventIdAndPublishedTrueOrderByAwardCategoryIdAscIdAsc(eventId));
        if (publishedAwards.isEmpty()) {
            return EventAwardsResponse.builder()
                    .eventId(eventId)
                    .eventName(event.getName())
                    .published(false)
                    .categories(List.of())
                    .build();
        }
        Set<Long> categoryIds = publishedAwards.stream()
                .map(TeamAward::getAwardCategoryId)
                .collect(Collectors.toSet());
        List<AwardCategory> categories = awardCategoryRepository.findAllById(categoryIds).stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsActive()))
                .sorted(Comparator.comparing(AwardCategory::getSortOrder).thenComparing(AwardCategory::getId))
                .toList();
        Map<Long, Team> teamsById = loadTeams(publishedAwards);
        List<AwardCategoryResponse> categoryResponses = categories.stream()
                .map(category -> {
                    List<TeamAward> winners = publishedAwards.stream()
                            .filter(a -> category.getId().equals(a.getAwardCategoryId()))
                            .toList();
                    return buildCategoryResponse(category, winners, teamsById, false);
                })
                .filter(c -> !c.getWinners().isEmpty())
                .toList();
        OffsetDateTime publishedAt = publishedAwards.stream()
                .map(TeamAward::getUpdatedAt)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(null);
        return EventAwardsResponse.builder()
                .eventId(eventId)
                .eventName(event.getName())
                .published(true)
                .publishedAt(publishedAt)
                .categories(categoryResponses)
                .build();
    }

    @Transactional
    public SuggestAwardsFromRankingResponse suggestFromRanking(
            Long eventId, SuggestAwardsFromRankingRequest request, Long awardedBy) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        assertAwardsEditable(eventId);
        List<RankingResult> rankedTeams = collectPublishedRankings(eventId, request);
        if (rankedTeams.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "NO_PUBLISHED_RANKINGS");
        }
        List<AwardCategory> rankCategories = awardCategoryRepository
                .findByEventIdAndIsActiveTrueOrderBySortOrderAscIdAsc(eventId).stream()
                .filter(c -> c.getAwardType() == AwardType.RANK && c.getRankOrder() != null)
                .sorted(Comparator.comparing(AwardCategory::getRankOrder))
                .toList();
        if (rankCategories.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "NO_RANK_AWARD_CATEGORIES");
        }
        Map<Long, Team> teamsById = teamRepository.findAllById(
                        rankedTeams.stream().map(RankingResult::getTeamId).collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(Team::getId, Function.identity()));
        List<RankingResult> eligibleRankedTeams = rankedTeams.stream()
                .filter(result -> isAwardEligibleTeam(teamsById.get(result.getTeamId())))
                .toList();
        if (eligibleRankedTeams.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "NO_PUBLISHED_RANKINGS");
        }
        Map<Integer, RankingResult> topByRank = buildGlobalRankMap(eligibleRankedTeams);
        List<TeamAwardResponse> suggestions = new ArrayList<>();
        int created = 0;
        OffsetDateTime now = OffsetDateTime.now();
        for (AwardCategory category : rankCategories) {
            RankingResult match = topByRank.get(category.getRankOrder());
            if (match == null) {
                continue;
            }
            Team team = teamsById.get(match.getTeamId());
            if (teamAwardRepository.existsByAwardCategoryIdAndTeamId(category.getId(), team.getId())) {
                suggestions.add(toTeamAwardResponse(
                        teamAwardRepository.findByAwardCategoryIdOrderByAwardedAtAscIdAsc(category.getId()).stream()
                                .filter(a -> a.getTeamId().equals(team.getId()))
                                .findFirst()
                                .orElseThrow(),
                        category,
                        team));
                continue;
            }
            if (teamAwardRepository.countByAwardCategoryId(category.getId()) >= category.getMaxWinners()) {
                continue;
            }
            TeamAward award = TeamAward.builder()
                    .eventId(eventId)
                    .roundId(category.getRoundId() != null ? category.getRoundId() : match.getRoundId())
                    .awardCategoryId(category.getId())
                    .teamId(team.getId())
                    .awardedBy(awardedBy)
                    .awardedAt(now)
                    .note("Gợi ý từ BXH hạng " + category.getRankOrder())
                    .published(false)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
            award = teamAwardRepository.save(award);
            created++;
            suggestions.add(toTeamAwardResponse(award, category, team));
        }
        return SuggestAwardsFromRankingResponse.builder()
                .suggestions(suggestions)
                .created(created)
                .message(created > 0
                        ? "Đã gán " + created + " giải từ BXH (chưa công bố)."
                        : "Không có giải mới — các hạng mục đã có đủ đội hoặc thiếu dữ liệu BXH.")
                .build();
    }

    private EventAwardsResponse buildEventAwardsResponse(Long eventId, boolean publicOnly) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        List<AwardCategory> categories = awardCategoryRepository.findByEventIdOrderBySortOrderAscIdAsc(eventId);
        List<TeamAward> allAwards = teamAwardRepository.findByEventIdOrderByAwardCategoryIdAscIdAsc(eventId);
        if (publicOnly) {
            allAwards = allAwards.stream().filter(a -> Boolean.TRUE.equals(a.getPublished())).toList();
        }
        Map<Long, List<TeamAward>> awardsByCategory = allAwards.stream()
                .collect(Collectors.groupingBy(TeamAward::getAwardCategoryId));
        Map<Long, Team> teamsById = loadTeams(allAwards);
        List<AwardCategoryResponse> categoryResponses = categories.stream()
                .map(category -> buildCategoryResponse(
                        category,
                        awardsByCategory.getOrDefault(category.getId(), List.of()),
                        teamsById,
                        true))
                .toList();
        boolean anyPublished = allAwards.stream().anyMatch(a -> Boolean.TRUE.equals(a.getPublished()));
        OffsetDateTime publishedAt = allAwards.stream()
                .filter(a -> Boolean.TRUE.equals(a.getPublished()))
                .map(TeamAward::getUpdatedAt)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(null);
        return EventAwardsResponse.builder()
                .eventId(eventId)
                .eventName(event.getName())
                .published(anyPublished)
                .publishedAt(publishedAt)
                .categories(categoryResponses)
                .build();
    }

    private List<AwardCategoryResponse> buildCategoryResponses(
            Long eventId, List<AwardCategory> categories, boolean includeWinners) {
        List<TeamAward> allAwards = teamAwardRepository.findByEventIdOrderByAwardCategoryIdAscIdAsc(eventId);
        Map<Long, List<TeamAward>> awardsByCategory = allAwards.stream()
                .collect(Collectors.groupingBy(TeamAward::getAwardCategoryId));
        Map<Long, Team> teamsById = loadTeams(allAwards);
        return categories.stream()
                .map(category -> buildCategoryResponse(
                        category,
                        awardsByCategory.getOrDefault(category.getId(), List.of()),
                        teamsById,
                        includeWinners))
                .toList();
    }

    private AwardCategoryResponse buildCategoryResponse(
            AwardCategory category, List<TeamAward> winners, boolean includeWinners) {
        Map<Long, Team> teamsById = loadTeams(winners);
        return buildCategoryResponse(category, winners, teamsById, includeWinners);
    }

    private AwardCategoryResponse buildCategoryResponse(
            AwardCategory category,
            List<TeamAward> winners,
            Map<Long, Team> teamsById,
            boolean includeWinners) {
        List<TeamAward> sortedWinners = sortWinners(winners);
        List<TeamAwardResponse> winnerResponses = sortedWinners.stream()
                .map(award -> {
                    Team team = teamsById.get(award.getTeamId());
                    return toTeamAwardResponse(award, category, team);
                })
                .toList();
        return AwardCategoryResponse.builder()
                .id(category.getId())
                .eventId(category.getEventId())
                .roundId(category.getRoundId())
                .name(category.getName())
                .code(category.getCode())
                .description(category.getDescription())
                .awardType(category.getAwardType())
                .rankOrder(category.getRankOrder())
                .maxWinners(category.getMaxWinners())
                .prizeValue(category.getPrizeValue())
                .sortOrder(category.getSortOrder() != null ? category.getSortOrder() : 0)
                .isActive(Boolean.TRUE.equals(category.getIsActive()))
                .winnerCount(sortedWinners.size())
                .winners(winnerResponses)
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    private TeamAwardResponse toTeamAwardResponse(TeamAward award, AwardCategory category, Team team) {
        return TeamAwardResponse.builder()
                .id(award.getId())
                .eventId(award.getEventId())
                .roundId(award.getRoundId())
                .awardCategoryId(category.getId())
                .awardCategoryName(category.getName())
                .awardCategoryCode(category.getCode())
                .teamId(award.getTeamId())
                .teamName(team != null ? team.getName() : null)
                .teamStatus(team != null && team.getStatus() != null ? team.getStatus().name() : null)
                .awardedBy(award.getAwardedBy())
                .awardedAt(award.getAwardedAt())
                .note(award.getNote())
                .published(Boolean.TRUE.equals(award.getPublished()))
                .createdAt(award.getCreatedAt())
                .updatedAt(award.getUpdatedAt())
                .build();
    }

    private Map<Long, Team> loadTeams(List<TeamAward> awards) {
        Set<Long> teamIds = awards.stream().map(TeamAward::getTeamId).collect(Collectors.toSet());
        if (teamIds.isEmpty()) {
            return Map.of();
        }
        return teamRepository.findAllById(teamIds).stream()
                .collect(Collectors.toMap(Team::getId, Function.identity()));
    }

    private List<TeamAward> filterEligibleAwards(List<TeamAward> awards) {
        Map<Long, Team> teamsById = loadTeams(awards);
        return awards.stream()
                .filter(award -> isAwardEligibleTeam(teamsById.get(award.getTeamId())))
                .toList();
    }

    private void assertAwardsEditable(Long eventId) {
        boolean hasPublished = teamAwardRepository.findByEventIdOrderByAwardCategoryIdAscIdAsc(eventId).stream()
                .anyMatch(award -> Boolean.TRUE.equals(award.getPublished()));
        if (hasPublished) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "AWARDS_ALREADY_PUBLISHED_UNPUBLISH_FIRST");
        }
    }

    private boolean isAwardEligibleTeam(Team team) {
        return team != null && team.getStatus() == TeamStatus.CONFIRMED;
    }

    private void assertTeamAwardEligible(Team team) {
        if (!isAwardEligibleTeam(team)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "TEAM_NOT_ELIGIBLE_FOR_AWARD");
        }
    }

    private void assertTeamRankedInRound(Long teamId, Long roundId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TEAM_NOT_FOUND"));
        boolean ranked = rankingResultRepository.findByRoundIdAndPublishedAtIsNotNullOrderByBoardIdAscRankAsc(roundId)
                .stream()
                .anyMatch(result -> teamId.equals(result.getTeamId()) && isPublicVisibleRankingResult(result, team));
        if (!ranked) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "TEAM_NOT_PUBLISHED_IN_ROUND_RANKING");
        }
    }

    private boolean isPublicVisibleRankingResult(RankingResult result, Team team) {
        return result != null && result.getPublishedAt() != null && isAwardEligibleTeam(team);
    }

    private List<RankingResult> collectPublishedRankings(Long eventId, SuggestAwardsFromRankingRequest request) {
        if (request.getBoardId() != null) {
            Board board = boardRepository.findById(request.getBoardId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "BOARD_NOT_FOUND"));
            Round round = roundRepository.findById(board.getRoundId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ROUND_NOT_FOUND"));
            if (!eventId.equals(round.getEventId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "BOARD_EVENT_MISMATCH");
            }
            return rankingResultRepository.findByBoardIdOrderByRankAsc(board.getId()).stream()
                    .filter(r -> r.getPublishedAt() != null)
                    .toList();
        }
        if (request.getRoundId() != null) {
            validateRoundBelongsToEvent(request.getRoundId(), eventId);
            return rankingResultRepository
                    .findByRoundIdAndPublishedAtIsNotNullOrderByBoardIdAscRankAsc(request.getRoundId());
        }
        List<RankingResult> results = new ArrayList<>();
        for (Round round : ContestOrdering.sortRounds(roundRepository.findByEventId(eventId))) {
            results.addAll(rankingResultRepository
                    .findByRoundIdAndPublishedAtIsNotNullOrderByBoardIdAscRankAsc(round.getId()));
        }
        return dedupeBestResultPerTeam(results);
    }

    private List<RankingResult> dedupeBestResultPerTeam(List<RankingResult> results) {
        Map<Long, RankingResult> bestByTeam = new LinkedHashMap<>();
        for (RankingResult result : results) {
            bestByTeam.merge(
                    result.getTeamId(),
                    result,
                    (a, b) -> {
                        int rankCompare = Integer.compare(a.getRank(), b.getRank());
                        if (rankCompare != 0) {
                            return rankCompare < 0 ? a : b;
                        }
                        return a.getAverageScore().compareTo(b.getAverageScore()) >= 0 ? a : b;
                    });
        }
        return bestByTeam.values().stream()
                .sorted(Comparator
                        .comparing(RankingResult::getRank)
                        .thenComparing(RankingResult::getAverageScore, Comparator.reverseOrder()))
                .toList();
    }

    private Map<Integer, RankingResult> buildGlobalRankMap(List<RankingResult> rankedTeams) {
        Map<Integer, RankingResult> topByRank = new LinkedHashMap<>();
        int position = 1;
        for (RankingResult result : rankedTeams) {
            topByRank.putIfAbsent(position, result);
            position++;
        }
        return topByRank;
    }

    private void validateRoundBelongsToEvent(Long roundId, Long eventId) {
        if (roundId == null) {
            return;
        }
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ROUND_NOT_FOUND"));
        if (!eventId.equals(round.getEventId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ROUND_EVENT_MISMATCH");
        }
    }

    private int nextSortOrder(Long eventId) {
        return awardCategoryRepository.findByEventIdOrderBySortOrderAscIdAsc(eventId).stream()
                .map(AwardCategory::getSortOrder)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0) + 1;
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase().replaceAll("\\s+", "_");
    }

    private List<TeamAward> sortWinners(List<TeamAward> winners) {
        return winners.stream()
                .sorted(Comparator
                        .comparing(TeamAward::getAwardedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(TeamAward::getId, Comparator.nullsLast(Long::compareTo)))
                .toList();
    }
}
