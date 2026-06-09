package com.seal.hackathon.registration.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.common.util.OutboxPayloadBuilder;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.notification.service.NotificationService;
import com.seal.hackathon.registration.entity.OutboxMessage;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.OutboxMessageRepository;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.common.security.InvitationTokenCrypto;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvitationServiceImpl implements InvitationService {

    private final TeamMemberRepository teamMemberRepository;
    private final OutboxMessageRepository outboxMessageRepository;
    private final EventRepository eventRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    private final String tokenSecret;

    public InvitationServiceImpl(
            TeamMemberRepository teamMemberRepository,
            OutboxMessageRepository outboxMessageRepository,
            EventRepository eventRepository,
            NotificationService notificationService,
            ObjectMapper objectMapper,
            @Value("${app.invitation.token-secret:dev-invite-secret-change-me}") String tokenSecret) {
        this.teamMemberRepository = teamMemberRepository;
        this.outboxMessageRepository = outboxMessageRepository;
        this.eventRepository = eventRepository;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
        this.tokenSecret = tokenSecret;
    }

    @Override
    @Transactional
    public List<TeamMember> issueInvitations(Team team, List<TeamMember> members, Long actorId) {
        List<TeamMember> updatedMembers = new ArrayList<>();
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        String teamName = InvitationTokenCrypto.escapeJson(
                team.getName() == null || team.getName().isBlank() ? "Đội thi" : team.getName());
        String eventName = eventRepository.findById(team.getEventId())
                .map(Event::getName)
                .filter(name -> name != null && !name.isBlank())
                .map(InvitationTokenCrypto::escapeJson)
                .orElse("cuộc thi");

        for (TeamMember member : members) {
            if (Boolean.TRUE.equals(member.getContactPerson()) || member.getStatus() == TeamMemberStatus.CONFIRMED) {
                updatedMembers.add(member);
                continue;
            }

            String rawToken = InvitationTokenCrypto.generateRawToken();
            String nonce = InvitationTokenCrypto.generateNonce();
            String invitationToken = InvitationTokenCrypto.buildToken(team.getId(), member.getId(), nonce, rawToken);
            String tokenHash = hashIncomingToken(team.getId(), member.getId(), nonce, rawToken);

            member.setInviteTokenHash(tokenHash);
            member.setInviteNonce(nonce);
            member.setInviteExpiresAt(now.plusDays(2));
            member.setInvitedAt(now);
            member.setInviteConsumedAt(null);
            member.setConfirmedAt(null);
            member.setDeclinedAt(null);
            member.setStatus(TeamMemberStatus.INVITED);

            TeamMember saved = teamMemberRepository.save(member);
            updatedMembers.add(saved);

            Map<String, Object> payloadFields = new LinkedHashMap<>();
            payloadFields.put("teamId", team.getId());
            payloadFields.put("teamMemberId", saved.getId());
            payloadFields.put("eventId", team.getEventId());
            payloadFields.put("teamName", teamName);
            payloadFields.put("eventName", eventName);
            payloadFields.put("email", saved.getEmail());
            payloadFields.put("inviteToken", invitationToken);
            payloadFields.put("inviteExpiresAt", now.plusDays(2).toString());

            OutboxMessage outboxMessage = OutboxMessage.builder()
                    .aggregateType("TeamMember")
                    .aggregateId(saved.getId())
                    .eventType("InvitationSent")
                    .payload(OutboxPayloadBuilder.invitationSent(objectMapper, payloadFields))
                    .attempts(0)
                    .lastError(null)
                    .processed(false)
                    .deadLetter(false)
                    .processedAt(null)
                    .createdAt(now)
                    .build();
            outboxMessageRepository.save(outboxMessage);
            notificationService.notifyTeamMemberInvited(team, saved);
        }

        return updatedMembers;
    }

    public String hashIncomingToken(Long teamId, Long teamMemberId, String nonce, String rawToken) {
        return InvitationTokenCrypto.hashToken(tokenSecret, teamId, teamMemberId, nonce, rawToken);
    }

    public String buildInvitationToken(Long teamId, Long teamMemberId, String nonce, String rawToken) {
        return InvitationTokenCrypto.buildToken(teamId, teamMemberId, nonce, rawToken);
    }

    public String generateRawToken() {
        return InvitationTokenCrypto.generateRawToken();
    }

    public String generateNonce() {
        return InvitationTokenCrypto.generateNonce();
    }
}
