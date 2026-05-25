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
import com.seal.hackathon.contest.dto.UpdateEventRequest;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Problem;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.ProblemRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.EnumSet;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ContestManagementService {

    private final EventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final BoardRepository boardRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final ProblemRepository problemRepository;
    private final CurrentUserProvider currentUserProvider;

    @Transactional
    public EventResponse createEvent(CreateEventRequest request) {
        String normalizedName = normalizeRequired(request.getName(), "name must not be blank");
        validateEventState(
                normalizedName,
                request.getStartDate(),
                request.getEndDate(),
                request.getRegistrationStartAt(),
                request.getRegistrationEndAt(),
                request.getMaxTeams(),
                request.getMinTeamSize(),
                request.getMaxTeamSize());

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
                .minTeamSize(request.getMinTeamSize())
                .maxTeamSize(request.getMaxTeamSize())
                .status(EventStatus.DRAFT)
                .createdBy(principal.getUserId())
                .createdAt(now)
                .updatedAt(now)
                .build();

        return toEventResponse(eventRepository.save(event));
    }

    @Transactional
    public EventResponse updateEvent(Long eventId, UpdateEventRequest request) {
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
        if (request.getMinTeamSize() != null) {
            event.setMinTeamSize(request.getMinTeamSize());
        }
        if (request.getMaxTeamSize() != null) {
            event.setMaxTeamSize(request.getMaxTeamSize());
        }

        validateEventState(
                event.getName(),
                event.getStartDate(),
                event.getEndDate(),
                event.getRegistrationStartAt(),
                event.getRegistrationEndAt(),
                event.getMaxTeams(),
                event.getMinTeamSize(),
                event.getMaxTeamSize());
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
    public BoardSlotResponse createBoardSlot(Long boardId, CreateBoardSlotRequest request) {
        if (request.containsField("teamId")) {
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

    private void validateEventState(
            String name,
            LocalDate startDate,
            LocalDate endDate,
            OffsetDateTime registrationStartAt,
            OffsetDateTime registrationEndAt,
            Integer maxTeams,
            Integer minTeamSize,
            Integer maxTeamSize) {
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
        if (minTeamSize == null || minTeamSize < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "minTeamSize must be at least 1");
        }
        if (maxTeamSize == null || maxTeamSize > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "maxTeamSize must be at most 5");
        }
        if (minTeamSize > maxTeamSize) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "minTeamSize must be less than or equal to maxTeamSize");
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
