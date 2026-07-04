package com.seal.hackathon.contest.service;

import com.seal.hackathon.academic.entity.AcademicTerm;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.academic.service.AcademicTermService;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.common.util.PageRequestUtils;
import com.seal.hackathon.common.html.ProblemHtmlSanitizer;
import com.seal.hackathon.common.storage.FileStorageService;
import com.seal.hackathon.common.util.ContestTimelineValidation;
import com.seal.hackathon.common.enums.BoardStatus;
import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.RoundStatus;
import com.seal.hackathon.common.enums.RoundType;
import com.seal.hackathon.contest.dto.BoardResponse;
import com.seal.hackathon.contest.dto.BoardSlotResponse;
import com.seal.hackathon.contest.dto.BoardTeamResponse;
import com.seal.hackathon.contest.dto.CreateBoardRequest;
import com.seal.hackathon.contest.dto.CreateBoardSlotRequest;
import com.seal.hackathon.contest.dto.CreateEventRequest;
import com.seal.hackathon.contest.dto.CreateProblemRequest;
import com.seal.hackathon.contest.dto.CreateRoundRequest;
import com.seal.hackathon.contest.dto.EventDetailResponse;
import com.seal.hackathon.contest.dto.EventListItemResponse;
import com.seal.hackathon.contest.dto.EventResponse;
import com.seal.hackathon.contest.dto.ProblemResponse;
import com.seal.hackathon.contest.dto.RoundResponse;
import com.seal.hackathon.contest.dto.UpdateBoardRequest;
import com.seal.hackathon.contest.dto.UpdateBoardSlotRequest;
import com.seal.hackathon.contest.dto.UpdateEventRequest;
import com.seal.hackathon.contest.dto.UpdateProblemRequest;
import com.seal.hackathon.contest.dto.UpdateRoundRequest;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Problem;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.entity.BoardSlotAssignmentAudit;
import com.seal.hackathon.contest.dto.AssignRequest;
import com.seal.hackathon.contest.dto.AssignResponse;
import com.seal.hackathon.contest.dto.MoveResponse;
import com.seal.hackathon.contest.dto.MyBoardPeerDto;
import com.seal.hackathon.contest.dto.MyBoardResponse;
import com.seal.hackathon.contest.dto.MyProblemResponse;
import com.seal.hackathon.contest.dto.SwapResponse;
import com.seal.hackathon.contest.dto.RandomAssignRequest;
import com.seal.hackathon.contest.dto.RandomAssignResponse;
import com.seal.hackathon.contest.dto.SlotAssignmentDetail;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.BoardSlotAssignmentAuditRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.ProblemRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.registration.service.AuditLogWriter;
import com.seal.hackathon.notification.service.NotificationService;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.ranking.repository.RankingResultRepository;
import com.seal.hackathon.scoring.entity.ScoreSheet;
import com.seal.hackathon.scoring.repository.ScoreItemRepository;
import com.seal.hackathon.scoring.repository.ScoreSheetRepository;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.Comparator;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.EnumSet;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ContestManagementService {

    private final AuditLogWriter auditLogWriter;

    private static final int FIXED_MIN_TEAM_SIZE = 1;
    private static final int FIXED_MAX_TEAM_SIZE = 5;

    private final EventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final BoardRepository boardRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final com.seal.hackathon.registration.repository.TeamMemberRepository teamMemberRepository;
    private final BoardSlotAssignmentAuditRepository auditRepository;
    private final ProblemRepository problemRepository;
    private final TeamRepository teamRepository;
    private final PlatformTransactionManager transactionManager;
    private final CurrentUserProvider currentUserProvider;
    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final NotificationService notificationService;
    private final AcademicTermService academicTermService;
    private final AcademicTermRepository academicTermRepository;
    private final FileStorageService fileStorageService;
    private final ProblemHtmlSanitizer problemHtmlSanitizer;
    private final EventLifecycleService eventLifecycleService;
    private final ScoreSheetRepository scoreSheetRepository;
    private final ScoreItemRepository scoreItemRepository;
    private final RankingResultRepository rankingResultRepository;
    private final TeamRepositoryEntityRepository teamRepositoryEntityRepository;

    @Transactional
    public EventResponse createEvent(CreateEventRequest request) {
        if (request.hasForbiddenTeamSizeFields()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "minTeamSize and maxTeamSize are fixed in Phase 2 and must not be provided");
        }
        String normalizedName = normalizeRequired(request.getName(), "name must not be blank");
        validateEventState(
                normalizedName,
                request.getStartDate(),
                request.getEndDate(),
                request.getRegistrationStartAt(),
                request.getRegistrationEndAt(),
                request.getMaxTeams());
        AcademicTerm academicTerm = academicTermService.requireActiveTerm(request.getAcademicTermId());
        validateEventWithinAcademicTerm(
                request.getStartDate(),
                request.getEndDate(),
                academicTerm.getStartDate(),
                academicTerm.getEndDate());

        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        OffsetDateTime now = OffsetDateTime.now();
        Event event = Event.builder()
                .name(normalizedName)
                .description(normalizeNullable(request.getDescription()))
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .registrationStartAt(request.getRegistrationStartAt())
                .registrationEndAt(request.getRegistrationEndAt())
                .maxTeams(request.getMaxTeams())
                .minTeamSize(FIXED_MIN_TEAM_SIZE)
                .maxTeamSize(FIXED_MAX_TEAM_SIZE)
                .status(EventStatus.DRAFT)
                .academicTermId(academicTerm.getId())
                .createdBy(principal.getUserId())
                .createdAt(now)
                .updatedAt(now)
                .build();

        return toEventResponse(eventRepository.save(event));
    }

    @Transactional
    public EventResponse updateEvent(Long eventId, UpdateEventRequest request) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        if (request.hasForbiddenTeamSizeFields()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "minTeamSize and maxTeamSize are fixed in Phase 2 and must not be provided");
        }
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        if (request.getName() != null) {
            event.setName(normalizeRequired(request.getName(), "name must not be blank"));
        }
        if (request.getDescription() != null) {
            event.setDescription(normalizeNullable(request.getDescription()));
        }
        if (request.getStartDate() != null) {
            event.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            event.setEndDate(request.getEndDate());
        }
        if (request.getRegistrationStartAt() != null) {
            event.setRegistrationStartAt(request.getRegistrationStartAt());
        }
        if (request.getRegistrationEndAt() != null) {
            event.setRegistrationEndAt(request.getRegistrationEndAt());
        }
        if (request.getMaxTeams() != null) {
            event.setMaxTeams(request.getMaxTeams());
        }
        if (request.getAcademicTermId() != null) {
            academicTermService.assertEventTermChangeAllowed(
                    eventId, event.getAcademicTermId(), request.getAcademicTermId());
            AcademicTerm academicTerm = academicTermService.requireActiveTerm(request.getAcademicTermId());
            event.setAcademicTermId(academicTerm.getId());
        }

        validateEventState(
                event.getName(),
                event.getStartDate(),
                event.getEndDate(),
                event.getRegistrationStartAt(),
                event.getRegistrationEndAt(),
                event.getMaxTeams());
        AcademicTerm academicTerm = academicTermService.requireActiveTerm(event.getAcademicTermId());
        validateEventWithinAcademicTerm(
                event.getStartDate(),
                event.getEndDate(),
                academicTerm.getStartDate(),
                academicTerm.getEndDate());
        event.setMinTeamSize(FIXED_MIN_TEAM_SIZE);
        event.setMaxTeamSize(FIXED_MAX_TEAM_SIZE);
        event.setUpdatedAt(OffsetDateTime.now());

        return toEventResponse(eventRepository.save(event));
    }

    @Transactional
    public EventResponse openEventRegistration(Long eventId) {
        return eventLifecycleService.openRegistration(eventId);
    }

    @Transactional(readOnly = true)
    public List<EventListItemResponse> listPublicEvents(Long academicTermId) {
        Sort sort = Sort.by(Sort.Direction.DESC, "startDate").and(Sort.by(Sort.Direction.DESC, "id"));
        List<Event> events = academicTermId == null
                ? eventRepository.findAll(sort)
                : eventRepository.findByAcademicTermId(academicTermId, sort);
        return events.stream()
                .map(this::toEventListItemResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EventDetailResponse getPublicEventDetail(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        return toEventDetailResponse(event);
    }

    @Transactional(readOnly = true)
    public EventResponse getAdminEvent(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        return toEventResponse(event);
    }

    @Transactional(readOnly = true)
    public List<RoundResponse> listAdminRoundsByEvent(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        return listRoundsByEvent(eventId);
    }

    @Transactional(readOnly = true)
    public List<RoundResponse> listRoundsByEvent(Long eventId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        return roundRepository.findByEventId(eventId).stream()
                .sorted(
                        Comparator.comparing(Round::getRoundOrder, Comparator.nullsLast(Integer::compareTo))
                                .thenComparing(Round::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::toRoundResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RoundResponse getRound(Long roundId) {
        return toRoundResponse(getRoundEntity(roundId));
    }

    @Transactional
    public RoundResponse createRound(Long eventId, CreateRoundRequest request) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);

        if (!EnumSet.of(RoundType.GROUP_STAGE, RoundType.FINAL).contains(request.getRoundType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roundType must be GROUP_STAGE or FINAL");
        }
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        validateRoundTimeline(request.getStartAt(), request.getEndAt());
        validateRoundWithinEvent(
                request.getStartAt(), request.getEndAt(), event.getStartDate(), event.getEndDate());
        validateRoundNoOverlap(eventId, null, request.getStartAt(), request.getEndAt());
        if (roundRepository.existsByEventIdAndRoundOrder(eventId, request.getRoundOrder())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "roundOrder already exists in this event");
        }

        OffsetDateTime now = OffsetDateTime.now();
        Round round = Round.builder()
                .eventId(eventId)
                .name(normalizeRequired(request.getName(), "name must not be blank"))
                .roundType(request.getRoundType())
                .roundOrder(request.getRoundOrder())
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .status(RoundStatus.DRAFT)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return toRoundResponse(roundRepository.save(round));
    }

    @Transactional
    public RoundResponse updateRound(Long roundId, UpdateRoundRequest request) {
        organizerAuthorizationService.requireRoundOwnedByCurrentOrganizer(roundId);
        Round round = getRoundEntity(roundId);

        if (request.getName() != null) {
            round.setName(normalizeRequired(request.getName(), "name must not be blank"));
        }
        if (request.getRoundType() != null) {
            validateRoundType(request.getRoundType());
            round.setRoundType(request.getRoundType());
        }
        if (request.getRoundOrder() != null) {
            if (roundRepository.existsByEventIdAndRoundOrderAndIdNot(round.getEventId(), request.getRoundOrder(), roundId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "roundOrder already exists in this event");
            }
            round.setRoundOrder(request.getRoundOrder());
        }
        if (request.getStartAt() != null) {
            round.setStartAt(request.getStartAt());
        }
        if (request.getEndAt() != null) {
            round.setEndAt(request.getEndAt());
        }

        validateRoundTimeline(round.getStartAt(), round.getEndAt());
        Event event = eventRepository.findById(round.getEventId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        validateRoundWithinEvent(
                round.getStartAt(), round.getEndAt(), event.getStartDate(), event.getEndDate());
        validateRoundNoOverlap(round.getEventId(), roundId, round.getStartAt(), round.getEndAt());
        round.setUpdatedAt(OffsetDateTime.now());
        return toRoundResponse(roundRepository.save(round));
    }

    @Transactional(readOnly = true)
    public List<BoardResponse> listBoardsByRound(Long roundId) {
        organizerAuthorizationService.requireRoundOwnedByCurrentOrganizer(roundId);
        return boardRepository.findByRoundId(roundId).stream()
                .sorted(
                        Comparator.comparing(Board::getBoardOrder, Comparator.nullsLast(Integer::compareTo))
                                .thenComparing(Board::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::toBoardResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public com.seal.hackathon.common.response.PagedResult<BoardResponse> listBoardsByRoundPaged(
            Long roundId, int page, int size) {
        organizerAuthorizationService.requireRoundOwnedByCurrentOrganizer(roundId);
        int resolvedSize = PageRequestUtils.resolveSize(size);
        int resolvedPage = PageRequestUtils.resolvePage(page);
        org.springframework.data.domain.PageRequest pageable = org.springframework.data.domain.PageRequest.of(
                resolvedPage,
                resolvedSize,
                org.springframework.data.domain.Sort.by(
                                org.springframework.data.domain.Sort.Order.asc("boardOrder"),
                                org.springframework.data.domain.Sort.Order.asc("id")));
        org.springframework.data.domain.Page<Board> boardPage =
                boardRepository.findByRoundId(roundId, pageable);
        return com.seal.hackathon.common.response.PagedResult.<BoardResponse>builder()
                .items(boardPage.getContent().stream().map(this::toBoardResponse).toList())
                .page(resolvedPage)
                .size(resolvedSize)
                .total(boardPage.getTotalElements())
                .totalPages(boardPage.getTotalPages())
                .build();
    }

    @Transactional(readOnly = true)
    public BoardResponse getBoard(Long boardId) {
        organizerAuthorizationService.requireBoardOwnedByCurrentOrganizer(boardId);
        return toBoardResponse(getBoardEntity(boardId));
    }

    @Transactional
    public BoardResponse createBoard(Long roundId, CreateBoardRequest request) {
        organizerAuthorizationService.requireRoundOwnedByCurrentOrganizer(roundId);

        String normalizedBoardName = normalizeRequired(request.getName(), "name must not be blank");
        if (boardRepository.existsByRoundIdAndBoardOrder(roundId, request.getBoardOrder())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "boardOrder already exists in this round");
        }
        if (boardRepository.existsByRoundIdAndName(roundId, normalizedBoardName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "board name already exists in this round");
        }

        OffsetDateTime now = OffsetDateTime.now();
        Board board = Board.builder()
                .roundId(roundId)
                .name(normalizedBoardName)
                .boardOrder(request.getBoardOrder())
                .description(normalizeNullable(request.getDescription()))
                .status(BoardStatus.DRAFT)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return toBoardResponse(boardRepository.save(board));
    }

    @Transactional
    public BoardResponse updateBoard(Long boardId, UpdateBoardRequest request) {
        organizerAuthorizationService.requireBoardOwnedByCurrentOrganizer(boardId);
        Board board = getBoardEntity(boardId);

        String mergedName = request.getName() == null
                ? board.getName()
                : normalizeRequired(request.getName(), "name must not be blank");
        Integer mergedOrder = request.getBoardOrder() == null
                ? board.getBoardOrder()
                : request.getBoardOrder();

        if (boardRepository.existsByRoundIdAndBoardOrderAndIdNot(board.getRoundId(), mergedOrder, board.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "boardOrder already exists in this round");
        }
        if (boardRepository.existsByRoundIdAndNameAndIdNot(board.getRoundId(), mergedName, board.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "board name already exists in this round");
        }

        board.setName(mergedName);
        board.setBoardOrder(mergedOrder);
        if (request.getDescription() != null) {
            board.setDescription(normalizeNullable(request.getDescription()));
        }
        board.setUpdatedAt(OffsetDateTime.now());
        return toBoardResponse(boardRepository.save(board));
    }

    @Transactional(readOnly = true)
    public List<BoardSlotResponse> listBoardSlotsByBoard(Long boardId) {
        organizerAuthorizationService.requireBoardOwnedByCurrentOrganizer(boardId);
        return boardSlotRepository.findByBoardId(boardId).stream()
                .sorted(
                        Comparator.comparing(BoardSlot::getTeamNumber, Comparator.nullsLast(Integer::compareTo))
                                .thenComparing(BoardSlot::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::toBoardSlotResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public BoardSlotResponse getBoardSlot(Long slotId) {
        organizerAuthorizationService.requireSlotOwnedByCurrentOrganizer(slotId);
        return toBoardSlotResponse(getBoardSlotEntity(slotId));
    }

    @Transactional
    public BoardSlotResponse createBoardSlot(Long boardId, CreateBoardSlotRequest request) {
        organizerAuthorizationService.requireBoardOwnedByCurrentOrganizer(boardId);
        if (request.containsField("teamId") || request.containsField("team_id")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "teamId is not supported in Phase 2");
        }

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
        Round round = roundRepository.findById(board.getRoundId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));

        if (boardSlotRepository.existsByBoardIdAndTeamNumber(boardId, request.getTeamNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "teamNumber already exists in this board");
        }

        OffsetDateTime now = OffsetDateTime.now();
        BoardSlot boardSlot = BoardSlot.builder()
                .boardId(boardId)
                .roundId(round.getId())
                .teamNumber(request.getTeamNumber())
                .teamId(null)
                .createdAt(now)
                .build();

        return toBoardSlotResponse(boardSlotRepository.save(boardSlot));
    }

    @Transactional
    public AssignResponse assignTeamToSlot(Long roundId, Long slotId, AssignRequest request) {
        organizerAuthorizationService.requireRoundOwnedByCurrentOrganizer(roundId);
        BoardSlot slot = getBoardSlotEntity(slotId);
        assertBoardStructureMutable(slot.getBoardId());
        if (!slot.getRoundId().equals(roundId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "slot does not belong to round");
        }
        if (slot.getTeamId() != null && Boolean.FALSE.equals(request.getForceReplace())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SLOT_OCCUPIED");
        }

        Long teamId = request.getTeamId();
        if (teamId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "teamId must not be null");
        }

        Round round = getRoundEntity(roundId);
        eventLifecycleService.assertEventAllowsBoardAssignment(requireEventEntity(round.getEventId()));
        com.seal.hackathon.registration.entity.Team teamEntity =
            teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        if (!round.getEventId().equals(teamEntity.getEventId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TEAM_EVENT_MISMATCH");
        }

        if (teamEntity.getStatus() != com.seal.hackathon.common.enums.TeamStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TEAM_NOT_CONFIRMED");
        }

        // check team not already assigned in this round
        boolean alreadyAssigned = boardSlotRepository.findByRoundId(roundId).stream()
                .anyMatch(bs -> teamId.equals(bs.getTeamId()));
        if (alreadyAssigned && (slot.getTeamId() == null || !slot.getTeamId().equals(teamId))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "TEAM_ALREADY_ASSIGNED");
        }

        Long previous = slot.getTeamId();
        if (previous != null && !previous.equals(teamId)) {
            deleteScoreSheetsForSlotTeam(slot.getBoardId(), previous);
        }
        slot.setTeamId(teamId);
        slot.setAssignedAt(OffsetDateTime.now());
        slot.setCreatedAt(slot.getCreatedAt());
        boardSlotRepository.save(slot);

        // write audit
        BoardSlotAssignmentAudit audit = BoardSlotAssignmentAudit.builder()
                .roundId(roundId)
                .boardId(slot.getBoardId())
                .slotId(slot.getId())
                .teamIdBefore(previous)
                .teamIdAfter(teamId)
                .action(previous == null ? "assign" : "replace")
                .performedBy(currentUserProvider.getCurrentUser().getUserId())
                .performedAt(OffsetDateTime.now())
                .build();
        auditRepository.save(audit);

        CurrentUserPrincipal actor = currentUserProvider.getCurrentUser();
        auditLogWriter.write(
                actor.getUserId(),
                actor.getEmail(),
                previous == null ? "SLOT_ASSIGNED" : "SLOT_REPLACED",
                "BoardSlot",
                slot.getId(),
                previous == null ? null : "{\"teamId\":" + previous + "}",
                "{\"teamId\":" + teamId + ",\"boardId\":" + slot.getBoardId() + "}");

        Event event = eventRepository.findById(round.getEventId()).orElse(null);
        Board board = boardRepository.findById(slot.getBoardId()).orElse(null);
        if (event != null && board != null) {
            notificationService.notifySlotAssigned(event, board, slot, teamEntity);
        }

        return AssignResponse.builder()
                .slotId(slot.getId())
                .boardId(slot.getBoardId())
                .teamId(slot.getTeamId())
                .previousTeamId(previous)
                .assignedAt(slot.getAssignedAt())
                .build();
    }

    @Transactional
    public AssignResponse unassignTeamFromSlot(Long roundId, Long slotId) {
        organizerAuthorizationService.requireRoundOwnedByCurrentOrganizer(roundId);
        Round round = getRoundEntity(roundId);
        eventLifecycleService.assertEventAllowsBoardAssignment(requireEventEntity(round.getEventId()));
        BoardSlot slot = getBoardSlotEntity(slotId);
        if (!slot.getRoundId().equals(roundId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "slot does not belong to round");
        }
        if (slot.getTeamId() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SLOT_EMPTY");
        }

        Long previous = slot.getTeamId();
        Team previousTeam = teamRepository.findById(previous).orElse(null);
        boolean ineligibleTeam = previousTeam == null || previousTeam.getStatus() != TeamStatus.CONFIRMED;
        // Allow clearing DQ/rejected teams even when scoring/ranking has started.
        if (!ineligibleTeam) {
            assertBoardStructureMutable(slot.getBoardId());
        }
        OffsetDateTime now = OffsetDateTime.now();
        deleteScoreSheetsForSlotTeam(slot.getBoardId(), previous);
        slot.setTeamId(null);
        slot.setAssignedAt(now);
        slot.setAssignedBy(currentUserProvider.getCurrentUser().getUserId());
        boardSlotRepository.save(slot);

        BoardSlotAssignmentAudit audit = BoardSlotAssignmentAudit.builder()
                .roundId(roundId)
                .boardId(slot.getBoardId())
                .slotId(slot.getId())
                .teamIdBefore(previous)
                .teamIdAfter(null)
                .action("unassign")
                .performedBy(currentUserProvider.getCurrentUser().getUserId())
                .performedAt(now)
                .build();
        auditRepository.save(audit);

        return AssignResponse.builder()
                .slotId(slot.getId())
                .boardId(slot.getBoardId())
                .teamId(null)
                .previousTeamId(previous)
                .assignedAt(slot.getAssignedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<BoardTeamResponse> listTeamsByBoard(Long boardId) {
        organizerAuthorizationService.requireBoardOwnedByCurrentOrganizer(boardId);
        boardRepository.findById(boardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
        return boardSlotRepository.findByBoardId(boardId).stream()
                .filter(slot -> slot.getTeamId() != null)
                .sorted(Comparator.comparing(BoardSlot::getTeamNumber, Comparator.nullsLast(Integer::compareTo)))
                .map(slot -> {
                    Team team = teamRepository.findById(slot.getTeamId()).orElse(null);
                    return BoardTeamResponse.builder()
                            .slotId(slot.getId())
                            .slotNumber(slot.getTeamNumber())
                            .teamId(slot.getTeamId())
                            .teamName(team != null ? team.getName() : "Đội #" + slot.getTeamId())
                            .teamStatus(team != null && team.getStatus() != null ? team.getStatus().name() : null)
                            .build();
                })
                .toList();
    }

    @Transactional
    public MoveResponse moveTeamBetweenSlots(Long roundId, Long fromSlotId, Long toSlotId) {
        organizerAuthorizationService.requireRoundOwnedByCurrentOrganizer(roundId);
        Round round = getRoundEntity(roundId);
        eventLifecycleService.assertEventAllowsBoardAssignment(requireEventEntity(round.getEventId()));
        if (fromSlotId == null || toSlotId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fromSlotId and toSlotId must not be null");
        }
        if (fromSlotId.equals(toSlotId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fromSlotId and toSlotId must differ");
        }
        BoardSlot from = getBoardSlotEntity(fromSlotId);
        BoardSlot to = getBoardSlotEntity(toSlotId);
        assertBoardStructureMutable(from.getBoardId());
        if (!Objects.equals(from.getBoardId(), to.getBoardId())) {
            assertBoardStructureMutable(to.getBoardId());
        }

        if (!from.getRoundId().equals(roundId) || !to.getRoundId().equals(roundId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "slots must belong to the same round");
        }

        if (from.getTeamId() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "FROM_SLOT_EMPTY");
        }
        if (to.getTeamId() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "TO_SLOT_OCCUPIED");
        }

        Long teamId = from.getTeamId();
        Long fromPrev = from.getTeamId();
        Long toPrev = to.getTeamId();

        OffsetDateTime now = OffsetDateTime.now();
        if (!Objects.equals(from.getBoardId(), to.getBoardId())) {
            deleteScoreSheetsForSlotTeam(from.getBoardId(), fromPrev);
        }
        from.setTeamId(null);
        from.setAssignedAt(now);
        from.setAssignedBy(currentUserProvider.getCurrentUser().getUserId());

        to.setTeamId(teamId);
        to.setAssignedAt(now);
        to.setAssignedBy(currentUserProvider.getCurrentUser().getUserId());

        boardSlotRepository.save(from);
        boardSlotRepository.save(to);

        // audit entries
        BoardSlotAssignmentAudit auditOut = BoardSlotAssignmentAudit.builder()
                .roundId(roundId)
                .boardId(from.getBoardId())
                .slotId(from.getId())
                .teamIdBefore(fromPrev)
                .teamIdAfter(null)
                .action("move_out")
                .performedBy(currentUserProvider.getCurrentUser().getUserId())
                .performedAt(now)
                .build();
        BoardSlotAssignmentAudit auditIn = BoardSlotAssignmentAudit.builder()
                .roundId(roundId)
                .boardId(to.getBoardId())
                .slotId(to.getId())
                .teamIdBefore(toPrev)
                .teamIdAfter(teamId)
                .action("move_in")
                .performedBy(currentUserProvider.getCurrentUser().getUserId())
                .performedAt(now)
                .build();
        auditRepository.save(auditOut);
        auditRepository.save(auditIn);

        return MoveResponse.builder()
                .fromSlotId(from.getId())
                .toSlotId(to.getId())
                .fromPreviousTeamId(fromPrev)
                .toPreviousTeamId(toPrev)
                .performedAt(now)
                .build();
    }

    @Transactional
    public SwapResponse swapSlots(Long roundId, Long slotAId, Long slotBId) {
        organizerAuthorizationService.requireRoundOwnedByCurrentOrganizer(roundId);
        Round round = getRoundEntity(roundId);
        eventLifecycleService.assertEventAllowsBoardAssignment(requireEventEntity(round.getEventId()));
        if (slotAId == null || slotBId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "slotAId and slotBId must not be null");
        }
        if (slotAId.equals(slotBId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "slotAId and slotBId must differ");
        }
        BoardSlot a = getBoardSlotEntity(slotAId);
        BoardSlot b = getBoardSlotEntity(slotBId);
        assertBoardStructureMutable(a.getBoardId());
        if (!Objects.equals(a.getBoardId(), b.getBoardId())) {
            assertBoardStructureMutable(b.getBoardId());
        }

        if (!a.getRoundId().equals(roundId) || !b.getRoundId().equals(roundId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "slots must belong to the same round");
        }

        Long aPrev = a.getTeamId();
        Long bPrev = b.getTeamId();

        OffsetDateTime now = OffsetDateTime.now();
        if (!Objects.equals(a.getBoardId(), b.getBoardId())) {
            deleteScoreSheetsForSlotTeam(a.getBoardId(), aPrev);
            deleteScoreSheetsForSlotTeam(b.getBoardId(), bPrev);
        }
        a.setTeamId(bPrev);
        a.setAssignedAt(now);
        a.setAssignedBy(currentUserProvider.getCurrentUser().getUserId());

        b.setTeamId(aPrev);
        b.setAssignedAt(now);
        b.setAssignedBy(currentUserProvider.getCurrentUser().getUserId());

        boardSlotRepository.save(a);
        boardSlotRepository.save(b);

        BoardSlotAssignmentAudit auditA = BoardSlotAssignmentAudit.builder()
                .roundId(roundId)
                .boardId(a.getBoardId())
                .slotId(a.getId())
                .teamIdBefore(aPrev)
                .teamIdAfter(bPrev)
                .action("swap_a")
                .performedBy(currentUserProvider.getCurrentUser().getUserId())
                .performedAt(now)
                .build();
        BoardSlotAssignmentAudit auditB = BoardSlotAssignmentAudit.builder()
                .roundId(roundId)
                .boardId(b.getBoardId())
                .slotId(b.getId())
                .teamIdBefore(bPrev)
                .teamIdAfter(aPrev)
                .action("swap_b")
                .performedBy(currentUserProvider.getCurrentUser().getUserId())
                .performedAt(now)
                .build();
        auditRepository.save(auditA);
        auditRepository.save(auditB);

        return SwapResponse.builder()
                .slotAId(a.getId())
                .slotBId(b.getId())
                .slotAPreviousTeamId(aPrev)
                .slotBPreviousTeamId(bPrev)
                .performedAt(now)
                .build();
    }

    @Transactional
    public RandomAssignResponse randomAssign(Long roundId, RandomAssignRequest request) {
        organizerAuthorizationService.requireRoundOwnedByCurrentOrganizer(roundId);
        Round round = getRoundEntity(roundId);
        assertRoundAllowsAssignment(round);
        eventLifecycleService.assertEventAllowsBoardAssignment(requireEventEntity(round.getEventId()));

        // fetch confirmed teams for the event and exclude already assigned in this round
        List<com.seal.hackathon.registration.entity.Team> confirmedTeams = teamRepository.findByEventIdAndStatusOrderByNameAscIdAsc(
                round.getEventId(), com.seal.hackathon.common.enums.TeamStatus.CONFIRMED);
        Set<Long> alreadyAssigned = new HashSet<>();
        boardSlotRepository.findByRoundId(roundId).stream().filter(bs -> bs.getTeamId() != null).forEach(bs -> alreadyAssigned.add(bs.getTeamId()));
        List<com.seal.hackathon.registration.entity.Team> eligibleTeams = new ArrayList<>();
        for (com.seal.hackathon.registration.entity.Team t : confirmedTeams) {
            if (!alreadyAssigned.contains(t.getId())) {
                eligibleTeams.add(t);
            }
        }

        // fetch target slots
        List<BoardSlot> allSlots = boardSlotRepository.findByRoundId(roundId);
        List<BoardSlot> targetSlots = new ArrayList<>();
        Set<Long> boardIdFilter = request.getBoardIds() == null ? null : new HashSet<>(request.getBoardIds());
        Set<Long> slotIdFilter = request.getSlotIds() == null ? null : new HashSet<>(request.getSlotIds());
        for (BoardSlot s : allSlots) {
            if (s.getTeamId() != null) continue; // only empty
            if (boardIdFilter != null && !boardIdFilter.contains(s.getBoardId())) continue;
            if (slotIdFilter != null && !slotIdFilter.contains(s.getId())) continue;
            targetSlots.add(s);
        }
        targetSlots.stream()
                .map(BoardSlot::getBoardId)
                .filter(Objects::nonNull)
                .distinct()
                .forEach(this::assertBoardStructureMutable);

        if (eligibleTeams.isEmpty() || targetSlots.isEmpty()) {
            return RandomAssignResponse.builder()
                    .assignedCount(0)
                    .details(Collections.emptyList())
                    .unassignedTeamIds(eligibleTeams.stream().map(com.seal.hackathon.registration.entity.Team::getId).toList())
                    .build();
        }

        // shuffle teams deterministically if seed provided
        Random random = request.getSeed() == null ? new Random() : new Random((long) request.getSeed().hashCode());
        List<com.seal.hackathon.registration.entity.Team> teamsToAssign = new ArrayList<>(eligibleTeams);
        Collections.shuffle(teamsToAssign, random);

        int mappingCount = Math.min(teamsToAssign.size(), targetSlots.size());
        int chunkSize = request.getChunkSize() == null ? 200 : request.getChunkSize();
        int threshold = 500;

        List<SlotAssignmentDetail> details = new ArrayList<>();
        List<Long> unassigned = new ArrayList<>();

        if (mappingCount == 0) {
            for (com.seal.hackathon.registration.entity.Team t : teamsToAssign) unassigned.add(t.getId());
            return RandomAssignResponse.builder().assignedCount(0).details(details).unassignedTeamIds(unassigned).build();
        }

        // perform assignments
        if (mappingCount <= threshold) {
            OffsetDateTime now = OffsetDateTime.now();
            Long performedBy = currentUserProvider.getCurrentUser().getUserId();
            for (int i = 0; i < mappingCount; i++) {
                BoardSlot slot = targetSlots.get(i);
                com.seal.hackathon.registration.entity.Team team = teamsToAssign.get(i);
                slot.setTeamId(team.getId());
                slot.setAssignedAt(now);
                slot.setAssignedBy(performedBy);
            }
            boardSlotRepository.saveAll(targetSlots.subList(0, mappingCount));
            // audit
            OffsetDateTime nowAudit = OffsetDateTime.now();
            for (int i = 0; i < mappingCount; i++) {
                BoardSlot slot = targetSlots.get(i);
                SlotAssignmentDetail d = SlotAssignmentDetail.builder()
                        .slotId(slot.getId())
                        .boardId(slot.getBoardId())
                        .teamId(slot.getTeamId())
                        .build();
                details.add(d);
                BoardSlotAssignmentAudit audit = BoardSlotAssignmentAudit.builder()
                        .roundId(roundId)
                        .boardId(slot.getBoardId())
                        .slotId(slot.getId())
                        .teamIdBefore(null)
                        .teamIdAfter(slot.getTeamId())
                        .action("random_assign")
                        .performedBy(currentUserProvider.getCurrentUser().getUserId())
                        .performedAt(nowAudit)
                        .build();
                auditRepository.save(audit);
            }
            for (int i = mappingCount; i < teamsToAssign.size(); i++) unassigned.add(teamsToAssign.get(i).getId());
        } else {
            // chunked assignment using transaction template
            TransactionTemplate tt = new TransactionTemplate(transactionManager);
            for (int start = 0; start < mappingCount; start += chunkSize) {
                int end = Math.min(start + chunkSize, mappingCount);
                int s = start;
                tt.execute(status -> {
                    OffsetDateTime now = OffsetDateTime.now();
                    Long performedBy = currentUserProvider.getCurrentUser().getUserId();
                    List<BoardSlot> batch = new ArrayList<>();
                    for (int i = s; i < end; i++) {
                        BoardSlot slot = targetSlots.get(i);
                        com.seal.hackathon.registration.entity.Team team = teamsToAssign.get(i);
                        slot.setTeamId(team.getId());
                        slot.setAssignedAt(now);
                        slot.setAssignedBy(performedBy);
                        batch.add(slot);
                    }
                    boardSlotRepository.saveAll(batch);
                    // audit per batch
                    for (BoardSlot slot : batch) {
                        BoardSlotAssignmentAudit audit = BoardSlotAssignmentAudit.builder()
                                .roundId(roundId)
                                .boardId(slot.getBoardId())
                                .slotId(slot.getId())
                                .teamIdBefore(null)
                                .teamIdAfter(slot.getTeamId())
                                .action("random_assign")
                                .performedBy(currentUserProvider.getCurrentUser().getUserId())
                                .performedAt(now)
                                .build();
                        auditRepository.save(audit);
                        details.add(SlotAssignmentDetail.builder().slotId(slot.getId()).boardId(slot.getBoardId()).teamId(slot.getTeamId()).build());
                    }
                    return null;
                });
            }
            for (int i = mappingCount; i < teamsToAssign.size(); i++) unassigned.add(teamsToAssign.get(i).getId());
        }

        if (!details.isEmpty()) {
            Event event = eventRepository.findById(round.getEventId()).orElse(null);
            if (event != null) {
                List<NotificationService.SlotAssignmentEntry> entries = details.stream()
                        .map(d -> new NotificationService.SlotAssignmentEntry(
                                d.getBoardId(), d.getSlotId(), d.getTeamId()))
                        .toList();
                notificationService.notifyRandomSlotAssignments(event, entries);
            }
        }

        return RandomAssignResponse.builder()
                .assignedCount(details.size())
                .details(details)
                .unassignedTeamIds(unassigned)
                .build();
    }

    @Transactional
    public BoardSlotResponse updateBoardSlot(Long slotId, UpdateBoardSlotRequest request) {
        organizerAuthorizationService.requireSlotOwnedByCurrentOrganizer(slotId);
        if (request.containsField("teamId") || request.containsField("team_id")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "teamId is not supported in Phase 2");
        }
        BoardSlot slot = getBoardSlotEntity(slotId);
        assertBoardStructureMutable(slot.getBoardId());

        if (boardSlotRepository.existsByBoardIdAndTeamNumberAndIdNot(slot.getBoardId(), request.getTeamNumber(), slotId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "teamNumber already exists in this board");
        }

        slot.setTeamNumber(request.getTeamNumber());
        deleteScoreSheetsForSlotTeam(slot.getBoardId(), slot.getTeamId());
        slot.setTeamId(null);
        return toBoardSlotResponse(boardSlotRepository.save(slot));
    }

    private void deleteScoreSheetsForSlotTeam(Long boardId, Long teamId) {
        if (boardId == null || teamId == null) {
            return;
        }
        List<ScoreSheet> sheets = scoreSheetRepository.findByBoardIdAndTeamId(boardId, teamId);
        for (ScoreSheet sheet : sheets) {
            scoreItemRepository.deleteByScoreSheetId(sheet.getId());
        }
        if (!sheets.isEmpty()) {
            scoreSheetRepository.deleteByBoardIdAndTeamId(boardId, teamId);
        }
    }

    private void assertBoardStructureMutable(Long boardId) {
        if (boardId == null) {
            return;
        }
        if (rankingResultRepository.existsByBoardId(boardId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "BOARD_RANKING_LOCKED");
        }
        if (!scoreSheetRepository.findByBoardId(boardId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "BOARD_SCORING_LOCKED");
        }
    }

    private void assertProblemMutable(Problem problem) {
        if (problem == null) {
            return;
        }
        if (!teamRepositoryEntityRepository.findByProblemIdOrderByTeamIdAsc(problem.getId()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "PROBLEM_HAS_REPOSITORIES");
        }
        Long boardId = problem.getBoardId();
        if (boardId != null && rankingResultRepository.existsByBoardId(boardId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "PROBLEM_BOARD_HAS_RANKING");
        }
        if (boardId != null && !scoreSheetRepository.findByBoardId(boardId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "PROBLEM_BOARD_HAS_SCORING");
        }
    }

    @Transactional(readOnly = true)
    public List<ProblemResponse> listProblemsByBoard(Long boardId) {
        organizerAuthorizationService.requireBoardOwnedByCurrentOrganizer(boardId);
        return problemRepository.findByBoardId(boardId).stream()
                .sorted(
                        Comparator.comparing(Problem::getReleaseAt, Comparator.nullsLast(OffsetDateTime::compareTo))
                                .thenComparing(Problem::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::toProblemResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProblemResponse getProblem(Long problemId) {
        Problem problem = getProblemEntity(problemId);
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();

        if (principal.getRoles() != null && principal.getRoles().contains("ORGANIZER")) {
            organizerAuthorizationService.requireProblemOwnedByCurrentOrganizer(problemId);
            return toProblemResponse(problem);
        }

        if (principal.getRoles() == null || !principal.getRoles().contains("ORGANIZER")) {
            // check release time
            OffsetDateTime now = OffsetDateTime.now();
            if (problem.getReleaseAt() == null || now.isBefore(problem.getReleaseAt())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "PROBLEM_NOT_RELEASED");
            }
            if (problem.getCloseAt() != null && !now.isBefore(problem.getCloseAt())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "PROBLEM_CLOSED");
            }

            // verify current user belongs to a team assigned to this board
            boolean memberAssigned = boardSlotRepository.findByBoardId(problem.getBoardId()).stream()
                    .map(bs -> bs.getTeamId())
                    .filter(tid -> tid != null)
                    .anyMatch(tid -> teamMemberRepository.existsByTeamIdAndUserId(tid, principal.getUserId()));
            if (!memberAssigned) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "NOT_ASSIGNED_TO_BOARD");
            }
        }

        return toProblemResponse(problem);
    }

    @Transactional
    public ProblemResponse createProblem(Long boardId, CreateProblemRequest request) {
        organizerAuthorizationService.requireBoardOwnedByCurrentOrganizer(boardId);
        Board board = getBoardEntity(boardId);
        Round round = getRoundEntity(board.getRoundId());

        validateProblemWindow(request.getReleaseAt(), request.getCloseAt());
        validateProblemWithinRound(
                request.getReleaseAt(), request.getCloseAt(), round.getStartAt(), round.getEndAt());

        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        OffsetDateTime now = OffsetDateTime.now();
        Problem problem = Problem.builder()
                .boardId(boardId)
                .title(normalizeRequired(request.getTitle(), "title must not be blank"))
                .description(sanitizeProblemDescription(request.getDescription()))
                .attachmentUrl(normalizeNullable(request.getAttachmentUrl()))
                .externalLink(normalizeNullable(request.getExternalLink()))
                .releaseAt(request.getReleaseAt())
                .closeAt(request.getCloseAt())
                .createdBy(principal.getUserId())
                .createdAt(now)
                .updatedAt(now)
                .build();

        Problem saved = problemRepository.save(problem);
        notifyProblemReleasedIfOpen(saved);
        return toProblemResponse(saved);
    }

    @Transactional
    public ProblemResponse updateProblem(Long problemId, UpdateProblemRequest request) {
        organizerAuthorizationService.requireProblemOwnedByCurrentOrganizer(problemId);
        if (request.hasForbiddenImmutableFields()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "boardId and createdBy are immutable in Phase 2");
        }
        Problem problem = getProblemEntity(problemId);
        assertProblemMutable(problem);
        boolean wasReleased = isProblemReleasedNow(problem);

        if (request.getTitle() != null) {
            problem.setTitle(normalizeRequired(request.getTitle(), "title must not be blank"));
        }
        if (request.getDescription() != null) {
            problem.setDescription(sanitizeProblemDescription(request.getDescription()));
        }
        if (request.isAttachmentUrlProvided()) {
            String newAttachmentUrl = normalizeNullable(request.getAttachmentUrl());
            String oldAttachmentUrl = problem.getAttachmentUrl();
            if (oldAttachmentUrl != null && !Objects.equals(oldAttachmentUrl, newAttachmentUrl)) {
                fileStorageService.deleteByPublicUrl(oldAttachmentUrl);
            }
            problem.setAttachmentUrl(newAttachmentUrl);
        }
        if (request.getExternalLink() != null) {
            problem.setExternalLink(normalizeNullable(request.getExternalLink()));
        }
        if (request.getReleaseAt() != null) {
            problem.setReleaseAt(request.getReleaseAt());
        }
        if (request.getCloseAt() != null) {
            problem.setCloseAt(request.getCloseAt());
        }

        if (problem.getReleaseAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "releaseAt must not be null");
        }
        if (problem.getCloseAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "closeAt must not be null");
        }
        validateProblemWindow(problem.getReleaseAt(), problem.getCloseAt());
        Board board = getBoardEntity(problem.getBoardId());
        Round round = getRoundEntity(board.getRoundId());
        validateProblemWithinRound(
                problem.getReleaseAt(), problem.getCloseAt(), round.getStartAt(), round.getEndAt());
        if (!StringUtils.hasText(problem.getTitle())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title must not be blank");
        }
        problem.setUpdatedAt(OffsetDateTime.now());
        Problem saved = problemRepository.save(problem);
        if (!wasReleased && isProblemReleasedNow(saved)) {
            notifyProblemReleasedIfOpen(saved);
        }
        return toProblemResponse(saved);
    }

    @Transactional
    public void deleteProblem(Long problemId) {
        organizerAuthorizationService.requireProblemOwnedByCurrentOrganizer(problemId);
        Problem problem = getProblemEntity(problemId);
        assertProblemMutable(problem);
        String attachmentUrl = problem.getAttachmentUrl();
        problemRepository.delete(problem);
        fileStorageService.deleteByPublicUrl(attachmentUrl);
    }

    @Transactional
    public void deleteBoardSlot(Long slotId) {
        organizerAuthorizationService.requireSlotOwnedByCurrentOrganizer(slotId);
        BoardSlot slot = getBoardSlotEntity(slotId);
        if (slot.getTeamId() != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "SLOT_HAS_TEAM — unassign team before deleting slot");
        }
        boardSlotRepository.delete(slot);
    }

    @Transactional(readOnly = true)
    public MyBoardResponse getMyBoard(Long eventId, Long userId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        List<TeamMember> memberships = teamMemberRepository.findAllByEventIdAndUserId(eventId, userId);
        if (memberships.isEmpty()) {
            return MyBoardResponse.notAssigned("NO_TEAM");
        }

        Long teamId = resolveParticipantTeamId(memberships);
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        if (team.getStatus() == TeamStatus.WAITLIST) {
            return MyBoardResponse.notAssigned("TEAM_WAITLIST");
        }
        if (team.getStatus() == TeamStatus.REJECTED) {
            return MyBoardResponse.notAssigned("TEAM_REJECTED");
        }
        if (team.getStatus() == TeamStatus.DISQUALIFIED) {
            return MyBoardResponse.notAssigned("TEAM_DISQUALIFIED");
        }
        if (team.getStatus() != TeamStatus.CONFIRMED) {
            return MyBoardResponse.notAssigned("TEAM_NOT_CONFIRMED");
        }

        BoardSlot slot = findTeamSlotForEvent(teamId, eventId);
        if (slot == null) {
            return MyBoardResponse.notAssigned(hasTeamSlotForEvent(teamId, eventId) ? "ROUND_NOT_STARTED" : "NOT_ASSIGNED");
        }

        Board board = getBoardEntity(slot.getBoardId());
        Round round = getRoundEntity(slot.getRoundId());

        List<MyBoardPeerDto> peers = boardSlotRepository.findByBoardId(board.getId()).stream()
                .filter(boardSlot -> boardSlot.getTeamId() != null)
                .sorted(Comparator.comparing(BoardSlot::getTeamNumber, Comparator.nullsLast(Integer::compareTo)))
                .map(boardSlot -> {
                    Team peerTeam = teamRepository.findById(boardSlot.getTeamId()).orElse(null);
                    return MyBoardPeerDto.builder()
                            .teamId(boardSlot.getTeamId())
                            .teamName(peerTeam != null ? peerTeam.getName() : "Đội #" + boardSlot.getTeamId())
                            .slotNumber(boardSlot.getTeamNumber())
                            .build();
                })
                .toList();

        return MyBoardResponse.builder()
                .assigned(true)
                .teamId(teamId)
                .roundId(round.getId())
                .roundName(round.getName())
                .boardId(board.getId())
                .boardName(board.getName())
                .slotNumber(slot.getTeamNumber())
                .peers(peers)
                .build();
    }

    @Transactional(readOnly = true)
    public MyProblemResponse getMyProblem(Long eventId, Long userId) {
        MyBoardResponse board = getMyBoard(eventId, userId);
        if (!board.isAssigned()) {
            return MyProblemResponse.builder()
                    .available(false)
                    .reason(board.getReason() != null ? board.getReason() : "NOT_ASSIGNED")
                    .build();
        }

        List<Problem> problems = problemRepository.findByBoardId(board.getBoardId());
        if (problems.isEmpty()) {
            return MyProblemResponse.builder()
                    .available(false)
                    .reason("NO_PROBLEM")
                    .build();
        }

        Problem problem = problems.stream()
                .min(Comparator.comparing(Problem::getReleaseAt, Comparator.nullsLast(OffsetDateTime::compareTo))
                        .thenComparing(Problem::getId, Comparator.nullsLast(Long::compareTo)))
                .orElse(problems.get(0));

        OffsetDateTime now = OffsetDateTime.now();
        if (problem.getReleaseAt() == null || now.isBefore(problem.getReleaseAt())) {
            return MyProblemResponse.builder()
                    .available(false)
                    .reason("NOT_RELEASED")
                    .releaseAt(problem.getReleaseAt())
                    .closeAt(problem.getCloseAt())
                    .build();
        }
        if (problem.getCloseAt() != null && !now.isBefore(problem.getCloseAt())) {
            return MyProblemResponse.builder()
                    .available(false)
                    .reason("PROBLEM_CLOSED")
                    .releaseAt(problem.getReleaseAt())
                    .closeAt(problem.getCloseAt())
                    .build();
        }

        return MyProblemResponse.builder()
                .available(true)
                .releaseAt(problem.getReleaseAt())
                .closeAt(problem.getCloseAt())
                .problem(toProblemResponse(problem))
                .build();
    }

    private boolean isProblemReleasedNow(Problem problem) {
        OffsetDateTime now = OffsetDateTime.now();
        if (problem.getReleaseAt() == null || now.isBefore(problem.getReleaseAt())) {
            return false;
        }
        return problem.getCloseAt() == null || now.isBefore(problem.getCloseAt());
    }

    private void notifyProblemReleasedIfOpen(Problem problem) {
        if (!isProblemReleasedNow(problem)) {
            return;
        }
        Board board = boardRepository.findById(problem.getBoardId()).orElse(null);
        if (board == null) {
            return;
        }
        Round round = roundRepository.findById(board.getRoundId()).orElse(null);
        if (round == null) {
            return;
        }
        Event event = eventRepository.findById(round.getEventId()).orElse(null);
        if (event == null) {
            return;
        }
        notificationService.notifyProblemReleased(event, board, problem);
    }

    private void validateProblemWindow(OffsetDateTime releaseAt, OffsetDateTime closeAt) {
        if (releaseAt == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "releaseAt must not be null");
        }
        if (closeAt == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "closeAt must not be null");
        }
        if (!ContestTimelineValidation.isProblemWindowValid(releaseAt, closeAt)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "closeAt must be after releaseAt");
        }
    }

    private Long resolveParticipantTeamId(List<TeamMember> memberships) {
        for (TeamMember membership : memberships) {
            Team team = teamRepository.findById(membership.getTeamId()).orElse(null);
            if (team != null && team.getStatus() == TeamStatus.CONFIRMED) {
                return team.getId();
            }
        }
        return memberships.get(0).getTeamId();
    }

    private BoardSlot findTeamSlotForEvent(Long teamId, Long eventId) {
        List<BoardSlot> slots = boardSlotRepository.findByTeamId(teamId);
        if (slots.isEmpty()) {
            return null;
        }

        List<BoardSlot> eventSlots = slots.stream()
                .filter(slot -> {
                    Round round = roundRepository.findById(slot.getRoundId()).orElse(null);
                    return round != null && eventId.equals(round.getEventId());
                })
                .toList();
        if (eventSlots.isEmpty()) {
            return null;
        }

        List<Round> eventRounds = roundRepository.findByEventId(eventId);
        Round activeRound = resolveActiveRound(eventRounds, OffsetDateTime.now()).orElse(null);
        if (activeRound == null) {
            return null;
        }

        return eventSlots.stream()
                .filter(slot -> activeRound.getId().equals(slot.getRoundId()))
                .findFirst()
                .orElse(null);
    }

    private boolean hasTeamSlotForEvent(Long teamId, Long eventId) {
        return boardSlotRepository.findByTeamId(teamId).stream()
                .anyMatch(slot -> roundRepository.findById(slot.getRoundId())
                        .map(round -> eventId.equals(round.getEventId()))
                        .orElse(false));
    }

    /** Running round only: startAt <= now < endAt, lowest roundOrder. */
    private Optional<Round> resolveActiveRound(List<Round> rounds, OffsetDateTime now) {
        if (rounds == null || rounds.isEmpty()) {
            return Optional.empty();
        }

        return rounds.stream()
                .sorted(Comparator.comparing(Round::getRoundOrder, Comparator.nullsLast(Integer::compareTo)))
                .filter(round -> round.getStartAt() != null
                        && round.getEndAt() != null
                        && !now.isBefore(round.getStartAt())
                        && now.isBefore(round.getEndAt()))
                .findFirst();
    }

    /** Cho phep gan doi khi vong chua cham diem / chua ket thuc. */
    private void assertRoundAllowsAssignment(Round round) {
        if (round.getStatus() == RoundStatus.SCORING || round.getStatus() == RoundStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ROUND_NOT_PLANNED");
        }
    }

    private void validateEventState(
            String name,
            LocalDate startDate,
            LocalDate endDate,
            OffsetDateTime registrationStartAt,
            OffsetDateTime registrationEndAt,
            Integer maxTeams) {
        if (!StringUtils.hasText(name)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name must not be blank");
        }
        if (startDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startDate must not be null");
        }
        if (endDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "endDate must not be null");
        }
        if (startDate.isAfter(endDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startDate must be before or equal to endDate");
        }
        if (registrationStartAt == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "registrationStartAt must not be null");
        }
        if (registrationEndAt == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "registrationEndAt must not be null");
        }
        if (registrationStartAt.isAfter(registrationEndAt)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "registrationStartAt must be before or equal to registrationEndAt");
        }
        if (!ContestTimelineValidation.isRegistrationEndWithinEvent(registrationEndAt, endDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "registrationEndAt must be on or before event endDate");
        }
        if (!ContestTimelineValidation.isRegistrationStartBeforeEvent(registrationStartAt, startDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "registrationStartAt should be on or before event startDate");
        }
        if (maxTeams == null || maxTeams <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "maxTeams must be greater than 0");
        }
    }

    private void validateRoundType(RoundType roundType) {
        if (!EnumSet.of(RoundType.GROUP_STAGE, RoundType.FINAL).contains(roundType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roundType must be GROUP_STAGE or FINAL");
        }
    }

    private void validateRoundTimeline(OffsetDateTime startAt, OffsetDateTime endAt) {
        if (startAt == null || endAt == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startAt and endAt must not be null");
        }
        if (!ContestTimelineValidation.isRoundTimelineValid(startAt, endAt)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startAt must be before endAt");
        }
    }

    private void validateEventWithinAcademicTerm(
            LocalDate eventStartDate,
            LocalDate eventEndDate,
            LocalDate termStartDate,
            LocalDate termEndDate) {
        if (eventStartDate == null || eventEndDate == null || termStartDate == null || termEndDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event and academic term dates must not be null");
        }
        if (!ContestTimelineValidation.isEventWithinAcademicTerm(
                eventStartDate, eventEndDate, termStartDate, termEndDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "event dates must be within academic term startDate and endDate");
        }
    }

    private void validateRoundNoOverlap(
            Long eventId, Long excludeRoundId, OffsetDateTime startAt, OffsetDateTime endAt) {
        if (startAt == null || endAt == null) {
            return;
        }
        for (Round existing : roundRepository.findByEventId(eventId)) {
            if (excludeRoundId != null && excludeRoundId.equals(existing.getId())) {
                continue;
            }
            if (existing.getStartAt() == null || existing.getEndAt() == null) {
                continue;
            }
            if (ContestTimelineValidation.doRoundTimelinesOverlap(
                    startAt, endAt, existing.getStartAt(), existing.getEndAt())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "round timeline overlaps with round \"" + existing.getName() + "\"");
            }
        }
    }

    private void validateRoundWithinEvent(
            OffsetDateTime roundStartAt,
            OffsetDateTime roundEndAt,
            LocalDate eventStartDate,
            LocalDate eventEndDate) {
        if (roundStartAt == null || roundEndAt == null || eventStartDate == null || eventEndDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Round and event dates must not be null");
        }
        if (!ContestTimelineValidation.isRoundStartWithinEvent(roundStartAt, eventStartDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "round startAt must be on or after event startDate");
        }
        if (!ContestTimelineValidation.isRoundEndWithinEvent(roundEndAt, eventEndDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "round endAt must be on or before event endDate");
        }
    }

    private void validateProblemWithinRound(
            OffsetDateTime releaseAt,
            OffsetDateTime closeAt,
            OffsetDateTime roundStartAt,
            OffsetDateTime roundEndAt) {
        if (releaseAt == null || closeAt == null || roundStartAt == null || roundEndAt == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Problem and round dates must not be null");
        }
        if (!ContestTimelineValidation.isProblemReleaseWithinRound(releaseAt, roundStartAt)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "releaseAt must be on or after round startAt");
        }
        if (!ContestTimelineValidation.isProblemCloseWithinRound(closeAt, roundEndAt)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "closeAt must be on or before round endAt");
        }
    }

    private String normalizeRequired(String value, String message) {
        String normalized = normalizeNullable(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return normalized;
    }

    private String normalizeNullable(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String sanitizeProblemDescription(String value) {
        return problemHtmlSanitizer.sanitize(normalizeNullable(value));
    }

    private Round getRoundEntity(Long roundId) {
        return roundRepository.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
    }

    private Board getBoardEntity(Long boardId) {
        return boardRepository.findById(boardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
    }

    private Event requireEventEntity(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
    }

    private BoardSlot getBoardSlotEntity(Long slotId) {
        return boardSlotRepository.findById(slotId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board slot not found"));
    }

    private Problem getProblemEntity(Long problemId) {
        return problemRepository.findById(problemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));
    }

    private EventResponse toEventResponse(Event event) {
        AcademicTerm term = resolveTerm(event.getAcademicTermId());
        return EventResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .description(event.getDescription())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .registrationStartAt(event.getRegistrationStartAt())
                .registrationEndAt(event.getRegistrationEndAt())
                .maxTeams(event.getMaxTeams())
                .minTeamSize(event.getMinTeamSize())
                .maxTeamSize(event.getMaxTeamSize())
                .status(event.getStatus())
                .academicTermId(term != null ? term.getId() : null)
                .academicTermCode(term != null ? term.getCode() : null)
                .academicTermName(term != null ? term.getName() : null)
                .createdBy(event.getCreatedBy())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }

    private EventListItemResponse toEventListItemResponse(Event event) {
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

    private EventDetailResponse toEventDetailResponse(Event event) {
        AcademicTerm term = resolveTerm(event.getAcademicTermId());
        return EventDetailResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .description(event.getDescription())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .registrationStartAt(event.getRegistrationStartAt())
                .registrationEndAt(event.getRegistrationEndAt())
                .maxTeams(event.getMaxTeams())
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

    private RoundResponse toRoundResponse(Round round) {
        return RoundResponse.builder()
                .id(round.getId())
                .eventId(round.getEventId())
                .name(round.getName())
                .roundType(round.getRoundType())
                .roundOrder(round.getRoundOrder())
                .startAt(round.getStartAt())
                .endAt(round.getEndAt())
                .status(round.getStatus())
                .createdAt(round.getCreatedAt())
                .updatedAt(round.getUpdatedAt())
                .build();
    }

    private BoardResponse toBoardResponse(Board board) {
        return BoardResponse.builder()
                .id(board.getId())
                .roundId(board.getRoundId())
                .name(board.getName())
                .boardOrder(board.getBoardOrder())
                .description(board.getDescription())
                .status(board.getStatus())
                .createdAt(board.getCreatedAt())
                .updatedAt(board.getUpdatedAt())
                .build();
    }

    private BoardSlotResponse toBoardSlotResponse(BoardSlot boardSlot) {
        return BoardSlotResponse.builder()
                .id(boardSlot.getId())
                .roundId(boardSlot.getRoundId())
                .boardId(boardSlot.getBoardId())
                .teamNumber(boardSlot.getTeamNumber())
                .teamId(boardSlot.getTeamId())
                .createdAt(boardSlot.getCreatedAt())
                .build();
    }

    private ProblemResponse toProblemResponse(Problem problem) {
        return ProblemResponse.builder()
                .id(problem.getId())
                .boardId(problem.getBoardId())
                .title(problem.getTitle())
                .description(problem.getDescription())
                .attachmentUrl(problem.getAttachmentUrl())
                .externalLink(problem.getExternalLink())
                .releaseAt(problem.getReleaseAt())
                .closeAt(problem.getCloseAt())
                .createdBy(problem.getCreatedBy())
                .createdAt(problem.getCreatedAt())
                .updatedAt(problem.getUpdatedAt())
                .build();
    }
}
