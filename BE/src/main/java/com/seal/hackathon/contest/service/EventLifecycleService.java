package com.seal.hackathon.contest.service;

import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.academic.entity.AcademicTerm;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.award.entity.TeamAward;
import com.seal.hackathon.award.repository.TeamAwardRepository;
import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.RoundStatus;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.contest.dto.EventResponse;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.notification.service.NotificationService;
import com.seal.hackathon.ranking.repository.RankingResultRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.registration.service.AuditLogWriter;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventLifecycleService {

    private static final Set<EventStatus> TERMINAL_STATUSES = EnumSet.of(EventStatus.COMPLETED, EventStatus.CANCELLED);

    private final EventRepository eventRepository;
    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final AcademicTermRepository academicTermRepository;
    private final RoundRepository roundRepository;
    private final BoardRepository boardRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final RankingResultRepository rankingResultRepository;
    private final TeamAwardRepository teamAwardRepository;
    private final TeamRepository teamRepository;
    private final ContestPhaseGuardService contestPhaseGuardService;
    private final NotificationService notificationService;
    private final AuditLogWriter auditLogWriter;
    private final CurrentUserProvider currentUserProvider;

    @Value("${app.event.lifecycle.auto-open-registration:true}")
    private boolean autoOpenRegistration;

    @Value("${app.event.lifecycle.auto-close-registration:true}")
    private boolean autoCloseRegistration;

    @Value("${app.event.lifecycle.auto-start-competition:true}")
    private boolean autoStartCompetition;

    @Value("${app.event.lifecycle.auto-complete-competition:true}")
    private boolean autoCompleteCompetition;

    @Transactional
    public EventResponse openRegistration(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        Event event = requireEvent(eventId);
        assertNotTerminal(event, "Cannot open registration for this event status");

        OffsetDateTime now = OffsetDateTime.now();
        if (event.getRegistrationEndAt() != null && now.isAfter(event.getRegistrationEndAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Registration end date has passed");
        }
        if (event.getStatus() != EventStatus.DRAFT && event.getStatus() != EventStatus.REGISTRATION_CLOSED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Event must be DRAFT or REGISTRATION_CLOSED to open registration");
        }

        return applyManualTransition(event, EventStatus.REGISTRATION_OPEN, now);
    }

    @Transactional
    public EventResponse closeRegistration(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        Event event = requireEvent(eventId);
        assertNotTerminal(event, "Cannot close registration for this event status");

        if (event.getStatus() != EventStatus.REGISTRATION_OPEN) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Event must be REGISTRATION_OPEN to close registration");
        }

        return applyManualTransition(event, EventStatus.REGISTRATION_CLOSED, OffsetDateTime.now());
    }

    @Transactional
    public EventResponse startCompetition(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        Event event = requireEvent(eventId);
        assertNotTerminal(event, "Cannot start competition for this event status");

        if (event.getStatus() != EventStatus.REGISTRATION_CLOSED
                && event.getStatus() != EventStatus.REGISTRATION_OPEN) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Event must be REGISTRATION_CLOSED or REGISTRATION_OPEN to start competition");
        }

        return applyManualTransition(event, EventStatus.IN_PROGRESS, OffsetDateTime.now());
    }

    @Transactional
    public EventResponse completeCompetition(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        Event event = requireEvent(eventId);
        assertNotTerminal(event, "Cannot complete competition for this event status");

        if (event.getStatus() != EventStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event must be IN_PROGRESS to complete");
        }
        requireCompetitionCompletionReady(event.getId(), OffsetDateTime.now());

        return applyManualTransition(event, EventStatus.COMPLETED, OffsetDateTime.now());
    }

    @Transactional
    public EventResponse cancelEvent(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        Event event = requireEvent(eventId);
        assertNotTerminal(event, "Event is already completed or cancelled");

        return applyManualTransition(event, EventStatus.CANCELLED, OffsetDateTime.now());
    }

  /** Scheduler tick: auto transitions based on configured timestamps. */
    @Transactional
    public int runScheduledTransitions() {
        OffsetDateTime now = OffsetDateTime.now();
        LocalDate today = LocalDate.now();
        List<Event> candidates = eventRepository.findByStatusIn(EnumSet.complementOf(EnumSet.copyOf(TERMINAL_STATUSES)));
        int transitions = 0;

        for (Event event : candidates) {
            EventStatus before = event.getStatus();
            EventStatus next = resolveScheduledStatus(event, now, today);
            if (next != null && next != before) {
                if (next == EventStatus.COMPLETED && !isCompetitionCompletionReady(event.getId(), now)) {
                    continue;
                }
                applyScheduledTransition(event, next, now);
                transitions++;
                log.info(
                        "Event lifecycle auto-transition: eventId={}, {} -> {}",
                        event.getId(),
                        before,
                        next);
            }
        }

        return transitions;
    }

    public void assertEventAllowsBoardAssignment(Event event) {
        contestPhaseGuardService.assertEventAllowsBoardAssignment(event);
    }

    private EventResponse applyManualTransition(Event event, EventStatus nextStatus, OffsetDateTime now) {
        CurrentUserPrincipal actor = currentUserProvider.getCurrentUser();
        return applyTransition(event, nextStatus, now, actor.getUserId(), actor.getEmail());
    }

    private void applyScheduledTransition(Event event, EventStatus nextStatus, OffsetDateTime now) {
        applyTransition(event, nextStatus, now, null, "hệ thống");
    }

    private EventStatus resolveScheduledStatus(Event event, OffsetDateTime now, LocalDate today) {
        return switch (event.getStatus()) {
            case DRAFT -> shouldAutoOpen(event, now) ? EventStatus.REGISTRATION_OPEN : null;
            case REGISTRATION_OPEN -> shouldAutoClose(event, now) ? EventStatus.REGISTRATION_CLOSED : null;
            case REGISTRATION_CLOSED -> shouldAutoStart(event, today) ? EventStatus.IN_PROGRESS : null;
            case IN_PROGRESS -> shouldAutoComplete(event, today) ? EventStatus.COMPLETED : null;
            default -> null;
        };
    }

    private boolean shouldAutoOpen(Event event, OffsetDateTime now) {
        if (!autoOpenRegistration || event.getRegistrationStartAt() == null) {
            return false;
        }
        if (now.isBefore(event.getRegistrationStartAt())) {
            return false;
        }
        return event.getRegistrationEndAt() == null || !now.isAfter(event.getRegistrationEndAt());
    }

    private boolean shouldAutoClose(Event event, OffsetDateTime now) {
        return autoCloseRegistration
                && event.getRegistrationEndAt() != null
                && now.isAfter(event.getRegistrationEndAt());
    }

    private boolean shouldAutoStart(Event event, LocalDate today) {
        return autoStartCompetition && event.getStartDate() != null && !today.isBefore(event.getStartDate());
    }

    private boolean shouldAutoComplete(Event event, LocalDate today) {
        return autoCompleteCompetition && event.getEndDate() != null && today.isAfter(event.getEndDate());
    }

    private boolean isCompetitionCompletionReady(Long eventId, OffsetDateTime now) {
        try {
            requireCompetitionCompletionReady(eventId, now);
            return true;
        } catch (ResponseStatusException ex) {
            log.info("Event completion readiness blocked: eventId={}, reason={}", eventId, ex.getReason());
            return false;
        }
    }

    private void requireCompetitionCompletionReady(Long eventId, OffsetDateTime now) {
        List<String> blockers = new java.util.ArrayList<>();
        List<Round> rounds = roundRepository.findByEventId(eventId);
        if (rounds.isEmpty()) {
            blockers.add("NO_ROUNDS");
        }
        for (Round round : rounds) {
            boolean roundHasConfirmedTeams = boardRepository.findByRoundId(round.getId()).stream()
                    .anyMatch(board -> hasConfirmedTeam(board.getId()));
            if (!roundHasConfirmedTeams) {
                continue;
            }
            boolean endedByTime = round.getEndAt() != null && !round.getEndAt().isAfter(now);
            if (round.getStatus() != RoundStatus.COMPLETED && !endedByTime) {
                blockers.add("ROUND_NOT_COMPLETED:" + round.getId());
            }
            for (Board board : boardRepository.findByRoundId(round.getId())) {
                boolean hasTeams = hasConfirmedTeam(board.getId());
                if (hasTeams && !rankingResultRepository.existsByBoardIdAndPublishedAtIsNotNull(board.getId())) {
                    blockers.add("RANKING_NOT_PUBLISHED:" + board.getId());
                }
            }
        }
        List<TeamAward> awards = teamAwardRepository.findByEventIdOrderByAwardCategoryIdAscIdAsc(eventId);
        boolean hasUnpublishedAwards = awards.stream().anyMatch(award -> !Boolean.TRUE.equals(award.getPublished()));
        if (!awards.isEmpty() && hasUnpublishedAwards) {
            blockers.add("AWARDS_NOT_PUBLISHED");
        }
        boolean hasIneligibleAwardWinners = awards.stream()
                .filter(award -> Boolean.TRUE.equals(award.getPublished()))
                .anyMatch(award -> teamRepository.findById(award.getTeamId())
                        .map(team -> team.getStatus() != TeamStatus.CONFIRMED)
                        .orElse(true));
        if (hasIneligibleAwardWinners) {
            blockers.add("AWARDS_INCLUDE_INELIGIBLE_TEAMS");
        }
        if (!blockers.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "COMPETITION_NOT_READY:" + String.join(",", blockers));
        }
    }

    private boolean hasConfirmedTeam(Long boardId) {
        return boardSlotRepository.findByBoardId(boardId).stream()
                .map(slot -> slot.getTeamId())
                .filter(teamId -> teamId != null)
                .anyMatch(teamId -> teamRepository.findById(teamId)
                        .map(team -> team.getStatus() == TeamStatus.CONFIRMED)
                        .orElse(false));
    }

    private Event requireEvent(Long eventId) {
        return eventRepository
                .findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
    }

    private void assertNotTerminal(Event event, String message) {
        if (TERMINAL_STATUSES.contains(event.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private EventResponse applyTransition(
            Event event, EventStatus nextStatus, OffsetDateTime now, Long actorId, String actorEmail) {
        EventStatus before = event.getStatus();
        if (before == nextStatus) {
            return toEventResponse(event);
        }
        event.setStatus(nextStatus);
        event.setUpdatedAt(now);
        Event saved = eventRepository.save(event);
        String payload = "{\"eventId\":" + saved.getId() + ",\"eventStatus\":\"" + nextStatus + "\"}";
        auditLogWriter.write(
                actorId,
                actorEmail,
                "EVENT_STATUS_CHANGED",
                "Event",
                saved.getId(),
                "{\"status\":\"" + before + "\"}",
                payload);
        notificationService.notifyOrganizerEventStatusChanged(saved, before, nextStatus);
        return toEventResponse(saved);
    }

    private EventResponse toEventResponse(Event event) {
        AcademicTerm term = event.getAcademicTermId() == null
                ? null
                : academicTermRepository.findById(event.getAcademicTermId()).orElse(null);
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
                .academicTermId(term != null ? term.getId() : null)
                .academicTermCode(term != null ? term.getCode() : null)
                .academicTermName(term != null ? term.getName() : null)
                .createdBy(event.getCreatedBy())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}
