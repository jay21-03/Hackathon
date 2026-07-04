package com.seal.hackathon.registration.service;

import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.notification.service.NotificationService;
import com.seal.hackathon.registration.dto.WaitlistPromotionResult;
import com.seal.hackathon.registration.dto.WaitlistPromotionResult.TeamBriefDto;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import java.time.OffsetDateTime;
import java.util.ArrayList;
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

    /**
     * Promotes waitlisted teams only while registration is open/closed (not during competition).
     * Incomplete-member waitlist teams are reported so BTC can follow up.
     */
    @Transactional
    public WaitlistPromotionResult promoteWaitlistIfSlotsAvailable(Long eventId) {
        Event event = eventRepository.findById(eventId).orElse(null);
        if (event == null || event.getMaxTeams() == null) {
            return WaitlistPromotionResult.builder()
                    .availableSlots(0)
                    .promotedCount(0)
                    .skippedReason("EVENT_NOT_FOUND")
                    .build();
        }

        if (!isPromotionPhase(event.getStatus())) {
            String reason = event.getStatus() == EventStatus.IN_PROGRESS
                    ? "EVENT_IN_PROGRESS"
                    : "EVENT_NOT_ELIGIBLE";
            return WaitlistPromotionResult.builder()
                    .availableSlots(0)
                    .promotedCount(0)
                    .skippedReason(reason)
                    .build();
        }

        long confirmedCount = teamRepository.countByEventIdAndStatus(eventId, TeamStatus.CONFIRMED);
        int availableSlots = event.getMaxTeams() - (int) confirmedCount;
        if (availableSlots <= 0) {
            return WaitlistPromotionResult.builder()
                    .availableSlots(0)
                    .promotedCount(0)
                    .skippedReason("NO_CAPACITY")
                    .build();
        }

        List<Team> waitlistTeams =
                teamRepository.findByEventIdAndStatusOrderByCreatedAtAscIdAsc(eventId, TeamStatus.WAITLIST);
        List<TeamBriefDto> promotedTeams = new ArrayList<>();
        List<TeamBriefDto> skippedIncomplete = new ArrayList<>();
        OffsetDateTime now = OffsetDateTime.now();

        for (Team team : waitlistTeams) {
            if (promotedTeams.size() >= availableSlots) {
                break;
            }
            if (!areAllMembersConfirmed(team.getId())) {
                skippedIncomplete.add(TeamBriefDto.builder().id(team.getId()).name(team.getName()).build());
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
            promotedTeams.add(TeamBriefDto.builder().id(team.getId()).name(team.getName()).build());
            log.info("Waitlist promoted: eventId={}, teamId={}", eventId, team.getId());
        }

        if (!skippedIncomplete.isEmpty() && promotedTeams.size() < availableSlots) {
            notificationService.notifyOrganizerWaitlistPromotionBlocked(
                    event, availableSlots - promotedTeams.size(), skippedIncomplete);
        }

        return WaitlistPromotionResult.builder()
                .availableSlots(availableSlots)
                .promotedCount(promotedTeams.size())
                .promotedTeams(promotedTeams)
                .skippedIncompleteTeams(skippedIncomplete)
                .build();
    }

    private boolean isPromotionPhase(EventStatus status) {
        return status == EventStatus.REGISTRATION_OPEN || status == EventStatus.REGISTRATION_CLOSED;
    }

    private boolean areAllMembersConfirmed(Long teamId) {
        List<TeamMember> members = teamMemberRepository.findByTeamIdOrderByContactPersonDescFullNameAscIdAsc(teamId);
        return !members.isEmpty()
                && members.stream().allMatch(member -> member.getStatus() == TeamMemberStatus.CONFIRMED);
    }
}
