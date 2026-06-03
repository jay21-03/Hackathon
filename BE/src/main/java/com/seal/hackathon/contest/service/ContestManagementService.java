package com.seal.hackathon.contest.service;

import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.enums.BoardStatus;
import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.RoundStatus;
import com.seal.hackathon.common.enums.RoundType;
import com.seal.hackathon.contest.dto.BoardResponse;
import com.seal.hackathon.contest.dto.BoardSlotResponse;
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
import com.seal.hackathon.contest.dto.SwapResponse;
import com.seal.hackathon.contest.dto.RandomAssignRequest;
import com.seal.hackathon.contest.dto.RandomAssignResponse;
import com.seal.hackathon.contest.dto.SlotAssignmentDetail;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.BoardSlotAssignmentAuditRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.ProblemRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
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
                .createdBy(principal.getUserId())
                .createdAt(now)
                .updatedAt(now)
                .build();

        return toEventResponse(eventRepository.save(event));
    }

    @Transactional
    public EventResponse updateEvent(Long eventId, UpdateEventRequest request) {
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

        validateEventState(
                event.getName(),
                event.getStartDate(),
                event.getEndDate(),
                event.getRegistrationStartAt(),
                event.getRegistrationEndAt(),
                event.getMaxTeams());
        event.setMinTeamSize(FIXED_MIN_TEAM_SIZE);
        event.setMaxTeamSize(FIXED_MAX_TEAM_SIZE);
        event.setUpdatedAt(OffsetDateTime.now());

        return toEventResponse(eventRepository.save(event));
    }

    @Transactional(readOnly = true)
    public List<EventListItemResponse> listPublicEvents() {
        return eventRepository.findAll(Sort.by(Sort.Direction.DESC, "startDate").and(Sort.by(Sort.Direction.DESC, "id")))
                .stream()
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
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        if (!EnumSet.of(RoundType.GROUP_STAGE, RoundType.FINAL).contains(request.getRoundType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roundType must be GROUP_STAGE or FINAL");
        }
        if (!request.getStartAt().isBefore(request.getEndAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startAt must be before endAt");
        }
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
        round.setUpdatedAt(OffsetDateTime.now());
        return toRoundResponse(roundRepository.save(round));
    }

    @Transactional(readOnly = true)
    public List<BoardResponse> listBoardsByRound(Long roundId) {
        roundRepository.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
        return boardRepository.findByRoundId(roundId).stream()
                .sorted(
                        Comparator.comparing(Board::getBoardOrder, Comparator.nullsLast(Integer::compareTo))
                                .thenComparing(Board::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::toBoardResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public BoardResponse getBoard(Long boardId) {
        return toBoardResponse(getBoardEntity(boardId));
    }

    @Transactional
    public BoardResponse createBoard(Long roundId, CreateBoardRequest request) {
        roundRepository.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));

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
        boardRepository.findById(boardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
        return boardSlotRepository.findByBoardId(boardId).stream()
                .sorted(
                        Comparator.comparing(BoardSlot::getTeamNumber, Comparator.nullsLast(Integer::compareTo))
                                .thenComparing(BoardSlot::getId, Comparator.nullsLast(Long::compareTo)))
                .map(this::toBoardSlotResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public BoardSlotResponse getBoardSlot(Long slotId) {
        return toBoardSlotResponse(getBoardSlotEntity(slotId));
    }

    @Transactional
    public BoardSlotResponse createBoardSlot(Long boardId, CreateBoardSlotRequest request) {
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
        BoardSlot slot = getBoardSlotEntity(slotId);
        if (!slot.getRoundId().equals(roundId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "slot does not belong to round");
        }
        if (slot.getTeamId() != null && Boolean.FALSE.equals(request.getForceReplace())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SLOT_OCCUPIED");
        }

        // validate team exists and is CONFIRMED
        com.seal.hackathon.registration.entity.Team teamEntity =
            teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        if (teamEntity.getStatus() != com.seal.hackathon.common.enums.TeamStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TEAM_NOT_CONFIRMED");
        }

        // check team not already assigned in this round
        boolean alreadyAssigned = boardSlotRepository.findByRoundId(roundId).stream()
                .anyMatch(bs -> request.getTeamId().equals(bs.getTeamId()));
        if (alreadyAssigned && (slot.getTeamId() == null || !slot.getTeamId().equals(request.getTeamId()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "TEAM_ALREADY_ASSIGNED");
        }

        Long previous = slot.getTeamId();
        slot.setTeamId(request.getTeamId());
        slot.setAssignedAt(OffsetDateTime.now());
        slot.setCreatedAt(slot.getCreatedAt());
        boardSlotRepository.save(slot);

        // write audit
        BoardSlotAssignmentAudit audit = BoardSlotAssignmentAudit.builder()
                .roundId(roundId)
                .boardId(slot.getBoardId())
                .slotId(slot.getId())
                .teamIdBefore(previous)
                .teamIdAfter(request.getTeamId())
                .action(previous == null ? "assign" : "replace")
                .performedBy(currentUserProvider.getCurrentUser().getUserId())
                .performedAt(OffsetDateTime.now())
                .build();
        auditRepository.save(audit);

        return AssignResponse.builder()
                .slotId(slot.getId())
                .boardId(slot.getBoardId())
                .teamId(slot.getTeamId())
                .previousTeamId(previous)
                .assignedAt(slot.getAssignedAt())
                .build();
    }

    @Transactional
    public MoveResponse moveTeamBetweenSlots(Long roundId, Long fromSlotId, Long toSlotId) {
        BoardSlot from = getBoardSlotEntity(fromSlotId);
        BoardSlot to = getBoardSlotEntity(toSlotId);

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
        BoardSlot a = getBoardSlotEntity(slotAId);
        BoardSlot b = getBoardSlotEntity(slotBId);

        if (!a.getRoundId().equals(roundId) || !b.getRoundId().equals(roundId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "slots must belong to the same round");
        }

        Long aPrev = a.getTeamId();
        Long bPrev = b.getTeamId();

        OffsetDateTime now = OffsetDateTime.now();
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
        Round round = getRoundEntity(roundId);
        if (round.getStatus() != RoundStatus.DRAFT && round.getStatus() != RoundStatus.UPCOMING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ROUND_NOT_PLANNED");
        }

        // fetch confirmed teams for the event and exclude already assigned in this round
        List<com.seal.hackathon.registration.entity.Team> confirmedTeams = teamRepository.findByEventIdAndStatus(round.getEventId(), com.seal.hackathon.common.enums.TeamStatus.CONFIRMED);
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

        return RandomAssignResponse.builder()
                .assignedCount(details.size())
                .details(details)
                .unassignedTeamIds(unassigned)
                .build();
    }

    @Transactional
    public BoardSlotResponse updateBoardSlot(Long slotId, UpdateBoardSlotRequest request) {
        if (request.containsField("teamId") || request.containsField("team_id")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "teamId is not supported in Phase 2");
        }
        BoardSlot slot = getBoardSlotEntity(slotId);

        if (boardSlotRepository.existsByBoardIdAndTeamNumberAndIdNot(slot.getBoardId(), request.getTeamNumber(), slotId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "teamNumber already exists in this board");
        }

        slot.setTeamNumber(request.getTeamNumber());
        slot.setTeamId(null);
        return toBoardSlotResponse(boardSlotRepository.save(slot));
    }

    @Transactional(readOnly = true)
    public List<ProblemResponse> listProblemsByBoard(Long boardId) {
        boardRepository.findById(boardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
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

        // organizers can view any problem
        if (principal.getRoles() == null || !principal.getRoles().contains("ORGANIZER")) {
            // check release time
            OffsetDateTime now = OffsetDateTime.now();
            if (problem.getReleaseAt() == null || now.isBefore(problem.getReleaseAt())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "PROBLEM_NOT_RELEASED");
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
        boardRepository.findById(boardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));

        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        OffsetDateTime now = OffsetDateTime.now();
        Problem problem = Problem.builder()
                .boardId(boardId)
                .title(normalizeRequired(request.getTitle(), "title must not be blank"))
                .description(normalizeNullable(request.getDescription()))
                .attachmentUrl(normalizeNullable(request.getAttachmentUrl()))
                .externalLink(normalizeNullable(request.getExternalLink()))
                .releaseAt(request.getReleaseAt())
                .createdBy(principal.getUserId())
                .createdAt(now)
                .updatedAt(now)
                .build();

        return toProblemResponse(problemRepository.save(problem));
    }

    @Transactional
    public ProblemResponse updateProblem(Long problemId, UpdateProblemRequest request) {
        if (request.hasForbiddenImmutableFields()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "boardId and createdBy are immutable in Phase 2");
        }
        Problem problem = getProblemEntity(problemId);

        if (request.getTitle() != null) {
            problem.setTitle(normalizeRequired(request.getTitle(), "title must not be blank"));
        }
        if (request.getDescription() != null) {
            problem.setDescription(normalizeNullable(request.getDescription()));
        }
        if (request.getAttachmentUrl() != null) {
            problem.setAttachmentUrl(normalizeNullable(request.getAttachmentUrl()));
        }
        if (request.getExternalLink() != null) {
            problem.setExternalLink(normalizeNullable(request.getExternalLink()));
        }
        if (request.getReleaseAt() != null) {
            problem.setReleaseAt(request.getReleaseAt());
        }

        if (problem.getReleaseAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "releaseAt must not be null");
        }
        if (!StringUtils.hasText(problem.getTitle())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title must not be blank");
        }
        problem.setUpdatedAt(OffsetDateTime.now());
        return toProblemResponse(problemRepository.save(problem));
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
        if (!startAt.isBefore(endAt)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startAt must be before endAt");
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

    private Round getRoundEntity(Long roundId) {
        return roundRepository.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
    }

    private Board getBoardEntity(Long boardId) {
        return boardRepository.findById(boardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
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
                .createdBy(event.getCreatedBy())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }

    private EventListItemResponse toEventListItemResponse(Event event) {
        return EventListItemResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .registrationStartAt(event.getRegistrationStartAt())
                .registrationEndAt(event.getRegistrationEndAt())
                .status(event.getStatus())
                .build();
    }

    private EventDetailResponse toEventDetailResponse(Event event) {
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
                .build();
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
                .createdBy(problem.getCreatedBy())
                .createdAt(problem.getCreatedAt())
                .updatedAt(problem.getUpdatedAt())
                .build();
    }
}
