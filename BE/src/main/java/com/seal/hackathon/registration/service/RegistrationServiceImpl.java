package com.seal.hackathon.registration.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.UserStatus;
import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.common.exception.BusinessException;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.common.response.PagedResult;
import com.seal.hackathon.common.util.PageRequestUtils;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.award.entity.TeamAward;
import com.seal.hackathon.award.repository.TeamAwardRepository;
import com.seal.hackathon.ranking.entity.RankingResult;
import com.seal.hackathon.ranking.repository.AdvancementRepository;
import com.seal.hackathon.ranking.repository.RankingResultRepository;
import com.seal.hackathon.scoring.entity.ScoreSheet;
import com.seal.hackathon.scoring.repository.ScoreItemRepository;
import com.seal.hackathon.registration.dto.BulkInviteTeamMembersRequest;
import com.seal.hackathon.registration.dto.BulkTeamInvitationFailure;
import com.seal.hackathon.registration.dto.BulkTeamInvitationResponse;
import com.seal.hackathon.registration.dto.InviteMemberRequest;
import com.seal.hackathon.registration.dto.MemberRequest;
import com.seal.hackathon.registration.dto.RegisterTeamRequest;
import com.seal.hackathon.registration.dto.TeamDetailDto;
import com.seal.hackathon.registration.dto.TeamMemberDto;
import com.seal.hackathon.registration.dto.UpdateTeamStatusResponse;
import com.seal.hackathon.registration.dto.WaitlistPromotionResult;
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
import com.seal.hackathon.scoring.repository.ScoreSheetRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.ZoneOffset;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RegistrationServiceImpl implements RegistrationService {

    private final EventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final BoardRepository boardRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final TeamRepositoryEntityRepository teamRepositoryEntityRepository;
    private final ScoreSheetRepository scoreSheetRepository;
    private final ScoreItemRepository scoreItemRepository;
    private final RankingResultRepository rankingResultRepository;
    private final AdvancementRepository advancementRepository;
    private final TeamAwardRepository teamAwardRepository;
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
    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final WaitlistPromotionService waitlistPromotionService;

    public RegistrationServiceImpl(
            EventRepository eventRepository,
            RoundRepository roundRepository,
            BoardRepository boardRepository,
            BoardSlotRepository boardSlotRepository,
            TeamRepositoryEntityRepository teamRepositoryEntityRepository,
            ScoreSheetRepository scoreSheetRepository,
            ScoreItemRepository scoreItemRepository,
            RankingResultRepository rankingResultRepository,
            AdvancementRepository advancementRepository,
            TeamAwardRepository teamAwardRepository,
            UserRepository userRepository,
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository,
            OutboxMessageRepository outboxMessageRepository,
            DomainEventRepository domainEventRepository,
            AuditLogRepository auditLogRepository,
            InvitationService invitationService,
            IdempotencyKeyRepository idempotencyKeyRepository,
            ObjectMapper objectMapper,
            NotificationService notificationService,
            OrganizerAuthorizationService organizerAuthorizationService,
            WaitlistPromotionService waitlistPromotionService) {
        this.eventRepository = eventRepository;
        this.roundRepository = roundRepository;
        this.boardRepository = boardRepository;
        this.boardSlotRepository = boardSlotRepository;
        this.teamRepositoryEntityRepository = teamRepositoryEntityRepository;
        this.scoreSheetRepository = scoreSheetRepository;
        this.scoreItemRepository = scoreItemRepository;
        this.rankingResultRepository = rankingResultRepository;
        this.advancementRepository = advancementRepository;
        this.teamAwardRepository = teamAwardRepository;
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
        this.organizerAuthorizationService = organizerAuthorizationService;
        this.waitlistPromotionService = waitlistPromotionService;
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
        if (contactUser.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException("ACCOUNT_PENDING_APPROVAL");
        }

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
                    .resendCount(0)
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
                .deadLetter(false)
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

    private record CompetitionCleanupResult(
            int boardsCleared,
            int awardsRevoked,
            boolean awardsEventUnpublished,
            int advancementsRemoved) {
        static CompetitionCleanupResult empty() {
            return new CompetitionCleanupResult(0, 0, false, 0);
        }
    }

    private UpdateTeamStatusResponse applyTeamStatusSideEffects(Team team, TeamStatus beforeStatus) {
        notificationService.notifyTeamStatusChanged(team, team.getStatus());
        notificationService.notifyAwardEligibilityWithdrawn(team, team.getStatus());

        boolean lostEligibility = beforeStatus == TeamStatus.CONFIRMED
                && team.getStatus() != TeamStatus.CONFIRMED
                && (team.getStatus() == TeamStatus.REJECTED
                        || team.getStatus() == TeamStatus.DISQUALIFIED
                        || team.getStatus() == TeamStatus.WAITLIST);

        CompetitionCleanupResult cleanup = CompetitionCleanupResult.empty();
        WaitlistPromotionResult waitlistPromotion = null;
        List<String> nextActions = new ArrayList<>();

        if (lostEligibility) {
            int publishedBoardsBefore = (int) rankingResultRepository
                    .findByTeamIdAndPublishedAtIsNotNullOrderByBoardIdAscRankAsc(team.getId())
                    .stream()
                    .map(RankingResult::getBoardId)
                    .filter(Objects::nonNull)
                    .distinct()
                    .count();
            cleanup = clearIneligibleTeamFromCompetition(team);
            notificationService.notifyRankingEligibilityWithdrawn(
                    team,
                    team.getStatus(),
                    publishedBoardsBefore > 0 || cleanup.boardsCleared() > 0);
            notificationService.notifyOrganizerTeamRemovedFromCompetition(
                    team, team.getStatus(), cleanup.boardsCleared());
            waitlistPromotion = waitlistPromotionService.promoteWaitlistIfSlotsAvailable(team.getEventId());

            if (cleanup.boardsCleared() > 0) {
                nextActions.add("Tính lại bảng xếp hạng đã bị xóa");
                nextActions.add("Công bố lại BXH");
            }
            if (cleanup.awardsRevoked() > 0 || cleanup.awardsEventUnpublished()) {
                nextActions.add("Gợi ý/gán lại giải và công bố giải nếu cần");
            }
            if (waitlistPromotion != null && waitlistPromotion.getPromotedCount() > 0) {
                nextActions.add("Phân bảng cho đội vừa lên từ waitlist (nếu đang chia bảng)");
            }
            if (waitlistPromotion != null
                    && "EVENT_IN_PROGRESS".equals(waitlistPromotion.getSkippedReason())) {
                nextActions.add("Cuộc thi đang diễn ra — không tự promote waitlist; duyệt thủ công nếu cần");
            }
            if (waitlistPromotion != null
                    && waitlistPromotion.getSkippedIncompleteTeams() != null
                    && !waitlistPromotion.getSkippedIncompleteTeams().isEmpty()
                    && waitlistPromotion.getPromotedCount() < waitlistPromotion.getAvailableSlots()) {
                nextActions.add("Nhắc đội waitlist hoàn tất xác nhận thành viên để lên suất trống");
            }
        }

        return UpdateTeamStatusResponse.builder()
                .team(loadTeamDetail(team))
                .competitionCleanupApplied(lostEligibility)
                .boardsCleared(cleanup.boardsCleared())
                .awardsRevoked(cleanup.awardsRevoked())
                .awardsEventUnpublished(cleanup.awardsEventUnpublished())
                .advancementsRemoved(cleanup.advancementsRemoved())
                .waitlistPromotion(waitlistPromotion)
                .nextActions(nextActions)
                .build();
    }

    /**
     * When a confirmed team loses eligibility: clear board slots (even if scoring/ranking locked),
     * remove score sheets, delete board rankings (force full recalc), revoke advancements and awards.
     */
    private CompetitionCleanupResult clearIneligibleTeamFromCompetition(Team team) {
        if (team == null || team.getId() == null) {
            return CompetitionCleanupResult.empty();
        }
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        Set<Long> boardsToClear = rankingResultRepository.findByTeamId(team.getId()).stream()
                .map(RankingResult::getBoardId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));

        for (BoardSlot slot : boardSlotRepository.findByTeamId(team.getId())) {
            if (!slotBelongsToEvent(slot, team.getEventId())) {
                continue;
            }
            if (slot.getBoardId() != null) {
                boardsToClear.add(slot.getBoardId());
                deleteScoreSheetsForTeamOnBoard(slot.getBoardId(), team.getId());
            }
            slot.setTeamId(null);
            slot.setAssignedAt(now);
            boardSlotRepository.save(slot);
        }

        int boardsCleared = 0;
        for (Long boardId : boardsToClear) {
            if (rankingResultRepository.existsByBoardId(boardId)) {
                rankingResultRepository.deleteByBoardId(boardId);
                boardsCleared++;
            }
        }

        int advancementsRemoved = advancementRepository.findByTeamId(team.getId()).size();
        advancementRepository.deleteByTeamId(team.getId());

        List<TeamAward> teamAwards = teamAwardRepository.findByTeamId(team.getId());
        int awardsRevoked = teamAwards.size();
        boolean hadPublishedAward = teamAwards.stream().anyMatch(a -> Boolean.TRUE.equals(a.getPublished()));
        if (!teamAwards.isEmpty()) {
            teamAwardRepository.deleteByTeamId(team.getId());
        }
        boolean awardsEventUnpublished = false;
        if (hadPublishedAward) {
            OffsetDateTime awardNow = OffsetDateTime.now(ZoneOffset.UTC);
            for (TeamAward award : teamAwardRepository.findByEventIdOrderByAwardCategoryIdAscIdAsc(team.getEventId())) {
                if (Boolean.TRUE.equals(award.getPublished())) {
                    award.setPublished(false);
                    award.setUpdatedAt(awardNow);
                    teamAwardRepository.save(award);
                    awardsEventUnpublished = true;
                }
            }
        }
        return new CompetitionCleanupResult(
                boardsCleared, awardsRevoked, awardsEventUnpublished, advancementsRemoved);
    }

    private void deleteScoreSheetsForTeamOnBoard(Long boardId, Long teamId) {
        List<ScoreSheet> sheets = scoreSheetRepository.findByBoardIdAndTeamId(boardId, teamId);
        for (ScoreSheet sheet : sheets) {
            scoreItemRepository.deleteByScoreSheetId(sheet.getId());
        }
        if (!sheets.isEmpty()) {
            scoreSheetRepository.deleteByBoardIdAndTeamId(boardId, teamId);
        }
    }

    @Override
    @Transactional
    public UpdateTeamStatusResponse updateTeamStatus(
            Long teamId, TeamStatus status, String reason, Long actorUserId, String actorEmail, boolean organizer) {
        if (!organizer) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Organizer role required. Sign in with an account that has ORGANIZER permission.");
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(team.getEventId());

        TeamStatus currentStatus = team.getStatus();
        if (currentStatus == status) {
            return UpdateTeamStatusResponse.builder()
                    .team(loadTeamDetail(team))
                    .competitionCleanupApplied(false)
                    .boardsCleared(0)
                    .awardsRevoked(0)
                    .awardsEventUnpublished(false)
                    .advancementsRemoved(0)
                    .nextActions(List.of())
                    .build();
        }

        if (status == TeamStatus.PENDING) {
            throw new BusinessException("Invalid team status transition");
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        String trimmedReason = reason == null ? null : reason.trim();
        TeamStatus beforeStatus = team.getStatus();

        switch (status) {
            case CONFIRMED -> {
                if (!areAllMembersConfirmed(team.getId())) {
                    throw new BusinessException("All team members must confirm before organizer approval");
                }
                Event event = eventRepository.findById(team.getEventId())
                        .orElseThrow(() -> new BusinessException("Event not found"));
                long confirmedTeams = teamRepository.countByEventIdAndStatus(team.getEventId(), TeamStatus.CONFIRMED);
                if (confirmedTeams >= event.getMaxTeams()) {
                    team.setStatus(TeamStatus.WAITLIST);
                    team.setConfirmedAt(null);
                    team.setRejectedReason(null);
                } else {
                    team.setStatus(TeamStatus.CONFIRMED);
                    team.setConfirmedAt(now);
                    team.setRejectedReason(null);
                }
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
        String auditAction = team.getStatus() == TeamStatus.DISQUALIFIED
                ? "TEAM_DISQUALIFIED"
                : team.getStatus() == TeamStatus.REJECTED
                        ? "TEAM_REJECTED"
                        : "TEAM_STATUS_CHANGED";
        auditLogRepository.save(AuditLog.builder()
                .actorId(actorUserId)
                .actorEmail(actorEmail)
                .action(auditAction)
                .entityType("Team")
                .entityId(team.getId())
                .beforeState("{\"status\":\"" + beforeStatus + "\"}")
                .afterState(payload)
                .createdAt(now)
                .build());

        return applyTeamStatusSideEffects(team, beforeStatus);
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

        List<TeamMember> teamMembers = teamMemberRepository.findByTeamIdOrderByContactPersonDescFullNameAscIdAsc(team.getId());
        boolean allConfirmed = teamMembers.stream().allMatch(teamMember -> teamMember.getStatus() == TeamMemberStatus.CONFIRMED);
        if (allConfirmed && team.getStatus() == TeamStatus.PENDING) {
            team.setConfirmedAt(null);
            team.setRejectedReason(null);
            notificationService.notifyOrganizerTeamPendingApproval(team);
        } else if (!allConfirmed) {
            team.setStatus(TeamStatus.PENDING);
            team.setConfirmedAt(null);
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
        TeamStatus beforeStatus = team.getStatus();
        team.setStatus(TeamStatus.REJECTED);
        team.setRejectedReason("Member declined invitation");
        team.setConfirmedAt(null);
        team.setUpdatedAt(now);
        teamRepository.save(team);

        List<TeamMember> teamMembers = teamMemberRepository.findByTeamIdOrderByContactPersonDescFullNameAscIdAsc(team.getId());

        appendLifecycleArtifacts(team, "INVITATION_DECLINED", "InvitationDeclined", actorUserId, actorEmail, now,
                "{\"teamId\": " + team.getId() + ", \"teamMemberId\": " + member.getId() + ", \"teamStatus\": \"" + team.getStatus() + "\"}");
        auditLogRepository.save(AuditLog.builder()
                .actorId(actorUserId)
                .actorEmail(actorEmail)
                .action("TEAM_REJECTED")
                .entityType("Team")
                .entityId(team.getId())
                .beforeState("{\"status\":\"" + beforeStatus + "\"}")
                .afterState("{\"teamId\": " + team.getId() + ", \"teamStatus\": \"" + team.getStatus()
                        + "\", \"reason\": \"Member declined invitation\"}")
                .createdAt(now)
                .build());
        applyTeamStatusSideEffects(team, beforeStatus);

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
        assertTeamRosterEditable(team);

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        member.setStatus(TeamMemberStatus.INVITED);
        member.setConfirmedAt(null);
        member.setDeclinedAt(null);
        member.setInviteConsumedAt(null);
        member.setInvitedAt(now);
        int resendCount = member.getResendCount() == null ? 0 : member.getResendCount();
        member.setResendCount(resendCount + 1);
        member.setLastResentAt(now);
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
    public TeamDetailDto inviteTeamMember(
            Long teamId,
            InviteMemberRequest memberRequest,
            Long actorUserId,
            String actorEmail,
            boolean organizer,
            String idempotencyKey,
            String requestPath) {
        String normalizedIdempotencyKey = normalizeIdempotencyKey(idempotencyKey);
        String requestHash = hashInviteMemberRequest(teamId, memberRequest, actorUserId, actorEmail, organizer);

        IdempotencyKey reservation = null;
        if (normalizedIdempotencyKey != null) {
            Optional<IdempotencyKey> existing = idempotencyKeyRepository.findByKeyAndUserIdAndRequestMethodAndRequestPath(
                    normalizedIdempotencyKey,
                    actorUserId,
                    "POST",
                    requestPath);
            if (existing.isPresent() && existing.get().getResponseBody() != null) {
                verifySameRequest(existing.get(), requestHash);
                return readStoredResponse(existing.get());
            }
            if (existing.isPresent() && existing.get().getRequestHash() != null
                    && !Objects.equals(existing.get().getRequestHash(), requestHash)) {
                throw new BusinessException("Idempotency key already used for a different request");
            }
            reservation = IdempotencyKey.builder()
                    .key(normalizedIdempotencyKey)
                    .userId(actorUserId)
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
                                normalizedIdempotencyKey, actorUserId, "POST", requestPath)
                        .orElseThrow(() -> new BusinessException("Duplicate request in progress"));
                if (stored.getResponseBody() != null) {
                    verifySameRequest(stored, requestHash);
                    return readStoredResponse(stored);
                }
                throw new BusinessException("Duplicate request in progress");
            }
        }

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
        assertTeamRosterEditable(team);

        List<TeamMember> existingMembers = teamMemberRepository.findByTeamIdOrderByContactPersonDescFullNameAscIdAsc(teamId);
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
                .resendCount(0)
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

        TeamDetailDto response = loadTeamDetail(team);
        if (reservation != null) {
            reservation.setResponseCode(200);
            reservation.setResponseBody(writeStoredResponse(response));
            idempotencyKeyRepository.save(reservation);
        }
        return response;
    }

    @Override
    @Transactional
    public TeamDetailDto cancelPendingInvitation(
            Long teamId, Long teamMemberId, Long actorUserId, String actorEmail, boolean organizer) {
        TeamMember member = teamMemberRepository.findByIdAndTeamId(teamMemberId, teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team member not found"));
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

        if (!organizer && !Objects.equals(team.getContactUserId(), actorUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
        if (Boolean.TRUE.equals(member.getContactPerson())) {
            throw new BusinessException("Cannot cancel contact person");
        }
        if (member.getStatus() == TeamMemberStatus.CONFIRMED) {
            throw new BusinessException("Cannot cancel confirmed member");
        }
        assertTeamRosterEditable(team);

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        teamMemberRepository.delete(member);
        recalculateTeamStatusAfterMemberChange(team, now);

        appendLifecycleArtifacts(team, "INVITATION_CANCELLED", "InvitationCancelled", actorUserId, actorEmail, now,
                "{\"teamId\": " + team.getId() + ", \"teamMemberId\": " + teamMemberId + ", \"teamStatus\": \""
                        + team.getStatus() + "\"}");

        return loadTeamDetail(team);
    }

    @Override
    @Transactional
    public BulkTeamInvitationResponse bulkInviteTeamMembers(
            Long teamId,
            BulkInviteTeamMembersRequest request,
            Long actorUserId,
            String actorEmail,
            boolean organizer) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));
        if (!organizer && !Objects.equals(team.getContactUserId(), actorUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        List<BulkTeamInvitationFailure> failed = new ArrayList<>();
        Set<String> seenEmails = new HashSet<>();
        int succeeded = 0;

        for (InviteMemberRequest memberRequest : request.getMembers()) {
            String emailKey = memberRequest.getEmail() == null
                    ? ""
                    : memberRequest.getEmail().trim().toLowerCase(Locale.ROOT);
            if (!seenEmails.add(emailKey)) {
                failed.add(BulkTeamInvitationFailure.builder()
                        .email(memberRequest.getEmail())
                        .reason("DUPLICATE_IN_BATCH")
                        .build());
                continue;
            }
            try {
                inviteTeamMember(teamId, memberRequest, actorUserId, actorEmail, organizer, null, null);
                succeeded++;
            } catch (Exception ex) {
                String reason = ex instanceof BusinessException businessEx
                        ? businessEx.getMessage()
                        : ex instanceof ResponseStatusException statusEx
                                ? statusEx.getReason()
                                : ex.getMessage();
                failed.add(BulkTeamInvitationFailure.builder()
                        .email(memberRequest.getEmail())
                        .reason(reason == null ? "INVITE_FAILED" : reason)
                        .build());
            }
        }

        Team refreshed = teamRepository.findById(teamId).orElse(team);
        return BulkTeamInvitationResponse.builder()
                .total(request.getMembers().size())
                .succeededCount(succeeded)
                .failedCount(failed.size())
                .team(loadTeamDetail(refreshed))
                .failed(failed)
                .build();
    }

    private void recalculateTeamStatusAfterMemberChange(Team team, OffsetDateTime now) {
        if (team.getStatus() == TeamStatus.CONFIRMED
                || team.getStatus() == TeamStatus.WAITLIST
                || team.getStatus() == TeamStatus.REJECTED
                || team.getStatus() == TeamStatus.DISQUALIFIED) {
            return;
        }

        List<TeamMember> members = teamMemberRepository.findByTeamIdOrderByContactPersonDescFullNameAscIdAsc(team.getId());
        if (members.isEmpty()) {
            team.setStatus(TeamStatus.PENDING);
            team.setConfirmedAt(null);
            team.setUpdatedAt(now);
            teamRepository.save(team);
            return;
        }

        boolean allConfirmed = members.stream()
                .allMatch(existing -> existing.getStatus() == TeamMemberStatus.CONFIRMED);
        team.setStatus(TeamStatus.PENDING);
        team.setConfirmedAt(null);
        if (allConfirmed) {
            notificationService.notifyOrganizerTeamPendingApproval(team);
        }
        team.setUpdatedAt(now);
        teamRepository.save(team);
    }

    private void assertTeamRosterEditable(Team team) {
        String lockCode = resolveRosterLockCode(team);
        if (lockCode != null) {
            throw new BusinessException(lockCode);
        }
    }

    private String resolveRosterLockCode(Team team) {
        if (team == null || team.getId() == null) {
            return null;
        }
        if (!teamRepositoryEntityRepository.findAllByTeamId(team.getId()).isEmpty()) {
            return "TEAM_ROSTER_LOCKED_AFTER_OPERATION";
        }
        boolean assignedInEvent = false;
        for (BoardSlot slot : boardSlotRepository.findByTeamId(team.getId())) {
            if (!slotBelongsToEvent(slot, team.getEventId())) {
                continue;
            }
            if (slot.getBoardId() != null
                    && (!scoreSheetRepository.findByBoardIdAndTeamId(slot.getBoardId(), team.getId()).isEmpty()
                            || rankingResultRepository.findByBoardIdOrderByRankAsc(slot.getBoardId()).stream()
                                    .anyMatch(result -> team.getId().equals(result.getTeamId())))) {
                return "TEAM_ROSTER_LOCKED_AFTER_OPERATION";
            }
            assignedInEvent = true;
        }
        if (assignedInEvent) {
            return "TEAM_ROSTER_LOCKED_AFTER_ASSIGNMENT";
        }
        return null;
    }

    private boolean slotBelongsToEvent(BoardSlot slot, Long eventId) {
        if (slot == null || eventId == null) {
            return false;
        }
        Long roundId = slot.getRoundId();
        if (roundId == null && slot.getBoardId() != null) {
            roundId = boardRepository.findById(slot.getBoardId()).map(Board::getRoundId).orElse(null);
        }
        return roundId != null && roundRepository.findById(roundId)
                .map(round -> eventId.equals(round.getEventId()))
                .orElse(false);
    }

    private boolean areAllMembersConfirmed(Long teamId) {
        List<TeamMember> members = teamMemberRepository.findByTeamIdOrderByContactPersonDescFullNameAscIdAsc(teamId);
        return !members.isEmpty()
                && members.stream().allMatch(member -> member.getStatus() == TeamMemberStatus.CONFIRMED);
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
                .sorted(Comparator.comparing(Team::getName, Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(Team::getId))
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
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        List<com.seal.hackathon.registration.entity.Team> teams = status == null
                ? teamRepository.findByEventIdOrderByNameAscIdAsc(eventId)
                : teamRepository.findByEventIdAndStatusOrderByNameAscIdAsc(eventId, status);
        if (teams.isEmpty()) {
            return List.of();
        }
        List<Long> teamIds = teams.stream().map(Team::getId).toList();
        Map<Long, List<TeamMember>> membersByTeamId = teamMemberRepository.findByTeamIdIn(teamIds).stream()
                .collect(Collectors.groupingBy(TeamMember::getTeamId));
        return teams.stream()
                .map(team -> toDetailDto(team, membersByTeamId.getOrDefault(team.getId(), List.of())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResult<TeamDetailDto> getEventTeamsPaged(Long eventId, TeamStatus status, String query, int page, int size) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        int resolvedPage = PageRequestUtils.resolvePage(page);
        int resolvedSize = PageRequestUtils.resolveSize(size);
        org.springframework.data.domain.Sort teamSort = org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Order.asc("name"),
                org.springframework.data.domain.Sort.Order.asc("id"));
        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(resolvedPage, resolvedSize, teamSort);
        String searchPattern = normalizeTeamSearchPattern(query);
        org.springframework.data.domain.Page<Team> teamPage;
        if (searchPattern != null) {
            teamPage = teamRepository.searchEventTeams(eventId, status, searchPattern, pageable);
        } else if (status == null) {
            teamPage = teamRepository.findByEventId(eventId, pageable);
        } else {
            teamPage = teamRepository.findByEventIdAndStatus(eventId, status, pageable);
        }
        List<Long> teamIds = teamPage.getContent().stream().map(Team::getId).toList();
        Map<Long, List<TeamMember>> membersByTeamId = teamIds.isEmpty()
                ? Map.of()
                : teamMemberRepository.findByTeamIdIn(teamIds).stream()
                        .collect(Collectors.groupingBy(TeamMember::getTeamId));
        List<TeamDetailDto> items = teamPage.getContent().stream()
                .map(team -> toDetailDto(team, membersByTeamId.getOrDefault(team.getId(), List.of())))
                .toList();
        int totalPages = teamPage.getTotalPages();
        return PagedResult.<TeamDetailDto>builder()
                .items(items)
                .page(resolvedPage)
                .size(resolvedSize)
                .total(teamPage.getTotalElements())
                .totalPages(totalPages)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public com.seal.hackathon.registration.dto.TeamRegistrationSummaryDto getEventTeamRegistrationSummary(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        long confirmedCount = teamRepository.countByEventIdAndStatus(eventId, TeamStatus.CONFIRMED);
        long pendingCount = teamRepository.countByEventIdAndStatus(eventId, TeamStatus.PENDING);
        long waitlistCount = teamRepository.countByEventIdAndStatus(eventId, TeamStatus.WAITLIST);
        long awaitingApproval = teamRepository.findByEventIdAndStatus(eventId, TeamStatus.PENDING).stream()
                .filter(team -> areAllMembersConfirmed(team.getId()))
                .count();
        return com.seal.hackathon.registration.dto.TeamRegistrationSummaryDto.builder()
                .confirmedCount(confirmedCount)
                .pendingCount(pendingCount)
                .awaitingApprovalCount(awaitingApproval)
                .waitlistCount(waitlistCount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.seal.hackathon.registration.dto.AuditLogResponse> getEventAuditLogs(Long eventId, int limit) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        int resolvedLimit = Math.min(Math.max(limit, 1), 200);
        List<Long> teamIds = teamRepository.findByEventIdOrderByNameAscIdAsc(eventId).stream()
                .map(Team::getId)
                .toList();
        List<Long> boardIds = new ArrayList<>();
        List<Long> slotIds = new ArrayList<>();
        for (Round round : roundRepository.findByEventId(eventId)) {
            for (Board board : boardRepository.findByRoundId(round.getId())) {
                boardIds.add(board.getId());
                for (BoardSlot slot : boardSlotRepository.findByBoardId(board.getId())) {
                    slotIds.add(slot.getId());
                }
            }
        }

        List<AuditLog> merged = new ArrayList<>();
        if (!teamIds.isEmpty()) {
            merged.addAll(auditLogRepository.findByEntityTypeAndEntityIdInOrderByCreatedAtDesc(
                    "Team", teamIds, org.springframework.data.domain.PageRequest.of(0, resolvedLimit)));
        }
        if (!boardIds.isEmpty()) {
            merged.addAll(auditLogRepository.findByEntityTypeAndEntityIdInOrderByCreatedAtDesc(
                    "Board", boardIds, org.springframework.data.domain.PageRequest.of(0, resolvedLimit)));
        }
        if (!slotIds.isEmpty()) {
            merged.addAll(auditLogRepository.findByEntityTypeAndEntityIdInOrderByCreatedAtDesc(
                    "BoardSlot", slotIds, org.springframework.data.domain.PageRequest.of(0, resolvedLimit)));
        }
        merged.addAll(auditLogRepository.findByEntityTypeAndEntityIdInOrderByCreatedAtDesc(
                "Event", List.of(eventId), org.springframework.data.domain.PageRequest.of(0, resolvedLimit)));

        return merged.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(resolvedLimit)
                .map(log -> com.seal.hackathon.registration.dto.AuditLogResponse.builder()
                        .id(log.getId())
                        .actorId(log.getActorId())
                        .actorEmail(log.getActorEmail())
                        .action(log.getAction())
                        .entityType(log.getEntityType())
                        .entityId(log.getEntityId())
                        .beforeState(log.getBeforeState())
                        .afterState(log.getAfterState())
                        .createdAt(log.getCreatedAt())
                        .build())
                .toList();
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

    private String normalizeTeamSearchPattern(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }
        return "%" + query.trim().toLowerCase() + "%";
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
            if (member.getStudentId() == null || member.getStudentId().isBlank()) {
                throw new BusinessException("STUDENT_ID_REQUIRED");
            }
            if (member.getUniversity() == null || member.getUniversity().isBlank()) {
                throw new BusinessException("UNIVERSITY_REQUIRED");
            }
            String normalizedEmail = normalizeEmail(member.getEmail());
            if (uniqueByEmail.containsKey(normalizedEmail)) {
                throw new BusinessException("Duplicate member email in request");
            }
            uniqueByEmail.put(normalizedEmail, member);
        }

        String normalizedContactEmail = normalizeEmail(contactEmail);
        MemberRequest creator = uniqueByEmail.getOrDefault(normalizedContactEmail, new MemberRequest());
        creator.setEmail(contactEmail);
        if (creator.getFullName() == null || creator.getFullName().isBlank()) {
            creator.setFullName(contactFullName == null || contactFullName.isBlank() ? contactEmail : contactFullName);
        }
        if (creator.getStudentId() == null || creator.getStudentId().isBlank()) {
            throw new BusinessException("STUDENT_ID_REQUIRED");
        }
        if (creator.getUniversity() == null || creator.getUniversity().isBlank()) {
            throw new BusinessException("UNIVERSITY_REQUIRED");
        }

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

    private String hashInviteMemberRequest(
            Long teamId, InviteMemberRequest memberRequest, Long actorUserId, String actorEmail, boolean organizer) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String serialized = objectMapper.writeValueAsString(memberRequest) + "|" + teamId + "|" + actorUserId
                    + "|" + normalizeEmail(actorEmail) + "|" + organizer;
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
                .deadLetter(false)
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
        return toDetailDto(team, teamMemberRepository.findByTeamIdOrderByContactPersonDescFullNameAscIdAsc(team.getId()));
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
        dto.setReadyForOrganizerApproval(
                team.getStatus() == TeamStatus.PENDING && areAllMembersConfirmed(team.getId()));
        String rosterLockCode = resolveRosterLockCode(team);
        dto.setRosterEditable(rosterLockCode == null);
        dto.setRosterLockCode(rosterLockCode);
        dto.setMembers(members.stream()
                .sorted(Comparator
                        .comparing(TeamMember::getContactPerson, Comparator.nullsLast(Boolean::compareTo))
                        .reversed()
                        .thenComparing(TeamMember::getFullName, Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(TeamMember::getId))
                .map(this::toMemberDto)
                .collect(Collectors.toList()));
        return dto;
    }

    private TeamMemberDto toMemberDto(TeamMember member) {
        TeamMemberDto dto = new TeamMemberDto();
        dto.setId(member.getId());
        dto.setEmail(member.getEmail());
        dto.setFullName(member.getFullName());
        dto.setStudentId(member.getStudentId());
        dto.setUniversity(member.getUniversity());
        dto.setStatus(member.getStatus() == null ? null : member.getStatus().name());
        dto.setContactPerson(Boolean.TRUE.equals(member.getContactPerson()));
        dto.setInvitedAt(member.getInvitedAt());
        dto.setConfirmedAt(member.getConfirmedAt());
        return dto;
    }

}
