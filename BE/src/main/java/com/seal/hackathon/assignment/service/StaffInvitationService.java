package com.seal.hackathon.assignment.service;

import com.seal.hackathon.assignment.dto.CreateStaffInvitationRequest;
import com.seal.hackathon.assignment.dto.StaffInvitationResponse;
import com.seal.hackathon.assignment.entity.StaffInvitation;
import com.seal.hackathon.assignment.repository.StaffInvitationRepository;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.entity.UserRole;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.repository.UserRoleRepository;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.enums.StaffInvitationStatus;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.common.exception.BusinessException;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.registration.entity.OutboxMessage;
import com.seal.hackathon.registration.repository.OutboxMessageRepository;
import com.seal.hackathon.notification.service.NotificationService;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class StaffInvitationService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final StaffInvitationRepository staffInvitationRepository;
    private final BoardRepository boardRepository;
    private final RoundRepository roundRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final BoardAssignmentService boardAssignmentService;
    private final CurrentUserProvider currentUserProvider;
    private final OutboxMessageRepository outboxMessageRepository;
    private final NotificationService notificationService;

    @Value("${app.invitation.token-secret:dev-invite-secret-change-me}")
    private String tokenSecret;

    @Transactional(readOnly = true)
    public List<StaffInvitationResponse> listPending(Long eventId, Long boardId, SystemRole role) {
        CurrentUserPrincipal principal = requireOrganizer();
        assertOrganizerOwnsEvent(principal, eventId);
        List<Long> boardIds = resolveBoardIds(eventId, boardId);
        if (boardIds.isEmpty()) {
            return List.of();
        }
        List<StaffInvitation> invitations = role == null
                ? staffInvitationRepository.findByBoardIdInAndStatusOrderByInvitedAtDesc(
                        boardIds, StaffInvitationStatus.INVITED)
                : staffInvitationRepository.findByBoardIdInAndRoleAndStatusOrderByInvitedAtDesc(
                        boardIds, role, StaffInvitationStatus.INVITED);
        Map<Long, Board> boardsById = boardRepository.findAllById(boardIds).stream()
                .collect(Collectors.toMap(Board::getId, b -> b));
        return invitations.stream()
                .map(inv -> toResponse(inv, boardsById.get(inv.getBoardId()), eventId))
                .toList();
    }

    @Transactional
    public StaffInvitationResponse create(Long boardId, CreateStaffInvitationRequest request) {
        CurrentUserPrincipal principal = requireOrganizer();
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
        Long eventId = resolveEventId(board);
        assertOrganizerOwnsEvent(principal, eventId);

        if (request.getRole() != SystemRole.MENTOR && request.getRole() != SystemRole.JUDGE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be MENTOR or JUDGE");
        }

        String email = normalizeEmail(request.getEmail());
        staffInvitationRepository
                .findByBoardIdAndEmailIgnoreCaseAndRoleAndStatus(
                        boardId, email, request.getRole(), StaffInvitationStatus.INVITED)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "STAFF_INVITATION_ALREADY_PENDING");
                });

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        StaffInvitation invitation = StaffInvitation.builder()
                .boardId(boardId)
                .email(email)
                .role(request.getRole())
                .status(StaffInvitationStatus.INVITED)
                .invitedAt(now)
                .createdBy(principal.getUserId())
                .createdAt(now)
                .build();
        invitation = staffInvitationRepository.save(invitation);
        String rawToken = refreshInvitationToken(invitation, now);
        invitation = staffInvitationRepository.save(invitation);
        enqueueEmail(invitation, rawToken, now);
        notificationService.notifyStaffInvited(invitation, board, eventId, request.getRole());
        return toResponse(invitation, board, eventId);
    }

    @Transactional
    public StaffInvitationResponse resend(Long staffInvitationId) {
        CurrentUserPrincipal principal = requireOrganizer();
        StaffInvitation invitation = staffInvitationRepository
                .findByIdAndStatus(staffInvitationId, StaffInvitationStatus.INVITED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff invitation not found"));
        Board board = boardRepository.findById(invitation.getBoardId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
        Long eventId = resolveEventId(board);
        assertOrganizerOwnsEvent(principal, eventId);

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        String rawToken = refreshInvitationToken(invitation, now);
        invitation.setInvitedAt(now);
        invitation = staffInvitationRepository.save(invitation);
        enqueueEmail(invitation, rawToken, now);
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

        ensureUserRole(user.getId(), invitation.getRole());
        boardAssignmentService.completeStaffAssignment(
                invitation.getBoardId(), user.getId(), invitation.getRole(), invitation.getCreatedBy());

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        invitation.setStatus(StaffInvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(now);
        invitation.setAcceptedUserId(user.getId());
        staffInvitationRepository.save(invitation);

        Board board = boardRepository.findById(invitation.getBoardId()).orElse(null);
        Long eventId = board == null ? null : resolveEventId(board);
        if (board != null && eventId != null) {
            Event event = eventRepository.findById(eventId).orElse(null);
            if (event != null) {
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
        String rawToken = generateRawToken();
        String nonce = generateNonce();
        invitation.setInviteNonce(nonce);
        invitation.setInviteTokenHash(hashToken(invitation.getBoardId(), invitation.getId(), nonce, rawToken));
        invitation.setInviteExpiresAt(now.plusDays(7));
        return rawToken;
    }

    private void enqueueEmail(StaffInvitation invitation, String rawToken, OffsetDateTime now) {
        String invitationToken = invitation.getBoardId() + "." + invitation.getId() + "."
                + invitation.getInviteNonce() + "." + rawToken;
        String payload = "{\"staffInvitationId\": " + invitation.getId()
                + ", \"boardId\": " + invitation.getBoardId()
                + ", \"email\": \"" + escapeJson(invitation.getEmail()) + "\""
                + ", \"role\": \"" + invitation.getRole().name() + "\""
                + ", \"inviteToken\": \"" + escapeJson(invitationToken) + "\""
                + ", \"inviteExpiresAt\": \"" + invitation.getInviteExpiresAt() + "\"}";
        outboxMessageRepository.save(OutboxMessage.builder()
                .aggregateType("StaffInvitation")
                .aggregateId(invitation.getId())
                .eventType("StaffInvitationSent")
                .payload(payload)
                .attempts(0)
                .processed(false)
                .createdAt(now)
                .build());
    }

    private void validateToken(
            StaffInvitation invitation, StaffInvitationTokenCodec.StaffInvitationTokenParts parts) {
        if (invitation.getStatus() != StaffInvitationStatus.INVITED) {
            throw new BusinessException("Invitation is no longer valid");
        }
        if (!invitation.getBoardId().equals(parts.boardId())) {
            throw new BusinessException("Invalid invitation token");
        }
        if (invitation.getInviteExpiresAt() != null
                && invitation.getInviteExpiresAt().isBefore(OffsetDateTime.now(ZoneOffset.UTC))) {
            invitation.setStatus(StaffInvitationStatus.EXPIRED);
            staffInvitationRepository.save(invitation);
            throw new BusinessException("Invitation has expired");
        }
        String expectedHash = hashToken(parts.boardId(), parts.invitationId(), parts.nonce(), parts.rawToken());
        if (!expectedHash.equals(invitation.getInviteTokenHash())) {
            throw new BusinessException("Invalid invitation token");
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

    private List<Long> resolveBoardIds(Long eventId, Long boardId) {
        if (boardId != null) {
            Board board = boardRepository.findById(boardId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
            if (!resolveEventId(board).equals(eventId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Board does not belong to event");
            }
            return List.of(boardId);
        }
        List<Long> boardIds = new ArrayList<>();
        for (Round round : roundRepository.findByEventId(eventId)) {
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

    private StaffInvitationResponse toResponse(StaffInvitation invitation, Board board, Long eventId) {
        String boardName = board == null ? null : board.getName();
        String eventName = null;
        if (eventId != null) {
            Event event = eventRepository.findById(eventId).orElse(null);
            eventName = event == null ? null : event.getName();
        }
        return StaffInvitationResponse.builder()
                .id(invitation.getId())
                .boardId(invitation.getBoardId())
                .boardName(boardName)
                .eventId(eventId)
                .eventName(eventName)
                .email(invitation.getEmail())
                .role(invitation.getRole())
                .status(invitation.getStatus())
                .invitedAt(invitation.getInvitedAt())
                .inviteExpiresAt(invitation.getInviteExpiresAt())
                .build();
    }

    private CurrentUserPrincipal requireOrganizer() {
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        if (principal.getRoles() == null || !principal.getRoles().contains("ORGANIZER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ONLY_ORGANIZER");
        }
        return principal;
    }

    private void assertOrganizerOwnsEvent(CurrentUserPrincipal principal, Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        if (event.getCreatedBy() != null && !event.getCreatedBy().equals(principal.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "EVENT_ACCESS_DENIED");
        }
    }

    private String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email must not be blank");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String generateRawToken() {
        byte[] buffer = new byte[32];
        SECURE_RANDOM.nextBytes(buffer);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
    }

    private String generateNonce() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private String hashToken(Long boardId, Long invitationId, String nonce, String rawToken) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(tokenSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            String payload = boardId + ":" + invitationId + ":" + nonce + ":" + rawToken;
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to generate invitation token hash", ex);
        }
    }

    private String escapeJson(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
