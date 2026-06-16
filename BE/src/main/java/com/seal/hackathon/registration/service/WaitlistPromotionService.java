package com.seal.hackathon.registration.service;

import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.notification.service.NotificationService;
import com.seal.hackathon.registration.service.AuditLogWriter;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WaitlistPromotionService {

    private final EventRepository eventRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final NotificationService notificationService;
    private final AuditLogWriter auditLogWriter;

    @Transactional
    public int promoteWaitlistIfSlotsAvailable(Long eventId) {
        Event event = eventRepository.findById(eventId).orElse(null);
        if (event == null || event.getMaxTeams() == null) {
            return 0;
        }

        long confirmedCount = teamRepository.countByEventIdAndStatus(eventId, TeamStatus.CONFIRMED);
        int availableSlots = event.getMaxTeams() - (int) confirmedCount;
        if (availableSlots <= 0) {
            return 0;
        }

        List<Team> waitlistTeams =
                teamRepository.findByEventIdAndStatusOrderByCreatedAtAscIdAsc(eventId, TeamStatus.WAITLIST);
        int promoted = 0;
        OffsetDateTime now = OffsetDateTime.now();

        for (Team team : waitlistTeams) {
            if (promoted >= availableSlots) {
                break;
            }
            if (!areAllMembersConfirmed(team.getId())) {
                continue;
            }
            team.setStatus(TeamStatus.CONFIRMED);
            team.setConfirmedAt(now);
            team.setRejectedReason(null);
            team.setUpdatedAt(now);
            teamRepository.save(team);
            notificationService.notifyTeamStatusChanged(team, TeamStatus.CONFIRMED);
            auditLogWriter.write(
                    null,
                    "hệ thống",
                    "WAITLIST_PROMOTED",
                    "Team",
                    team.getId(),
                    "{\"status\":\"WAITLIST\"}",
                    "{\"teamId\":" + team.getId() + ",\"teamStatus\":\"CONFIRMED\",\"eventId\":" + eventId + "}");
            promoted++;
            log.info("Waitlist promoted: eventId={}, teamId={}", eventId, team.getId());
        }

        return promoted;
    }

    private boolean areAllMembersConfirmed(Long teamId) {
        List<TeamMember> members = teamMemberRepository.findByTeamIdOrderByContactPersonDescFullNameAscIdAsc(teamId);
        return !members.isEmpty()
                && members.stream().allMatch(member -> member.getStatus() == TeamMemberStatus.CONFIRMED);
    }
}
