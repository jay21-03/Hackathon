package com.seal.hackathon.registration.service;

import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.registration.entity.OutboxMessage;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.OutboxMessageRepository;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvitationServiceImpl implements InvitationService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final TeamMemberRepository teamMemberRepository;
    private final OutboxMessageRepository outboxMessageRepository;
    private final String tokenSecret;

    public InvitationServiceImpl(
            TeamMemberRepository teamMemberRepository,
            OutboxMessageRepository outboxMessageRepository,
            @Value("${app.invitation.token-secret:dev-invite-secret-change-me}") String tokenSecret) {
        this.teamMemberRepository = teamMemberRepository;
        this.outboxMessageRepository = outboxMessageRepository;
        this.tokenSecret = tokenSecret;
    }

    @Override
    @Transactional
    public List<TeamMember> issueInvitations(Team team, List<TeamMember> members, Long actorId) {
        List<TeamMember> updatedMembers = new ArrayList<>();
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        for (TeamMember member : members) {
            if (Boolean.TRUE.equals(member.getContactPerson()) || member.getStatus() == TeamMemberStatus.CONFIRMED) {
                updatedMembers.add(member);
                continue;
            }

            String rawToken = generateRawToken();
            String nonce = generateNonce();
            String invitationToken = buildInvitationToken(team.getId(), member.getId(), nonce, rawToken);
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

            OutboxMessage outboxMessage = OutboxMessage.builder()
                    .aggregateType("TeamMember")
                    .aggregateId(saved.getId())
                    .eventType("InvitationSent")
                    .payload("{\"teamId\": " + team.getId() + ", \"teamMemberId\": " + saved.getId() + ", \"email\": \"" + escapeJson(saved.getEmail()) + "\", \"inviteToken\": \"" + escapeJson(invitationToken) + "\", \"inviteExpiresAt\": \"" + now.plusDays(2) + "\"}")
                    .attempts(0)
                    .lastError(null)
                    .processed(false)
                    .processedAt(null)
                    .createdAt(now)
                    .build();
            outboxMessageRepository.save(outboxMessage);
        }

        return updatedMembers;
    }

    public String hashIncomingToken(Long teamId, Long teamMemberId, String nonce, String rawToken) {
        return hashToken(teamId, teamMemberId, nonce, rawToken);
    }

    public String buildInvitationToken(Long teamId, Long teamMemberId, String nonce, String rawToken) {
        return teamId + "." + teamMemberId + "." + nonce + "." + rawToken;
    }

    public String generateRawToken() {
        byte[] buffer = new byte[32];
        SECURE_RANDOM.nextBytes(buffer);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
    }

    public String generateNonce() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private String hashToken(Long teamId, Long teamMemberId, String nonce, String rawToken) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(tokenSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            String payload = teamId + ":" + teamMemberId + ":" + nonce + ":" + rawToken;
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
