package com.seal.hackathon.registration.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.common.exception.BusinessException;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.registration.dto.MemberRequest;
import com.seal.hackathon.registration.dto.RegisterTeamRequest;
import com.seal.hackathon.registration.dto.TeamDetailDto;
import com.seal.hackathon.registration.dto.TeamMemberDto;
import com.seal.hackathon.registration.entity.IdempotencyKey;
import com.seal.hackathon.registration.entity.AuditLog;
import com.seal.hackathon.registration.entity.DomainEvent;
import com.seal.hackathon.registration.entity.OutboxMessage;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.AuditLogRepository;
import com.seal.hackathon.registration.repository.DomainEventRepository;
import com.seal.hackathon.registration.repository.IdempotencyKeyRepository;
import com.seal.hackathon.registration.repository.OutboxMessageRepository;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.notification.service.NotificationService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.ZoneOffset;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.HexFormat;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RegistrationServiceImpl implements RegistrationService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final OutboxMessageRepository outboxMessageRepository;
    private final DomainEventRepository domainEventRepository;
    private final AuditLogRepository auditLogRepository;
    private final InvitationService invitationService;
    private final IdempotencyKeyRepository idempotencyKeyRepository;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    public RegistrationServiceImpl(
            EventRepository eventRepository,
            UserRepository userRepository,
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository,
            OutboxMessageRepository outboxMessageRepository,
            DomainEventRepository domainEventRepository,
            AuditLogRepository auditLogRepository,
            InvitationService invitationService,
            IdempotencyKeyRepository idempotencyKeyRepository,
            ObjectMapper objectMapper,
            NotificationService notificationService) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.outboxMessageRepository = outboxMessageRepository;
        this.domainEventRepository = domainEventRepository;
        this.auditLogRepository = auditLogRepository;
        this.invitationService = invitationService;
        this.idempotencyKeyRepository = idempotencyKeyRepository;
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public TeamDetailDto registerTeam(Long eventId, RegisterTeamRequest request, Long contactUserId, String contactEmail, String idempotencyKey, String requestPath) {
        String normalizedIdempotencyKey = normalizeIdempotencyKey(idempotencyKey);
        String requestHash = hashRequest(eventId, request, contactUserId, contactEmail);

        IdempotencyKey reservation = null;
        if (normalizedIdempotencyKey != null) {
                Optional<IdempotencyKey> existing = idempotencyKeyRepository.findByKeyAndUserIdAndRequestMethodAndRequestPath(
                    normalizedIdempotencyKey,
                    contactUserId,
                    "POST",
                    requestPath);
            if (existing.isPresent() && existing.get().getResponseBody() != null) {
                verifySameRequest(existing.get(), requestHash);
                return readStoredResponse(existing.get());
            }

            if (existing.isPresent() && existing.get().getRequestHash() != null && !Objects.equals(existing.get().getRequestHash(), requestHash)) {
                throw new BusinessException("Idempotency key already used for a different request");
            }

            reservation = IdempotencyKey.builder()
                    .key(normalizedIdempotencyKey)
                    .userId(contactUserId)
                    .requestMethod("POST")
                    .requestPath(requestPath)
                    .requestHash(requestHash)
                    .responseCode(null)
                    .responseBody(null)
                    .createdAt(OffsetDateTime.now())
                    .expiresAt(OffsetDateTime.now().plusHours(24))
                    .build();

            try {
                idempotencyKeyRepository.saveAndFlush(reservation);
            } catch (DataIntegrityViolationException ex) {
                IdempotencyKey stored = idempotencyKeyRepository.findByKeyAndUserIdAndRequestMethodAndRequestPath(
                        normalizedIdempotencyKey,
                        contactUserId,
                        "POST",
                        requestPath)
                        .orElseThrow(() -> new BusinessException("Duplicate request in progress"));
                if (stored.getResponseBody() != null) {
                    verifySameRequest(stored, requestHash);
                    return readStoredResponse(stored);
                }
                throw new BusinessException("Duplicate request in progress");
            }
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException("Event not found"));

        validateRegistrationWindow(event);
        User contactUser = userRepository.findById(contactUserId)
                .orElseThrow(() -> new BusinessException("Contact user not found"));

        List<MemberRequest> normalizedMembers = normalizeAndValidateMembers(request.getMembers(), contactEmail, contactUser.getFullName());

        validateTeamSize(event, normalizedMembers.size());

        if (teamRepository.existsByEventIdAndNameIgnoreCase(eventId, request.getName())) {
            throw new BusinessException("Team name already exists for this event");
        }

        ensureNoDuplicateRegistration(eventId, contactUserId, normalizedMembers);

        OffsetDateTime now = OffsetDateTime.now();

        Team team = Team.builder()
                .eventId(eventId)
                .name(request.getName().trim())
                .sequenceNo(null)
                .contactUserId(contactUserId)
                .contactEmail(contactEmail)
                .status(TeamStatus.PENDING)
                .confirmedAt(null)
                .rejectedReason(null)
                .createdAt(now)
                .updatedAt(now)
                .build();
        team = teamRepository.save(team);

        List<TeamMember> savedMembers = new ArrayList<>();
        for (int index = 0; index < normalizedMembers.size(); index++) {
            MemberRequest memberRequest = normalizedMembers.get(index);
            boolean isContactPerson = index == 0 && Objects.equals(normalizeEmail(memberRequest.getEmail()), normalizeEmail(contactEmail));

            TeamMember member = TeamMember.builder()
                    .eventId(eventId)
                    .teamId(team.getId())
                    .userId(isContactPerson ? contactUserId : null)
                    .email(normalizeEmail(memberRequest.getEmail()))
                    .fullName(memberRequest.getFullName().trim())
                    .studentId(memberRequest.getStudentId())
                    .university(memberRequest.getUniversity())
                    .contactPerson(isContactPerson)
                    .status(isContactPerson ? TeamMemberStatus.CONFIRMED : TeamMemberStatus.INVITED)
                    .inviteTokenHash(null)
                    .inviteNonce(null)
                    .inviteExpiresAt(null)
                    .inviteConsumedAt(null)
                    .invitedAt(isContactPerson ? null : now)
                    .confirmedAt(isContactPerson ? now : null)
                    .declinedAt(null)
                    .build();
            savedMembers.add(teamMemberRepository.save(member));
        }

        teamMemberRepository.flush();

        savedMembers = invitationService.issueInvitations(team, savedMembers, contactUserId);

        DomainEvent domainEvent = DomainEvent.builder()
                .occurredAt(now)
                .aggregateType("Team")
                .aggregateId(team.getId())
                .eventType("TeamRegistered")
                .payload("{\"teamId\": " + team.getId() + ", \"eventId\": " + eventId + "}")
                .build();
        domainEventRepository.save(domainEvent);

        OutboxMessage outboxMessage = OutboxMessage.builder()
                .aggregateType("Team")
                .aggregateId(team.getId())
                .eventType("TeamRegistered")
                .payload("{\"teamId\": " + team.getId() + ", \"eventId\": " + eventId + "}")
                .attempts(0)
                .lastError(null)
                .processed(false)
                .processedAt(null)
                .createdAt(now)
                .build();
        outboxMessageRepository.save(outboxMessage);

        AuditLog auditLog = AuditLog.builder()
                .actorId(contactUserId)
                .actorEmail(contactUser.getEmail())
                .action("TEAM_REGISTERED")
                .entityType("Team")
                .entityId(team.getId())
                .beforeState(null)
                .afterState("{\"teamId\": " + team.getId() + ", \"memberCount\": " + savedMembers.size() + "}")
                .createdAt(now)
                .build();
        auditLogRepository.save(auditLog);

        TeamDetailDto response = toDetailDto(team, savedMembers);
        if (reservation != null) {
            reservation.setResponseCode(201);
            reservation.setResponseBody(writeStoredResponse(response));
            idempotencyKeyRepository.save(reservation);
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public TeamDetailDto getTeam(Long teamId, Long requesterUserId, boolean organizer) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        if (!organizer && (requesterUserId == null || !teamMemberRepository.existsByTeamIdAndUserId(teamId, requesterUserId))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        return loadTeamDetail(team);
    }

    @Override
    @Transactional
    public TeamDetailDto updateTeamStatus(Long teamId, TeamStatus status, String reason, Long actorUserId, String actorEmail, boolean organizer) {
        if (!organizer) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Organizer role required. Sign in with an account that has ORGANIZER permission.");
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        TeamStatus currentStatus = team.getStatus();
        if (currentStatus == status) {
            return loadTeamDetail(team);
        }

        if (status == TeamStatus.PENDING) {
            throw new BusinessException("Invalid team status transition");
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        String trimmedReason = reason == null ? null : reason.trim();

        switch (status) {
            case CONFIRMED -> {
                team.setStatus(TeamStatus.CONFIRMED);
                team.setConfirmedAt(now);
                team.setRejectedReason(null);
            }
            case WAITLIST -> {
                team.setStatus(TeamStatus.WAITLIST);
                team.setConfirmedAt(null);
                team.setRejectedReason(null);
            }
            case REJECTED, DISQUALIFIED -> {
                if (trimmedReason == null || trimmedReason.isBlank()) {
                    throw new BusinessException("Reason is required for this status transition");
                }
                team.setStatus(status);
                team.setConfirmedAt(null);
                team.setRejectedReason(trimmedReason);
            }
            default -> throw new BusinessException("Invalid team status transition");
        }

        team.setUpdatedAt(now);
        teamRepository.save(team);

        String payload = "{\"teamId\": " + team.getId() + ", \"teamStatus\": \"" + team.getStatus() + "\", \"reason\": " + (trimmedReason == null ? "null" : "\"" + escapeJson(trimmedReason) + "\"") + "}";
        appendLifecycleArtifacts(team, "TEAM_STATUS_UPDATED", "TeamStatusUpdated", actorUserId, actorEmail, now, payload);

        notificationService.notifyTeamStatusChanged(team, status);

        return loadTeamDetail(team);
    }

    @Override
    @Transactional
    public TeamDetailDto confirmInvitation(String token, Long actorUserId, String actorEmail) {
        InvitationTokenCodec.InvitationTokenParts parts = InvitationTokenCodec.parse(token);
        TeamMember member = loadAndValidateInvitation(parts);
        validateInvitationActor(member, actorEmail);

        if (member.getStatus() == TeamMemberStatus.CONFIRMED) {
            Team team = teamRepository.findByIdAndEventId(parts.teamId(), member.getEventId())
                    .orElseThrow(() -> new BusinessException("Team not found"));
            return loadTeamDetail(team);
        }
        if (member.getStatus() == TeamMemberStatus.DECLINED) {
            throw new BusinessException("Invitation already declined");
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        if (member.getUserId() == null && actorUserId != null) {
            member.setUserId(actorUserId);
        }
        member.setStatus(TeamMemberStatus.CONFIRMED);
        member.setConfirmedAt(now);
        member.setInviteConsumedAt(now);
        teamMemberRepository.save(member);

        Team team = teamRepository.findByIdAndEventId(parts.teamId(), member.getEventId())
                .orElseThrow(() -> new BusinessException("Team not found"));

        List<TeamMember> teamMembers = teamMemberRepository.findByTeamId(team.getId());
        boolean allConfirmed = teamMembers.stream().allMatch(teamMember -> teamMember.getStatus() == TeamMemberStatus.CONFIRMED);
        if (allConfirmed) {
            Event event = eventRepository.findById(team.getEventId())
                    .orElseThrow(() -> new BusinessException("Event not found"));
            long confirmedTeams = teamRepository.countByEventIdAndStatus(team.getEventId(), TeamStatus.CONFIRMED);
            if (confirmedTeams < event.getMaxTeams()) {
                team.setStatus(TeamStatus.CONFIRMED);
                team.setConfirmedAt(now);
                team.setRejectedReason(null);
            } else {
                team.setStatus(TeamStatus.WAITLIST);
            }
        }
        team.setUpdatedAt(now);
        teamRepository.save(team);

        appendLifecycleArtifacts(team, "INVITATION_CONFIRMED", "InvitationConfirmed", actorUserId, actorEmail, now,
                "{\"teamId\": " + team.getId() + ", \"teamMemberId\": " + member.getId() + ", \"teamStatus\": \"" + team.getStatus() + "\"}");

        return toDetailDto(team, teamMembers);
    }

    @Override
    @Transactional
    public TeamDetailDto declineInvitation(String token, Long actorUserId, String actorEmail) {
        InvitationTokenCodec.InvitationTokenParts parts = InvitationTokenCodec.parse(token);
        TeamMember member = loadAndValidateInvitation(parts);
        validateInvitationActor(member, actorEmail);

        if (member.getStatus() == TeamMemberStatus.CONFIRMED) {
            throw new BusinessException("Cannot decline after confirmation");
        }
        if (member.getStatus() == TeamMemberStatus.DECLINED) {
            Team team = teamRepository.findByIdAndEventId(parts.teamId(), member.getEventId())
                    .orElseThrow(() -> new BusinessException("Team not found"));
            return loadTeamDetail(team);
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        if (member.getUserId() == null && actorUserId != null) {
            member.setUserId(actorUserId);
        }
        member.setStatus(TeamMemberStatus.DECLINED);
        member.setDeclinedAt(now);
        member.setInviteConsumedAt(now);
        teamMemberRepository.save(member);

        Team team = teamRepository.findByIdAndEventId(parts.teamId(), member.getEventId())
                .orElseThrow(() -> new BusinessException("Team not found"));
        team.setStatus(TeamStatus.REJECTED);
        team.setRejectedReason("Member declined invitation");
        team.setUpdatedAt(now);
        teamRepository.save(team);

        List<TeamMember> teamMembers = teamMemberRepository.findByTeamId(team.getId());

        appendLifecycleArtifacts(team, "INVITATION_DECLINED", "InvitationDeclined", actorUserId, actorEmail, now,
                "{\"teamId\": " + team.getId() + ", \"teamMemberId\": " + member.getId() + ", \"teamStatus\": \"" + team.getStatus() + "\"}");

        return toDetailDto(team, teamMembers);
    }

    @Override
    @Transactional
    public TeamDetailDto resendInvitation(Long teamMemberId, Long actorUserId, String actorEmail, boolean organizer) {
        TeamMember member = teamMemberRepository.findById(teamMemberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team member not found"));
        Team team = teamRepository.findById(member.getTeamId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        if (!organizer && !Objects.equals(team.getContactUserId(), actorUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        if (member.getStatus() == TeamMemberStatus.CONFIRMED) {
            throw new BusinessException("Cannot resend confirmed invitation");
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        member.setStatus(TeamMemberStatus.INVITED);
        member.setConfirmedAt(null);
        member.setDeclinedAt(null);
        member.setInviteConsumedAt(null);
        member.setInvitedAt(now);
        teamMemberRepository.save(member);

        invitationService.issueInvitations(team, List.of(member), actorUserId);

        team.setStatus(TeamStatus.PENDING);
        team.setConfirmedAt(null);
        team.setRejectedReason(null);
        team.setUpdatedAt(now);
        teamRepository.save(team);

        appendLifecycleArtifacts(team, "INVITATION_RESENT", "InvitationResent", actorUserId, actorEmail, now,
                "{\"teamId\": " + team.getId() + ", \"teamMemberId\": " + member.getId() + ", \"teamStatus\": \"" + team.getStatus() + "\"}");

        return loadTeamDetail(team);
    }

    @Override
    @Transactional
    public TeamDetailDto inviteTeamMember(Long teamId, MemberRequest memberRequest, Long actorUserId, String actorEmail, boolean organizer) {
        if (memberRequest == null || memberRequest.getEmail() == null || memberRequest.getEmail().isBlank()) {
            throw new BusinessException("Invalid email format");
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        if (!organizer && !Objects.equals(team.getContactUserId(), actorUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        if (team.getStatus() == TeamStatus.REJECTED || team.getStatus() == TeamStatus.DISQUALIFIED) {
            throw new BusinessException("Team registration is closed");
        }

        Event event = eventRepository.findById(team.getEventId())
                .orElseThrow(() -> new BusinessException("Event not found"));

        validateRegistrationWindow(event);

        List<TeamMember> existingMembers = teamMemberRepository.findByTeamId(teamId);
        if (existingMembers.size() >= event.getMaxTeamSize()) {
            throw new BusinessException("Team has reached the maximum size of " + event.getMaxTeamSize());
        }

        String normalizedEmail = normalizeEmail(memberRequest.getEmail());
        boolean alreadyOnTeam = existingMembers.stream()
                .anyMatch(existing -> Objects.equals(normalizeEmail(existing.getEmail()), normalizedEmail));
        if (alreadyOnTeam) {
            throw new BusinessException("Email already belongs to this team");
        }

        if (teamMemberRepository.existsByEventIdAndEmailIgnoreCase(team.getEventId(), normalizedEmail)) {
            throw new BusinessException("User/email already registered in another team for this event");
        }

        String fullName = memberRequest.getFullName();
        if (fullName == null || fullName.isBlank()) {
            fullName = normalizedEmail;
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        TeamMember member = TeamMember.builder()
                .eventId(team.getEventId())
                .teamId(team.getId())
                .userId(null)
                .email(normalizedEmail)
                .fullName(fullName.trim())
                .studentId(memberRequest.getStudentId())
                .university(memberRequest.getUniversity())
                .contactPerson(false)
                .status(TeamMemberStatus.INVITED)
                .inviteTokenHash(null)
                .inviteNonce(null)
                .inviteExpiresAt(null)
                .inviteConsumedAt(null)
                .invitedAt(now)
                .confirmedAt(null)
                .declinedAt(null)
                .build();
        member = teamMemberRepository.save(member);
        teamMemberRepository.flush();

        invitationService.issueInvitations(team, List.of(member), actorUserId);

        if (team.getStatus() == TeamStatus.CONFIRMED || team.getStatus() == TeamStatus.WAITLIST) {
            team.setStatus(TeamStatus.PENDING);
            team.setConfirmedAt(null);
            team.setRejectedReason(null);
        }
        team.setUpdatedAt(now);
        teamRepository.save(team);

        appendLifecycleArtifacts(team, "TEAM_MEMBER_INVITED", "TeamMemberInvited", actorUserId, actorEmail, now,
                "{\"teamId\": " + team.getId() + ", \"teamMemberId\": " + member.getId() + ", \"email\": \"" + escapeJson(normalizedEmail) + "\", \"teamStatus\": \"" + team.getStatus() + "\"}");

        return loadTeamDetail(team);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeamDetailDto> getMyTeams(Long eventId, Long userId) {
        List<TeamMember> memberships = teamMemberRepository.findAllByEventIdAndUserId(eventId, userId);
        return memberships.stream()
                .map(TeamMember::getTeamId)
                .distinct()
                .map(teamId -> teamRepository.findByIdAndEventId(teamId, eventId))
                .flatMap(Optional::stream)
                .map(this::loadTeamDetail)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeamDetailDto> getEventTeams(Long eventId) {
        return getEventTeams(eventId, null);
    }

    @Override
    public List<TeamDetailDto> getEventTeams(Long eventId, TeamStatus status) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException("Event not found"));
        List<com.seal.hackathon.registration.entity.Team> teams = status == null
                ? teamRepository.findByEventId(eventId)
                : teamRepository.findByEventIdAndStatus(eventId, status);
        return teams.stream()
                .map(this::loadTeamDetail)
                .collect(Collectors.toList());
    }

    private void validateRegistrationWindow(Event event) {
        OffsetDateTime now = OffsetDateTime.now();
        if (event.getStatus() != EventStatus.REGISTRATION_OPEN) {
            throw new BusinessException("Registration for this event is closed");
        }
        if (event.getRegistrationStartAt() != null && now.isBefore(event.getRegistrationStartAt())) {
            throw new BusinessException("Registration for this event is closed");
        }
        if (event.getRegistrationEndAt() != null && now.isAfter(event.getRegistrationEndAt())) {
            throw new BusinessException("Registration for this event is closed");
        }
    }

    private void validateTeamSize(Event event, int memberCount) {
        if (memberCount < event.getMinTeamSize() || memberCount > event.getMaxTeamSize()) {
            throw new BusinessException("Team size must be between " + event.getMinTeamSize() + " and " + event.getMaxTeamSize());
        }
    }

    private List<MemberRequest> normalizeAndValidateMembers(List<MemberRequest> members, String contactEmail, String contactFullName) {
        if (members == null || members.isEmpty()) {
            throw new BusinessException("Team must include at least one member");
        }

        Map<String, MemberRequest> uniqueByEmail = new LinkedHashMap<>();
        for (MemberRequest member : members) {
            if (member == null || member.getEmail() == null || member.getEmail().isBlank()) {
                throw new BusinessException("Invalid email format");
            }
            String normalizedEmail = normalizeEmail(member.getEmail());
            if (uniqueByEmail.containsKey(normalizedEmail)) {
                throw new BusinessException("Duplicate member email in request");
            }
            uniqueByEmail.put(normalizedEmail, member);
        }

        String normalizedContactEmail = normalizeEmail(contactEmail);
        MemberRequest creator = new MemberRequest();
        creator.setEmail(contactEmail);
        creator.setFullName(contactFullName == null || contactFullName.isBlank() ? contactEmail : contactFullName);

        List<MemberRequest> orderedMembers = new ArrayList<>();
        orderedMembers.add(creator);
        for (Map.Entry<String, MemberRequest> entry : uniqueByEmail.entrySet()) {
            if (!entry.getKey().equals(normalizedContactEmail)) {
                orderedMembers.add(entry.getValue());
            }
        }

        return orderedMembers;
    }

    private void ensureNoDuplicateRegistration(Long eventId, Long contactUserId, List<MemberRequest> members) {
        List<String> normalizedEmails = members.stream()
                .map(MemberRequest::getEmail)
                .filter(Objects::nonNull)
                .map(this::normalizeEmail)
                .collect(Collectors.toList());

        for (String email : normalizedEmails) {
            if (teamMemberRepository.existsByEventIdAndEmailIgnoreCase(eventId, email)) {
                throw new BusinessException("User/email already registered in another team for this event");
            }
        }

        if (teamMemberRepository.existsByEventIdAndUserId(eventId, contactUserId)) {
            throw new BusinessException("User/email already registered in another team for this event");
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private void validateInvitationActor(TeamMember member, String actorEmail) {
        String normalizedActorEmail = normalizeEmail(actorEmail);
        String normalizedInvitedEmail = normalizeEmail(member.getEmail());
        if (normalizedActorEmail == null || !Objects.equals(normalizedActorEmail, normalizedInvitedEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invitation does not belong to current user");
        }
    }

    private String normalizeIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null) {
            return null;
        }
        String normalized = idempotencyKey.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String hashRequest(Long eventId, RegisterTeamRequest request, Long contactUserId, String contactEmail) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String serialized = objectMapper.writeValueAsString(request) + "|" + eventId + "|" + contactUserId + "|" + normalizeEmail(contactEmail);
            byte[] hash = digest.digest(serialized.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to calculate idempotency hash", ex);
        }
    }

    private void verifySameRequest(IdempotencyKey stored, String requestHash) {
        if (stored.getRequestHash() != null && !Objects.equals(stored.getRequestHash(), requestHash)) {
            throw new BusinessException("Idempotency key already used for a different request");
        }
    }

    private TeamMember loadAndValidateInvitation(InvitationTokenCodec.InvitationTokenParts parts) {
        String expectedHash = invitationService.hashIncomingToken(
                parts.teamId(), parts.teamMemberId(), parts.nonce(), parts.rawToken());

        TeamMember member = teamMemberRepository.findByIdAndTeamId(parts.teamMemberId(), parts.teamId())
                .or(() -> teamMemberRepository.findByInviteTokenHashAndInviteNonce(expectedHash, parts.nonce()))
                .orElseThrow(() -> new BusinessException(
                        "Invitation not found. The link may be outdated — ask the organizer to resend the invitation."));

        if (!Objects.equals(member.getTeamId(), parts.teamId())) {
            throw new BusinessException("Invitation not found");
        }

        if (member.getInviteExpiresAt() != null && OffsetDateTime.now(ZoneOffset.UTC).isAfter(member.getInviteExpiresAt())) {
            throw new BusinessException("Invitation token expired");
        }
        if (!Objects.equals(member.getInviteNonce(), parts.nonce())) {
            throw new BusinessException("Invalid invitation token");
        }
        if (!Objects.equals(member.getInviteTokenHash(), expectedHash)) {
            throw new BusinessException("Invalid invitation token");
        }
        return member;
    }

    private void appendLifecycleArtifacts(Team team, String action, String eventType, Long actorUserId, String actorEmail,
                                          OffsetDateTime now, String payload) {
        DomainEvent domainEvent = DomainEvent.builder()
                .occurredAt(now)
                .aggregateType("Team")
                .aggregateId(team.getId())
                .eventType(eventType)
                .payload(payload)
                .build();
        domainEventRepository.save(domainEvent);

        OutboxMessage outboxMessage = OutboxMessage.builder()
                .aggregateType("Team")
                .aggregateId(team.getId())
                .eventType(eventType)
                .payload(payload)
                .attempts(0)
                .lastError(null)
                .processed(false)
                .processedAt(null)
                .createdAt(now)
                .build();
        outboxMessageRepository.save(outboxMessage);

        AuditLog auditLog = AuditLog.builder()
                .actorId(actorUserId)
                .actorEmail(actorEmail)
                .action(action)
                .entityType("Team")
                .entityId(team.getId())
                .beforeState(null)
                .afterState(payload)
                .createdAt(now)
                .build();
        auditLogRepository.save(auditLog);
    }

    private String escapeJson(String raw) {
        if (raw == null) {
            return null;
        }
        return raw.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private TeamDetailDto loadTeamDetail(Team team) {
        return toDetailDto(team, teamMemberRepository.findByTeamId(team.getId()));
    }

    private String writeStoredResponse(TeamDetailDto dto) {
        try {
            return objectMapper.writeValueAsString(dto);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to serialize idempotency response", ex);
        }
    }

    private TeamDetailDto readStoredResponse(IdempotencyKey stored) {
        try {
            return objectMapper.readValue(stored.getResponseBody(), TeamDetailDto.class);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to deserialize idempotency response", ex);
        }
    }

    private TeamDetailDto toDetailDto(Team team, List<TeamMember> members) {
        TeamDetailDto dto = new TeamDetailDto();
        dto.setId(team.getId());
        dto.setEventId(team.getEventId());
        dto.setName(team.getName());
        dto.setStatus(team.getStatus() == null ? null : team.getStatus().name());
        dto.setConfirmedAt(team.getConfirmedAt());
        dto.setRejectedReason(team.getRejectedReason());
        dto.setMembers(members.stream().map(this::toMemberDto).collect(Collectors.toList()));
        return dto;
    }

    private TeamMemberDto toMemberDto(TeamMember member) {
        TeamMemberDto dto = new TeamMemberDto();
        dto.setId(member.getId());
        dto.setEmail(member.getEmail());
        dto.setFullName(member.getFullName());
        dto.setStatus(member.getStatus() == null ? null : member.getStatus().name());
        dto.setContactPerson(Boolean.TRUE.equals(member.getContactPerson()));
        dto.setInvitedAt(member.getInvitedAt());
        dto.setConfirmedAt(member.getConfirmedAt());
        return dto;
    }

}
