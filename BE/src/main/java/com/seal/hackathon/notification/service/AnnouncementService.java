package com.seal.hackathon.notification.service;

import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.html.ProblemHtmlSanitizer;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.common.enums.AnnouncementAudience;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.notification.dto.AnnouncementResponse;
import com.seal.hackathon.notification.dto.CreateAnnouncementRequest;
import com.seal.hackathon.notification.entity.Announcement;
import com.seal.hackathon.notification.repository.AnnouncementRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final EventRepository eventRepository;
    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;
    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final ProblemHtmlSanitizer htmlSanitizer;

    @Transactional
    public AnnouncementResponse create(Long eventId, CreateAnnouncementRequest request) {
        CurrentUserPrincipal principal = organizerAuthorizationService.requireOrganizer();
        Event event = organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);

        boolean publishNow = request.getPublishNow() == null || Boolean.TRUE.equals(request.getPublishNow());
        AnnouncementAudience audience = request.getAudience() != null ? request.getAudience() : AnnouncementAudience.ALL;
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        String sanitizedContent = htmlSanitizer.sanitize(request.getContent());
        if (sanitizedContent == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content must not be blank");
        }
        Announcement announcement = announcementRepository.save(Announcement.builder()
                .eventId(eventId)
                .title(request.getTitle().trim())
                .content(sanitizedContent)
                .publishedAt(publishNow ? now : null)
                .audience(audience)
                .recipientCount(0)
                .createdBy(principal.getUserId())
                .createdAt(now)
                .build());

        int recipientCount = 0;
        if (publishNow) {
            recipientCount = notificationService.notifyAnnouncement(event, announcement, audience);
            announcement.setRecipientCount(recipientCount);
            announcementRepository.save(announcement);
        }

        return toResponse(announcement, event.getName(), recipientCount);
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> listForOrganizer(Long eventId) {
        CurrentUserPrincipal principal = organizerAuthorizationService.requireOrganizer();
        Event event = organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);

        return announcementRepository.findByEventIdOrderByPublishedAtDescCreatedAtDesc(eventId).stream()
                .map(row -> toResponse(row, event.getName(), row.getRecipientCount() != null ? row.getRecipientCount() : 0))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> listPublishedForEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));

        return announcementRepository.findByEventIdAndPublishedAtIsNotNullOrderByPublishedAtDesc(eventId).stream()
                .map(row -> toResponse(row, event.getName(), row.getRecipientCount() != null ? row.getRecipientCount() : 0))
                .toList();
    }

    private AnnouncementResponse toResponse(Announcement announcement, String eventName, int recipientCount) {
        return AnnouncementResponse.builder()
                .id(announcement.getId())
                .eventId(announcement.getEventId())
                .eventName(eventName)
                .title(announcement.getTitle())
                .content(announcement.getContent())
                .publishedAt(announcement.getPublishedAt())
                .createdBy(announcement.getCreatedBy())
                .createdAt(announcement.getCreatedAt())
                .audience(announcement.getAudience())
                .recipientCount(recipientCount)
                .build();
    }

}
