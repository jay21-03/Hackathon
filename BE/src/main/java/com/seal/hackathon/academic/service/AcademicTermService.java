package com.seal.hackathon.academic.service;

import com.seal.hackathon.academic.dto.AcademicTermResponse;
import com.seal.hackathon.academic.dto.AcademicTermSummary;
import com.seal.hackathon.academic.dto.CreateAcademicTermRequest;
import com.seal.hackathon.academic.dto.TermDashboardResponse;
import com.seal.hackathon.academic.dto.TermParticipantResponse;
import com.seal.hackathon.academic.dto.TermRankingResponse;
import com.seal.hackathon.academic.dto.TermRepositoryResponse;
import com.seal.hackathon.academic.dto.TermScoreSheetResponse;
import com.seal.hackathon.academic.dto.TermScopedListResponse;
import com.seal.hackathon.academic.dto.UpdateAcademicTermRequest;
import com.seal.hackathon.scoring.entity.ScoreSheet;
import com.seal.hackathon.academic.entity.AcademicTerm;
import com.seal.hackathon.academic.repository.AcademicTermQueryRepository;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.authprofile.dto.UserSummaryResponse;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.common.enums.AcademicTermStatus;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.common.util.PaginatedLists;
import com.seal.hackathon.contest.dto.EventListItemResponse;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.registration.dto.TeamDetailDto;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.registration.service.RegistrationService;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.ranking.entity.RankingResult;
import com.seal.hackathon.scoring.repository.ScoreSheetRepository;
import com.seal.hackathon.ranking.repository.RankingResultRepository;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AcademicTermService {

    private final AcademicTermRepository academicTermRepository;
    private final AcademicTermQueryRepository academicTermQueryRepository;
    private final EventRepository eventRepository;
    private final TeamRepository teamRepository;
    private final RoundRepository roundRepository;
    private final BoardRepository boardRepository;
    private final ScoreSheetRepository scoreSheetRepository;
    private final RankingResultRepository rankingResultRepository;
    private final TeamRepositoryEntityRepository teamRepositoryEntityRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RegistrationService registrationService;
    private final OrganizerAuthorizationService organizerAuthorizationService;

    @Transactional(readOnly = true)
    public List<AcademicTermResponse> listTerms(AcademicTermStatus status) {
        organizerAuthorizationService.requireOrganizer();
        List<AcademicTerm> terms = status == null
                ? academicTermRepository.findAllByOrderByYearDescTermTypeAsc()
                : academicTermRepository.findByStatusOrderByYearDescTermTypeAsc(status);
        return terms.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AcademicTermResponse getTerm(Long termId) {
        organizerAuthorizationService.requireOrganizer();
        return toResponse(getTermEntity(termId));
    }

    @Transactional
    public AcademicTermResponse createTerm(CreateAcademicTermRequest request) {
        organizerAuthorizationService.requireOrganizer();
        String normalizedCode = normalizeCode(request.getCode());
        validateCreateRequest(request, normalizedCode);

        OffsetDateTime now = OffsetDateTime.now();
        AcademicTermStatus status = request.getStatus() == null
                ? AcademicTermStatus.ACTIVE
                : request.getStatus();
        assertSingleActiveTerm(null, status);

        AcademicTerm term = AcademicTerm.builder()
                .code(normalizedCode)
                .name(normalizeRequired(request.getName(), "name must not be blank"))
                .year(request.getYear())
                .termType(request.getTermType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(status)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return toResponse(academicTermRepository.save(term));
    }

    @Transactional
    public AcademicTermResponse updateTerm(Long termId, UpdateAcademicTermRequest request) {
        organizerAuthorizationService.requireOrganizer();
        AcademicTerm term = getTermEntity(termId);

        if (request.getName() != null) {
            term.setName(normalizeRequired(request.getName(), "name must not be blank"));
        }
        if (request.getStartDate() != null) {
            term.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            term.setEndDate(request.getEndDate());
        }
        if (request.getStatus() != null) {
            assertSingleActiveTerm(termId, request.getStatus());
            term.setStatus(request.getStatus());
        }

        validateDateRange(term.getStartDate(), term.getEndDate());
        term.setUpdatedAt(OffsetDateTime.now());
        return toResponse(academicTermRepository.save(term));
    }

    @Transactional(readOnly = true)
    public AcademicTerm requireActiveTerm(Long termId) {
        AcademicTerm term = getTermEntity(termId);
        if (term.getStatus() != AcademicTermStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ACADEMIC_TERM_ARCHIVED");
        }
        return term;
    }

    @Transactional(readOnly = true)
    public void assertEventTermChangeAllowed(Long eventId, Long currentTermId, Long newTermId) {
        if (newTermId == null || newTermId.equals(currentTermId)) {
            return;
        }
        if (eventHasOperationalData(eventId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "EVENT_TERM_LOCKED — cannot change academic term after teams, scores, rankings, repositories, or AI reviews exist");
        }
    }

    @Transactional(readOnly = true)
    public TermScopedListResponse<EventListItemResponse> listEventsByTerm(
            Long termId, Integer page, Integer size) {
        organizerAuthorizationService.requireOrganizer();
        AcademicTerm term = getTermEntity(termId);
        List<EventListItemResponse> all = eventRepository.findByAcademicTermId(termId, Sort.by(
                        Sort.Direction.DESC, "startDate")
                .and(Sort.by(Sort.Direction.DESC, "id")))
                .stream()
                .map(this::toEventListItem)
                .toList();
        return buildScopedList(term, all, page, size);
    }

    @Transactional(readOnly = true)
    public TermScopedListResponse<TeamDetailDto> listTeamsByTerm(Long termId, Integer page, Integer size) {
        organizerAuthorizationService.requireOrganizer();
        AcademicTerm term = getTermEntity(termId);
        List<TeamDetailDto> all = academicTermQueryRepository.findTeamsByTermId(termId).stream()
                .map(team -> registrationService.getTeam(team.getId(), null, true))
                .toList();
        return buildScopedList(term, all, page, size);
    }

    @Transactional(readOnly = true)
    public TermScopedListResponse<TermParticipantResponse> listParticipantsByTerm(
            Long termId, Integer page, Integer size) {
        organizerAuthorizationService.requireOrganizer();
        AcademicTerm term = getTermEntity(termId);
        List<TermParticipantResponse> all = academicTermQueryRepository.findParticipantsByTermId(termId).stream()
                .map(this::toParticipantResponse)
                .toList();
        return buildScopedList(term, all, page, size);
    }

    @Transactional(readOnly = true)
    public TermScopedListResponse<UserSummaryResponse> listMentorsByTerm(
            Long termId, Integer page, Integer size) {
        organizerAuthorizationService.requireOrganizer();
        AcademicTerm term = getTermEntity(termId);
        List<UserSummaryResponse> all = academicTermQueryRepository.findMentorIdsByTermId(termId).stream()
                .map(this::toUserSummary)
                .sorted(Comparator.comparing(UserSummaryResponse::getFullName, Comparator.nullsLast(String::compareTo)))
                .toList();
        return buildScopedList(term, all, page, size);
    }

    @Transactional(readOnly = true)
    public TermScopedListResponse<UserSummaryResponse> listJudgesByTerm(
            Long termId, Integer page, Integer size) {
        organizerAuthorizationService.requireOrganizer();
        AcademicTerm term = getTermEntity(termId);
        List<UserSummaryResponse> all = academicTermQueryRepository.findJudgeIdsByTermId(termId).stream()
                .map(this::toUserSummary)
                .sorted(Comparator.comparing(UserSummaryResponse::getFullName, Comparator.nullsLast(String::compareTo)))
                .toList();
        return buildScopedList(term, all, page, size);
    }

    @Transactional(readOnly = true)
    public TermScopedListResponse<UserSummaryResponse> listMentorCandidatesByTerm(
            Long termId, Integer page, Integer size) {
        organizerAuthorizationService.requireOrganizer();
        AcademicTerm term = getTermEntity(termId);
        List<UserSummaryResponse> all = academicTermQueryRepository.findMentorCandidateIdsByTermId(termId).stream()
                .map(this::toUserSummary)
                .sorted(Comparator.comparing(UserSummaryResponse::getFullName, Comparator.nullsLast(String::compareTo)))
                .toList();
        return buildScopedList(term, all, page, size);
    }

    @Transactional(readOnly = true)
    public TermScopedListResponse<UserSummaryResponse> listJudgeCandidatesByTerm(
            Long termId, Integer page, Integer size) {
        organizerAuthorizationService.requireOrganizer();
        AcademicTerm term = getTermEntity(termId);
        List<UserSummaryResponse> all = academicTermQueryRepository.findJudgeCandidateIdsByTermId(termId).stream()
                .map(this::toUserSummary)
                .sorted(Comparator.comparing(UserSummaryResponse::getFullName, Comparator.nullsLast(String::compareTo)))
                .toList();
        return buildScopedList(term, all, page, size);
    }

    @Transactional(readOnly = true)
    public TermScopedListResponse<TermRankingResponse> listRankingsByTerm(
            Long termId, Integer page, Integer size) {
        organizerAuthorizationService.requireOrganizer();
        AcademicTerm term = getTermEntity(termId);
        List<TermRankingResponse> all = academicTermQueryRepository.findRankingsByTermId(termId).stream()
                .map(this::toRankingResponse)
                .toList();
        return buildScopedList(term, all, page, size);
    }

    @Transactional(readOnly = true)
    public TermScopedListResponse<TermRepositoryResponse> listRepositoriesByTerm(
            Long termId, Integer page, Integer size) {
        organizerAuthorizationService.requireOrganizer();
        AcademicTerm term = getTermEntity(termId);
        List<TermRepositoryResponse> all = academicTermQueryRepository.findRepositoriesByTermId(termId).stream()
                .map(this::toRepositoryResponse)
                .toList();
        return buildScopedList(term, all, page, size);
    }

    @Transactional(readOnly = true)
    public TermScopedListResponse<TermScoreSheetResponse> listScoreSheetsByTerm(
            Long termId, Integer page, Integer size) {
        organizerAuthorizationService.requireOrganizer();
        AcademicTerm term = getTermEntity(termId);
        List<TermScoreSheetResponse> all = academicTermQueryRepository.findScoreSheetsByTermId(termId).stream()
                .map(this::toScoreSheetResponse)
                .toList();
        return buildScopedList(term, all, page, size);
    }

    private <T> TermScopedListResponse<T> buildScopedList(
            AcademicTerm term, List<T> all, Integer page, Integer size) {
        int total = all.size();
        List<T> items = PaginatedLists.slice(all, page, size);
        TermScopedListResponse.TermScopedListResponseBuilder<T> builder = TermScopedListResponse.<T>builder()
                .academicTerm(toSummary(term))
                .items(items)
                .totalElements(total);
        if (page != null || size != null) {
            int resolvedPage = page != null ? page : 0;
            int resolvedSize = size != null ? size : 50;
            builder.page(resolvedPage)
                    .size(resolvedSize)
                    .totalPages(PaginatedLists.totalPages(total, resolvedSize));
        }
        return builder.build();
    }

    @Transactional(readOnly = true)
    public TermDashboardResponse getTermDashboard(Long termId) {
        organizerAuthorizationService.requireOrganizer();
        AcademicTerm term = getTermEntity(termId);
        return TermDashboardResponse.builder()
                .academicTerm(toSummary(term))
                .eventCount(academicTermRepository.countEventsByTermId(termId))
                .teamCount(academicTermQueryRepository.countTeamsByTermId(termId))
                .participantCount(academicTermQueryRepository.countParticipantsByTermId(termId))
                .mentorCount(academicTermQueryRepository.findMentorIdsByTermId(termId).size())
                .judgeCount(academicTermQueryRepository.findJudgeIdsByTermId(termId).size())
                .rankingCount(academicTermQueryRepository.findRankingsByTermId(termId).size())
                .repositoryCount(academicTermQueryRepository.findRepositoriesByTermId(termId).size())
                .scoreSheetCount(academicTermQueryRepository.findScoreSheetsByTermId(termId).size())
                .build();
    }

    private boolean eventHasOperationalData(Long eventId) {
        if (!teamRepository.findByEventIdOrderByNameAscIdAsc(eventId).isEmpty()) {
            return true;
        }
        List<Long> boardIds = roundRepository.findByEventId(eventId).stream()
                .flatMap(round -> boardRepository.findByRoundId(round.getId()).stream())
                .map(board -> board.getId())
                .toList();
        for (Long boardId : boardIds) {
            if (!scoreSheetRepository.findByBoardId(boardId).isEmpty()) {
                return true;
            }
            if (rankingResultRepository.existsByBoardId(boardId)) {
                return true;
            }
        }
        List<Long> teamIds = teamRepository.findByEventIdOrderByNameAscIdAsc(eventId).stream().map(Team::getId).toList();
        if (!teamIds.isEmpty() && !teamRepositoryEntityRepository.findByTeamIdIn(teamIds).isEmpty()) {
            return true;
        }
        return false;
    }

    private void assertSingleActiveTerm(Long excludingTermId, AcademicTermStatus targetStatus) {
        if (targetStatus != AcademicTermStatus.ACTIVE) {
            return;
        }
        boolean conflict = excludingTermId == null
                ? academicTermRepository.existsByStatus(AcademicTermStatus.ACTIVE)
                : academicTermRepository.existsByStatusAndIdNot(AcademicTermStatus.ACTIVE, excludingTermId);
        if (conflict) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ACADEMIC_TERM_ACTIVE_EXISTS");
        }
    }

    private void validateCreateRequest(CreateAcademicTermRequest request, String normalizedCode) {
        if (academicTermRepository.existsByCode(normalizedCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ACADEMIC_TERM_CODE_EXISTS");
        }
        if (academicTermRepository.existsByYearAndTermType(request.getYear(), request.getTermType())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ACADEMIC_TERM_YEAR_TYPE_EXISTS");
        }
        validateDateRange(request.getStartDate(), request.getEndDate());
    }

    private void validateDateRange(java.time.LocalDate startDate, java.time.LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startDate and endDate must not be null");
        }
        if (!startDate.isBefore(endDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startDate must be before endDate");
        }
    }

    private AcademicTerm getTermEntity(Long termId) {
        return academicTermRepository.findById(termId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ACADEMIC_TERM_NOT_FOUND"));
    }

    private AcademicTermResponse toResponse(AcademicTerm term) {
        return AcademicTermResponse.builder()
                .id(term.getId())
                .code(term.getCode())
                .name(term.getName())
                .year(term.getYear())
                .termType(term.getTermType())
                .startDate(term.getStartDate())
                .endDate(term.getEndDate())
                .status(term.getStatus())
                .eventCount(academicTermRepository.countEventsByTermId(term.getId()))
                .createdAt(term.getCreatedAt())
                .updatedAt(term.getUpdatedAt())
                .build();
    }

    private AcademicTermSummary toSummary(AcademicTerm term) {
        return AcademicTermSummary.builder()
                .id(term.getId())
                .code(term.getCode())
                .name(term.getName())
                .build();
    }

    private TermParticipantResponse toParticipantResponse(TeamMember member) {
        return TermParticipantResponse.builder()
                .id(member.getId())
                .teamId(member.getTeamId())
                .eventId(member.getEventId())
                .email(member.getEmail())
                .fullName(member.getFullName())
                .status(member.getStatus() != null ? member.getStatus().name() : null)
                .build();
    }

    private TermRankingResponse toRankingResponse(RankingResult result) {
        return TermRankingResponse.builder()
                .id(result.getId())
                .roundId(result.getRoundId())
                .boardId(result.getBoardId())
                .teamId(result.getTeamId())
                .rank(result.getRank())
                .averageScore(result.getAverageScore())
                .publishedAt(result.getPublishedAt())
                .build();
    }

    private TermRepositoryResponse toRepositoryResponse(com.seal.hackathon.aireview.entity.TeamRepository repo) {
        return TermRepositoryResponse.builder()
                .id(repo.getId())
                .teamId(repo.getTeamId())
                .roundId(repo.getRoundId())
                .boardId(repo.getBoardId())
                .problemId(repo.getProblemId())
                .githubRepoName(repo.getGithubRepoName())
                .repositoryUrl(repo.getRepositoryUrl())
                .provisionStatus(repo.getProvisionStatus() != null ? repo.getProvisionStatus().name() : null)
                .createdAt(repo.getCreatedAt())
                .build();
    }

    private TermScoreSheetResponse toScoreSheetResponse(ScoreSheet sheet) {
        return TermScoreSheetResponse.builder()
                .id(sheet.getId())
                .boardId(sheet.getBoardId())
                .teamId(sheet.getTeamId())
                .judgeId(sheet.getJudgeId())
                .status(sheet.getStatus() != null ? sheet.getStatus().name() : null)
                .submittedAt(sheet.getSubmittedAt())
                .createdAt(sheet.getCreatedAt())
                .build();
    }

    private UserSummaryResponse toUserSummary(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));
        Set<String> roles = new HashSet<>();
        for (UserRole userRole : userRoleRepository.findByUserId(userId)) {
            if (userRole.getRole() != null) {
                roles.add(userRole.getRole().name());
            }
        }
        return UserSummaryResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .status(user.getStatus())
                .roles(roles)
                .createdAt(user.getCreatedAt())
                .build();
    }

    private String normalizeCode(String code) {
        String normalized = normalizeRequired(code, "code must not be blank").toUpperCase(Locale.ROOT);
        if (!normalized.matches("^[A-Z0-9_]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "code must use uppercase letters, digits, and underscores");
        }
        return normalized;
    }

    private EventListItemResponse toEventListItem(com.seal.hackathon.contest.entity.Event event) {
        AcademicTerm term = resolveTerm(event.getAcademicTermId());
        return EventListItemResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .registrationStartAt(event.getRegistrationStartAt())
                .registrationEndAt(event.getRegistrationEndAt())
                .minTeamSize(event.getMinTeamSize())
                .maxTeamSize(event.getMaxTeamSize())
                .status(event.getStatus())
                .academicTermId(term != null ? term.getId() : null)
                .academicTermCode(term != null ? term.getCode() : null)
                .academicTermName(term != null ? term.getName() : null)
                .build();
    }

    private AcademicTerm resolveTerm(Long academicTermId) {
        if (academicTermId == null) {
            return null;
        }
        return academicTermRepository.findById(academicTermId).orElse(null);
    }

    private String normalizeRequired(String value, String message) {
        String normalized = StringUtils.hasText(value) ? value.trim() : null;
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return normalized;
    }
}
