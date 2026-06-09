package com.seal.hackathon.mail.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.assignment.entity.StaffInvitation;
import com.seal.hackathon.assignment.repository.StaffInvitationRepository;
import com.seal.hackathon.common.enums.StaffInvitationStatus;
import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.common.security.InvitationTokenCrypto;
import com.seal.hackathon.common.util.OutboxPayloadBuilder;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.registration.entity.OutboxMessage;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.OutboxMessageRepository;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.registration.service.InvitationServiceImpl;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InvitationReminderService {

    private final StaffInvitationRepository staffInvitationRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final BoardRepository boardRepository;
    private final RoundRepository roundRepository;
    private final EventRepository eventRepository;
    private final TeamRepository teamRepository;
    private final OutboxMessageRepository outboxMessageRepository;
    private final InvitationServiceImpl invitationService;
    private final ObjectMapper objectMapper;

    @Value("${app.invitation.token-secret:dev-invite-secret-change-me}")
    private String tokenSecret;

    @Value("${app.invitation.reminder-hours-before-expiry:24}")
    private int reminderHoursBeforeExpiry;

    @Transactional
    public ReminderResult sendDueReminders() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime deadline = now.plusHours(reminderHoursBeforeExpiry);
        int staffCount = 0;
        int teamCount = 0;

        for (StaffInvitation invitation : staffInvitationRepository.findDueForReminder(
                StaffInvitationStatus.INVITED, now, deadline)) {
            if (queueStaffReminder(invitation, now)) {
                staffCount++;
            }
        }

        for (TeamMember member : teamMemberRepository.findDueForReminder(
                TeamMemberStatus.INVITED, now, deadline)) {
            if (queueTeamReminder(member, now)) {
                teamCount++;
            }
        }

        return new ReminderResult(staffCount, teamCount);
    }

    private boolean queueStaffReminder(StaffInvitation invitation, OffsetDateTime now) {
        Board board = boardRepository.findById(invitation.getBoardId()).orElse(null);
        if (board == null) {
            return false;
        }
        Long eventId = roundRepository.findById(board.getRoundId()).map(r -> r.getEventId()).orElse(null);
        Event event = eventId == null ? null : eventRepository.findById(eventId).orElse(null);

        String rawToken = InvitationTokenCrypto.generateRawToken();
        String nonce = InvitationTokenCrypto.generateNonce();
        invitation.setInviteNonce(nonce);
        invitation.setInviteTokenHash(InvitationTokenCrypto.hashToken(
                tokenSecret, invitation.getBoardId(), invitation.getId(), nonce, rawToken));
        invitation.setReminderSentAt(now);
        staffInvitationRepository.save(invitation);

        String invitationToken = InvitationTokenCrypto.buildToken(
                invitation.getBoardId(), invitation.getId(), nonce, rawToken);
        Map<String, Object> payloadFields = new LinkedHashMap<>();
        payloadFields.put("staffInvitationId", invitation.getId());
        payloadFields.put("eventId", eventId);
        payloadFields.put("boardId", invitation.getBoardId());
        payloadFields.put("boardName", board.getName());
        payloadFields.put("eventName", event == null ? "cuộc thi" : event.getName());
        payloadFields.put("email", invitation.getEmail());
        payloadFields.put("role", invitation.getRole().name());
        payloadFields.put("inviteToken", invitationToken);
        payloadFields.put("inviteExpiresAt", invitation.getInviteExpiresAt().toString());
        payloadFields.put("reminder", true);

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
        return true;
    }

    private boolean queueTeamReminder(TeamMember member, OffsetDateTime now) {
        Team team = teamRepository.findById(member.getTeamId()).orElse(null);
        if (team == null) {
            return false;
        }
        Event event = eventRepository.findById(team.getEventId()).orElse(null);
        String rawToken = InvitationTokenCrypto.generateRawToken();
        String nonce = InvitationTokenCrypto.generateNonce();
        String invitationToken = invitationService.buildInvitationToken(team.getId(), member.getId(), nonce, rawToken);
        String tokenHash = invitationService.hashIncomingToken(team.getId(), member.getId(), nonce, rawToken);

        member.setInviteTokenHash(tokenHash);
        member.setInviteNonce(nonce);
        member.setReminderSentAt(now);
        teamMemberRepository.save(member);

        Map<String, Object> payloadFields = new LinkedHashMap<>();
        payloadFields.put("teamId", team.getId());
        payloadFields.put("teamMemberId", member.getId());
        payloadFields.put("eventId", team.getEventId());
        payloadFields.put("teamName", team.getName());
        payloadFields.put("eventName", event == null ? "cuộc thi" : event.getName());
        payloadFields.put("email", member.getEmail());
        payloadFields.put("inviteToken", invitationToken);
        payloadFields.put("inviteExpiresAt", member.getInviteExpiresAt().toString());
        payloadFields.put("reminder", true);

        outboxMessageRepository.save(OutboxMessage.builder()
                .aggregateType("TeamMember")
                .aggregateId(member.getId())
                .eventType("InvitationSent")
                .payload(OutboxPayloadBuilder.invitationSent(objectMapper, payloadFields))
                .attempts(0)
                .processed(false)
                .deadLetter(false)
                .createdAt(now)
                .build());
        return true;
    }

    public record ReminderResult(int staffCount, int teamCount) {}
}
