package com.seal.hackathon.assignment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.assignment.dto.BulkCreateStaffInvitationRequest;
import com.seal.hackathon.assignment.dto.BulkStaffInvitationFailure;
import com.seal.hackathon.assignment.dto.BulkStaffInvitationItem;
import com.seal.hackathon.assignment.dto.BulkStaffInvitationResponse;
import com.seal.hackathon.assignment.dto.CreateStaffInvitationRequest;
import com.seal.hackathon.common.response.PagedResult;
import com.seal.hackathon.common.util.OutboxPayloadBuilder;
import com.seal.hackathon.assignment.dto.StaffInvitationResponse;
import com.seal.hackathon.assignment.entity.StaffInvitation;
import com.seal.hackathon.assignment.repository.StaffInvitationRepository;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.security.InvitationTokenCrypto;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.common.enums.StaffInvitationStatus;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.common.enums.UserStatus;
import com.seal.hackathon.common.exception.BusinessException;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.registration.entity.OutboxMessage;
import com.seal.hackathon.registration.repository.OutboxMessageRepository;
import com.seal.hackathon.mail.dto.EmailTrackingSummary;
import com.seal.hackathon.mail.service.EmailTrackingService;
import com.seal.hackathon.notification.service.NotificationService;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import com.seal.hackathon.common.util.PageRequestUtils;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class StaffInvitationService {

    private final StaffInvitationRepository staffInvitationRepository;
    private final BoardRepository boardRepository;
    private final RoundRepository roundRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final BoardAssignmentService boardAssignmentService;
    private final StaffCarryoverService staffCarryoverService;
    private final CurrentUserProvider currentUserProvider;
    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final OutboxMessageRepository outboxMessageRepository;
    private final NotificationService notificationService;
    private final EmailTrackingService emailTrackingService;
    private final ObjectMapper objectMapper;

    @Value("${app.invitation.token-secret:dev-invite-secret-change-me}")
    private String tokenSecret;

    @Transactional
    public List<StaffInvitationResponse> listPending(
            Long eventId, Long roundId, Long boardId, SystemRole role) {
        return listFiltered(eventId, roundId, boardId, role, StaffInvitationStatus.INVITED, null, 0, 200)
                .getItems();
    }

    @Transactional
    public PagedResult<StaffInvitationResponse> listFiltered(
            Long eventId,
            Long roundId,
            Long boardId,
            SystemRole role,
            StaffInvitationStatus status,
            String email,
            int page,
            int size) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        List<Long> boardIds = resolveBoardIds(eventId, roundId, boardId);
        int resolvedSize = PageRequestUtils.resolveSize(size);
        int resolvedPage = PageRequestUtils.resolvePage(page);
        expireEventScopedStaleInvitations(eventId);
        if (boardIds.isEmpty()) {
            String emailFilter = StringUtils.hasText(email) ? email.trim() : null;
            PageRequest pageable = PageRequest.of(
                    resolvedPage, resolvedSize, Sort.by(Sort.Direction.DESC, "invitedAt"));
            Page<StaffInvitation> invitationPage = emailFilter == null
                    ? staffInvitationRepository.findEventScopedFiltered(eventId, status, role, pageable)
                    : staffInvitationRepository.findEventScopedFilteredByEmail(
                            eventId, status, role, emailFilter, pageable);
            return mapInvitationPage(invitationPage, Map.of(), eventId, resolvedPage, resolvedSize);
        }
        expireStaleInvitations(boardIds);
        String emailFilter = StringUtils.hasText(email) ? email.trim() : null;
        PageRequest pageable = PageRequest.of(
                resolvedPage, resolvedSize, Sort.by(Sort.Direction.DESC, "invitedAt"));
        Page<StaffInvitation> invitationPage = emailFilter == null
                ? staffInvitationRepository.findFilteredWithEventScoped(boardIds, eventId, status, role, pageable)
                : staffInvitationRepository.findFilteredWithEventScopedByEmail(
                        boardIds, eventId, status, role, emailFilter, pageable);
        Map<Long, Board> boardsById = boardRepository.findAllById(boardIds).stream()
                .collect(Collectors.toMap(Board::getId, b -> b));
        return mapInvitationPage(invitationPage, boardsById, eventId, resolvedPage, resolvedSize);
    }

    private PagedResult<StaffInvitationResponse> mapInvitationPage(
            Page<StaffInvitation> invitationPage,
            Map<Long, Board> boardsById,
            Long eventId,
            int resolvedPage,
            int resolvedSize) {
        List<Long> invitationIds = invitationPage.getContent().stream().map(StaffInvitation::getId).toList();
        Map<Long, EmailTrackingSummary> trackingById = emailTrackingService.summariesForStaff(invitationIds);
        List<StaffInvitationResponse> items = invitationPage.getContent().stream()
                .map(inv -> {
                    Board board = inv.getBoardId() != null ? boardsById.get(inv.getBoardId()) : null;
                    Long resolvedEventId = board != null ? resolveEventId(board) : inv.getEventId();
                    if (resolvedEventId == null) {
                        resolvedEventId = eventId;
                    }
                    return toResponse(
                            inv, board, resolvedEventId, trackingById.get(inv.getId()));
                })
                .toList();
        return PagedResult.<StaffInvitationResponse>builder()
                .items(items)
                .page(resolvedPage)
                .size(resolvedSize)
                .total(invitationPage.getTotalElements())
                .totalPages(invitationPage.getTotalPages())
                .build();
    }

    @Transactional
    public BulkStaffInvitationResponse createBulkForEvent(
            Long eventId, BulkCreateStaffInvitationRequest request) {
        CurrentUserPrincipal principal = organizerAuthorizationService.requireOrganizer();
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        validateStaffRole(request.getDefaultRole());

        List<StaffInvitationResponse> succeeded = new ArrayList<>();
        List<BulkStaffInvitationFailure> failed = new ArrayList<>();
        Set<String> seenInBatch = new HashSet<>();

        for (BulkStaffInvitationItem item : request.getItems()) {
            SystemRole role = item.getRole() != null ? item.getRole() : request.getDefaultRole();
            String email;
            try {
                email = normalizeEmail(item.getEmail());
            } catch (ResponseStatusException ex) {
                failed.add(BulkStaffInvitationFailure.builder()
                        .email(item.getEmail())
                        .role(role)
                        .reason(ex.getReason())
                        .build());
                continue;
            }
            String batchKey = email + "|" + role.name();
            if (!seenInBatch.add(batchKey)) {
                failed.add(BulkStaffInvitationFailure.builder()
                        .email(email)
                        .role(role)
                        .reason("DUPLICATE_IN_BATCH")
                        .build());
                continue;
            }
            try {
                validateStaffRole(role);
                succeeded.add(createSingleForEvent(eventId, principal.getUserId(), email, role));
            } catch (ResponseStatusException ex) {
                failed.add(BulkStaffInvitationFailure.builder()
                        .email(email)
                        .role(role)
                        .reason(ex.getReason())
                        .build());
            }
        }

        return BulkStaffInvitationResponse.builder()
                .total(request.getItems().size())
                .succeededCount(succeeded.size())
                .failedCount(failed.size())
                .succeeded(succeeded)
                .failed(failed)
                .build();
    }

    @Transactional
    public PagedResult<StaffInvitationResponse> listPendingPaged(
            Long eventId, Long roundId, Long boardId, SystemRole role, int page, int size) {
        return listFiltered(eventId, roundId, boardId, role, StaffInvitationStatus.INVITED, null, page, size);
    }

    @Transactional
    public StaffInvitationResponse create(Long boardId, CreateStaffInvitationRequest request) {
        CurrentUserPrincipal principal = organizerAuthorizationService.requireOrganizer();
        Board board = requireBoard(boardId);
        Long eventId = resolveEventId(board);
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        return createSingle(board, eventId, principal.getUserId(), request.getEmail(), request.getRole());
    }

    @Transactional
    public BulkStaffInvitationResponse createBulk(Long boardId, BulkCreateStaffInvitationRequest request) {
        CurrentUserPrincipal principal = organizerAuthorizationService.requireOrganizer();
        Board board = requireBoard(boardId);
        Long eventId = resolveEventId(board);
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        validateStaffRole(request.getDefaultRole());

        List<StaffInvitationResponse> succeeded = new ArrayList<>();
        List<BulkStaffInvitationFailure> failed = new ArrayList<>();
        Set<String> seenInBatch = new HashSet<>();

        for (BulkStaffInvitationItem item : request.getItems()) {
            SystemRole role = item.getRole() != null ? item.getRole() : request.getDefaultRole();
            String email;
            try {
                email = normalizeEmail(item.getEmail());
            } catch (ResponseStatusException ex) {
                failed.add(BulkStaffInvitationFailure.builder()
                        .email(item.getEmail())
                        .role(role)
                        .reason(ex.getReason())
                        .build());
                continue;
            }
            String batchKey = email + "|" + role.name();
            if (!seenInBatch.add(batchKey)) {
                failed.add(BulkStaffInvitationFailure.builder()
                        .email(email)
                        .role(role)
                        .reason("DUPLICATE_IN_BATCH")
                        .build());
                continue;
            }
            try {
                validateStaffRole(role);
                succeeded.add(createSingle(board, eventId, principal.getUserId(), email, role));
            } catch (ResponseStatusException ex) {
                failed.add(BulkStaffInvitationFailure.builder()
                        .email(email)
                        .role(role)
                        .reason(ex.getReason())
                        .build());
            }
        }

        return BulkStaffInvitationResponse.builder()
                .total(request.getItems().size())
                .succeededCount(succeeded.size())
                .failedCount(failed.size())
                .succeeded(succeeded)
                .failed(failed)
                .build();
    }

    @Transactional
    public StaffInvitationResponse resend(Long staffInvitationId) {
        organizerAuthorizationService.requireOrganizer();
        StaffInvitation invitation = staffInvitationRepository
                .findByIdAndStatus(staffInvitationId, StaffInvitationStatus.INVITED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff invitation not found"));
        Board board = invitation.getBoardId() != null
                ? boardRepository.findById(invitation.getBoardId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"))
                : null;
        Long eventId = board != null ? resolveEventId(board) : invitation.getEventId();
        if (eventId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Staff invitation has no event scope");
        }
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        String rawToken = refreshInvitationToken(invitation, now);
        invitation.setInvitedAt(now);
        int resendCount = invitation.getResendCount() == null ? 0 : invitation.getResendCount();
        invitation.setResendCount(resendCount + 1);
        invitation.setLastResentAt(now);
        invitation = staffInvitationRepository.save(invitation);
        enqueueEmail(invitation, rawToken, now, board, eventId);
        return toResponse(invitation, board, eventId);
    }

    @Transactional
    public StaffInvitationResponse accept(String token) {
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        StaffInvitationTokenCodec.StaffInvitationTokenParts parts = StaffInvitationTokenCodec.parse(token);
        StaffInvitation invitation = staffInvitationRepository
                .findById(parts.invitationId())
                .orElseThrow(() -> new BusinessException("Invalid invitation token"));
        validateToken(invitation, parts);

        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        if (!invitation.getEmail().equalsIgnoreCase(user.getEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "STAFF_INVITE_EMAIL_MISMATCH");
        }

        activateInvitedStaffUser(user, invitation.getRole());
        ensureUserRole(user.getId(), invitation.getRole());
        if (invitation.getBoardId() != null) {
            boardAssignmentService.completeStaffAssignment(
                    invitation.getBoardId(), user.getId(), invitation.getRole(), invitation.getCreatedBy());
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        invitation.setStatus(StaffInvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(now);
        invitation.setAcceptedUserId(user.getId());
        staffInvitationRepository.save(invitation);

        Board board = invitation.getBoardId() != null
                ? boardRepository.findById(invitation.getBoardId()).orElse(null)
                : null;
        Long eventId = board != null ? resolveEventId(board) : invitation.getEventId();
        if (eventId != null) {
            Event event = eventRepository.findById(eventId).orElse(null);
            if (event != null && board != null) {
                notificationService.notifyStaffInvitationAccepted(event, board, invitation, user);
            }
        }
        return toResponse(invitation, board, eventId);
    }

    @Transactional
    public void decline(String token) {
        StaffInvitationTokenCodec.StaffInvitationTokenParts parts = StaffInvitationTokenCodec.parse(token);
        StaffInvitation invitation = staffInvitationRepository
                .findById(parts.invitationId())
                .orElseThrow(() -> new BusinessException("Invalid invitation token"));
        validateToken(invitation, parts);
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        invitation.setStatus(StaffInvitationStatus.DECLINED);
        invitation.setDeclinedAt(now);
        staffInvitationRepository.save(invitation);
    }

    private String refreshInvitationToken(StaffInvitation invitation, OffsetDateTime now) {
        String rawToken = InvitationTokenCrypto.generateRawToken();
        String nonce = InvitationTokenCrypto.generateNonce();
        invitation.setInviteNonce(nonce);
        invitation.setInviteTokenHash(InvitationTokenCrypto.hashToken(
                tokenSecret, tokenScopeId(invitation), invitation.getId(), nonce, rawToken));
        invitation.setInviteExpiresAt(now.plusDays(7));
        return rawToken;
    }

    private Long tokenScopeId(StaffInvitation invitation) {
        if (invitation.getBoardId() != null) {
            return invitation.getBoardId();
        }
        if (invitation.getEventId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Staff invitation has no scope");
        }
        return invitation.getEventId();
    }

    private StaffInvitationResponse createSingleForEvent(
            Long eventId, Long actorId, String rawEmail, SystemRole role) {
        validateStaffRole(role);
        String email = normalizeEmail(rawEmail);
        Optional<StaffInvitationResponse> carried = tryCarryoverInvitation(eventId, null, actorId, email, role);
        if (carried.isPresent()) {
            return carried.get();
        }
        staffInvitationRepository
                .findByEventIdAndBoardIdIsNullAndEmailIgnoreCaseAndRoleAndStatus(
                        eventId, email, role, StaffInvitationStatus.INVITED)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "STAFF_INVITATION_ALREADY_PENDING");
                });

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        StaffInvitation invitation = StaffInvitation.builder()
                .eventId(eventId)
                .email(email)
                .role(role)
                .status(StaffInvitationStatus.INVITED)
                .invitedAt(now)
                .resendCount(0)
                .createdBy(actorId)
                .createdAt(now)
                .build();
        invitation = staffInvitationRepository.save(invitation);
        String rawToken = refreshInvitationToken(invitation, now);
        invitation = staffInvitationRepository.save(invitation);
        enqueueEmail(invitation, rawToken, now, null, eventId);
        notificationService.notifyStaffInvited(invitation, null, eventId, role);
        return toResponse(invitation, null, eventId);
    }

    private StaffInvitationResponse createSingle(
            Board board, Long eventId, Long actorId, String rawEmail, SystemRole role) {
        validateStaffRole(role);
        String email = normalizeEmail(rawEmail);
        Optional<StaffInvitationResponse> carried = tryCarryoverInvitation(eventId, board, actorId, email, role);
        if (carried.isPresent()) {
            return carried.get();
        }
        staffInvitationRepository
                .findByBoardIdAndEmailIgnoreCaseAndRoleAndStatus(
                        board.getId(), email, role, StaffInvitationStatus.INVITED)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "STAFF_INVITATION_ALREADY_PENDING");
                });

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        StaffInvitation invitation = StaffInvitation.builder()
                .boardId(board.getId())
                .email(email)
                .role(role)
                .status(StaffInvitationStatus.INVITED)
                .invitedAt(now)
                .resendCount(0)
                .createdBy(actorId)
                .createdAt(now)
                .build();
        invitation = staffInvitationRepository.save(invitation);
        String rawToken = refreshInvitationToken(invitation, now);
        invitation = staffInvitationRepository.save(invitation);
        enqueueEmail(invitation, rawToken, now, board, eventId);
        notificationService.notifyStaffInvited(invitation, board, eventId, role);
        return toResponse(invitation, board, eventId);
    }

    private Optional<StaffInvitationResponse> tryCarryoverInvitation(
            Long eventId, Board board, Long actorId, String email, SystemRole role) {
        Event event = eventRepository.findById(eventId).orElse(null);
        if (event == null || event.getAcademicTermId() == null) {
            return Optional.empty();
        }
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return Optional.empty();
        }
        Long sourceTermId = staffCarryoverService.resolvePreviousTermId(event.getAcademicTermId());
        if (sourceTermId == null
                || !staffCarryoverService.wasStaffInSourceTerm(sourceTermId, user.getId(), role)) {
            return Optional.empty();
        }

        boolean alreadyInTerm = staffInvitationRepository
                .findByEventIdAndBoardIdIsNullAndEmailIgnoreCaseAndRoleAndStatus(
                        eventId, email, role, StaffInvitationStatus.ACCEPTED)
                .isPresent();
        if (!alreadyInTerm) {
            staffCarryoverService.registerStaffForCurrentTerm(eventId, actorId, user, role);
        } else {
            activateInvitedStaffUser(user, role);
            ensureUserRole(user.getId(), role);
        }

        if (board != null) {
            boardAssignmentService.completeStaffAssignment(board.getId(), user.getId(), role, actorId);
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        StaffInvitation invitation = staffInvitationRepository.save(StaffInvitation.builder()
                .eventId(eventId)
                .boardId(board != null ? board.getId() : null)
                .email(email)
                .role(role)
                .status(StaffInvitationStatus.ACCEPTED)
                .invitedAt(now)
                .acceptedAt(now)
                .acceptedUserId(user.getId())
                .resendCount(0)
                .createdBy(actorId)
                .createdAt(now)
                .build());
        if (board != null) {
            notificationService.notifyStaffInvitationAccepted(event, board, invitation, user);
        }
        return Optional.of(toResponse(invitation, board, eventId));
    }

    private void enqueueEmail(
            StaffInvitation invitation, String rawToken, OffsetDateTime now, Board board, Long eventId) {
        Long scopeId = tokenScopeId(invitation);
        String invitationToken = InvitationTokenCrypto.buildToken(
                scopeId, invitation.getId(), invitation.getInviteNonce(), rawToken);
        Event event = eventId == null ? null : eventRepository.findById(eventId).orElse(null);
        String eventName = event == null || event.getName() == null ? "cuộc thi" : event.getName();
        String boardName = board == null || board.getName() == null ? "" : board.getName();
        Map<String, Object> payloadFields = new LinkedHashMap<>();
        payloadFields.put("staffInvitationId", invitation.getId());
        payloadFields.put("eventId", eventId);
        payloadFields.put("boardId", invitation.getBoardId());
        payloadFields.put("boardName", boardName);
        payloadFields.put("eventName", eventName);
        payloadFields.put("email", invitation.getEmail());
        payloadFields.put("role", invitation.getRole().name());
        payloadFields.put("inviteToken", invitationToken);
        payloadFields.put("inviteExpiresAt", invitation.getInviteExpiresAt().toString());

        outboxMessageRepository.save(OutboxMessage.builder()
                .aggregateType("StaffInvitation")
                .aggregateId(invitation.getId())
                .eventType("StaffInvitationSent")
                .payload(OutboxPayloadBuilder.invitationSent(objectMapper, payloadFields))
                .attempts(0)
                .processed(false)
                .deadLetter(false)
                .createdAt(now)
                .build());
    }

    private void validateToken(
            StaffInvitation invitation, StaffInvitationTokenCodec.StaffInvitationTokenParts parts) {
        if (invitation.getStatus() != StaffInvitationStatus.INVITED) {
            throw new BusinessException("Invitation is no longer valid");
        }
        if (!tokenScopeId(invitation).equals(parts.boardId())) {
            throw new BusinessException("Invalid invitation token");
        }
        if (invitation.getInviteExpiresAt() != null
                && invitation.getInviteExpiresAt().isBefore(OffsetDateTime.now(ZoneOffset.UTC))) {
            invitation.setStatus(StaffInvitationStatus.EXPIRED);
            staffInvitationRepository.save(invitation);
            throw new BusinessException("Invitation has expired");
        }
        String expectedHash = InvitationTokenCrypto.hashToken(
                tokenSecret, parts.boardId(), parts.invitationId(), parts.nonce(), parts.rawToken());
        if (!expectedHash.equals(invitation.getInviteTokenHash())) {
            throw new BusinessException("Invalid invitation token");
        }
    }

    private void activateInvitedStaffUser(User user, SystemRole role) {
        if (role != SystemRole.MENTOR && role != SystemRole.JUDGE) {
            return;
        }
        if (user.getStatus() == UserStatus.PENDING_APPROVAL) {
            user.setStatus(UserStatus.ACTIVE);
            user.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
            userRepository.save(user);
        }
    }

    private void ensureUserRole(Long userId, SystemRole role) {
        if (!userRoleRepository.existsByUserIdAndRole(userId, role)) {
            userRoleRepository.save(UserRole.builder()
                    .userId(userId)
                    .role(role)
                    .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                    .build());
        }
    }

    private List<Long> resolveBoardIds(Long eventId, Long roundId, Long boardId) {
        if (boardId != null) {
            Board board = boardRepository.findById(boardId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
            if (!resolveEventId(board).equals(eventId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Board does not belong to event");
            }
            if (roundId != null && !roundId.equals(board.getRoundId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Board does not belong to round");
            }
            return List.of(boardId);
        }
        List<Round> rounds;
        if (roundId != null) {
            Round round = organizerAuthorizationService.requireRoundOwnedByCurrentOrganizer(roundId);
            if (!round.getEventId().equals(eventId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Round does not belong to event");
            }
            rounds = List.of(round);
        } else {
            rounds = roundRepository.findByEventId(eventId);
        }
        List<Long> boardIds = new ArrayList<>();
        for (Round round : rounds) {
            for (Board board : boardRepository.findByRoundId(round.getId())) {
                boardIds.add(board.getId());
            }
        }
        return boardIds;
    }

    private Long resolveEventId(Board board) {
        Round round = roundRepository.findById(board.getRoundId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
        return round.getEventId();
    }

    private StaffInvitationResponse toResponse(
            StaffInvitation invitation, Board board, Long eventId, EmailTrackingSummary tracking) {
        String boardName = board == null ? null : board.getName();
        Long roundId = board == null ? null : board.getRoundId();
        String roundName = null;
        if (roundId != null) {
            roundName = roundRepository.findById(roundId).map(Round::getName).orElse(null);
        }
        String eventName = null;
        if (eventId != null) {
            Event event = eventRepository.findById(eventId).orElse(null);
            eventName = event == null ? null : event.getName();
        }
        StaffInvitationResponse.StaffInvitationResponseBuilder builder = StaffInvitationResponse.builder()
                .id(invitation.getId())
                .boardId(invitation.getBoardId())
                .boardName(boardName)
                .roundId(roundId)
                .roundName(roundName)
                .eventId(eventId)
                .eventName(eventName)
                .email(invitation.getEmail())
                .role(invitation.getRole())
                .status(invitation.getStatus())
                .invitedAt(invitation.getInvitedAt())
                .inviteExpiresAt(invitation.getInviteExpiresAt())
                .acceptedAt(invitation.getAcceptedAt())
                .declinedAt(invitation.getDeclinedAt())
                .resendCount(invitation.getResendCount() == null ? 0 : invitation.getResendCount())
                .lastResentAt(invitation.getLastResentAt());
        if (tracking != null) {
            builder
                    .emailOpenCount(tracking.getOpenCount())
                    .emailOpenedAt(tracking.getOpenedAt())
                    .emailAcceptClickedAt(tracking.getAcceptClickedAt())
                    .emailDeclineClickedAt(tracking.getDeclineClickedAt());
        }
        return builder.build();
    }

    private StaffInvitationResponse toResponse(StaffInvitation invitation, Board board, Long eventId) {
        return toResponse(invitation, board, eventId, null);
    }

    private Board requireBoard(Long boardId) {
        return boardRepository.findById(boardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
    }

    private void validateStaffRole(SystemRole role) {
        if (role != SystemRole.MENTOR && role != SystemRole.JUDGE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be MENTOR or JUDGE");
        }
    }

    private void expireStaleInvitations(List<Long> boardIds) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        staffInvitationRepository.markExpired(
                boardIds, StaffInvitationStatus.INVITED, StaffInvitationStatus.EXPIRED, now);
    }

    private void expireEventScopedStaleInvitations(Long eventId) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        staffInvitationRepository.markEventScopedExpired(
                eventId, StaffInvitationStatus.INVITED, StaffInvitationStatus.EXPIRED, now);
    }

    private PagedResult<StaffInvitationResponse> emptyPage(int page, int size) {
        return PagedResult.<StaffInvitationResponse>builder()
                .items(List.of())
                .page(page)
                .size(size)
                .total(0)
                .totalPages(0)
                .build();
    }

    private String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email must not be blank");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

}
