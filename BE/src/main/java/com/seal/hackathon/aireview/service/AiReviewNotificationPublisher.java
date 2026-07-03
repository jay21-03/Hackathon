package com.seal.hackathon.aireview.service;

import com.seal.hackathon.aireview.entity.AiReview;
import com.seal.hackathon.assignment.entity.MentorAssignment;
import com.seal.hackathon.assignment.repository.MentorAssignmentRepository;
import com.seal.hackathon.common.enums.AiReviewStatus;
import com.seal.hackathon.common.enums.NotificationType;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.notification.service.NotificationService;
import com.seal.hackathon.registration.entity.Team;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiReviewNotificationPublisher {

    private final NotificationService notificationService;
    private final EventRepository eventRepository;
    private final MentorAssignmentRepository mentorAssignmentRepository;
    private final BoardSlotRepository boardSlotRepository;

    @Value("${app.ai.review.notifications-enabled:true}")
    private boolean notificationsEnabled;

    public void publishAfterReview(Team team, AiReview review, boolean significantChange) {
        if (!notificationsEnabled || team == null || review == null) {
            return;
        }
        Event event = eventRepository.findById(team.getEventId()).orElse(null);
        if (event == null) {
            return;
        }

        String teamLabel = StringUtils.hasText(team.getName()) ? team.getName() : ("Đội #" + team.getId());
        String link = "/organizer/ai-reviews?teamId=" + team.getId() + "&eventId=" + team.getEventId();

        if (review.getStatus() == AiReviewStatus.FAILED) {
            notifyUser(
                    event.getCreatedBy(),
                    event.getId(),
                    NotificationType.GENERAL,
                    "AI Review lỗi - " + teamLabel,
                    "Đánh giá AI thất bại. Kiểm tra AI_API_KEY hoặc chạy lại thủ công.",
                    link,
                    "ai-review-failed:" + review.getId());
            return;
        }

        if (significantChange) {
            String dedupe = "ai-review-significant:" + team.getId() + ":" + review.getId();
            notifyUser(
                    event.getCreatedBy(),
                    event.getId(),
                    NotificationType.GENERAL,
                    "Thay đổi quan trọng - " + teamLabel,
                    "AI phát hiện thay đổi đáng kể trên repository. Xem rubric và GitHub Issue.",
                    link,
                    dedupe);
            for (Long mentorUserId : mentorUserIdsForTeam(team.getId(), review.getRoundId())) {
                notifyUser(
                        mentorUserId,
                        event.getId(),
                        NotificationType.GENERAL,
                        "Thay đổi repo - " + teamLabel,
                        "AI đánh dấu thay đổi đáng kể trên repository đội bạn mentor.",
                        mentorReviewLink(team, review),
                        dedupe + ":mentor:" + mentorUserId);
            }
        }
    }

    public void publishBulkJobFinished(Long eventId, Long organizerUserId, int succeeded, int failed, int total) {
        if (!notificationsEnabled || organizerUserId == null) {
            return;
        }
        notifyUser(
                organizerUserId,
                eventId,
                NotificationType.GENERAL,
                "Hoàn tất chạy AI hàng loạt",
                "Đã xử lý " + succeeded + "/" + total + " đội thành công"
                        + (failed > 0 ? (" - " + failed + " đội lỗi.") : "."),
                "/organizer/ai-reviews",
                "ai-review-bulk:" + eventId + ":" + System.currentTimeMillis() / 60_000);
    }

    private Set<Long> mentorUserIdsForTeam(Long teamId, Long roundId) {
        Set<Long> userIds = new LinkedHashSet<>();
        for (BoardSlot slot : boardSlotRepository.findByTeamId(teamId)) {
            if (roundId != null && !roundId.equals(slot.getRoundId())) {
                continue;
            }
            if (slot.getBoardId() == null) {
                continue;
            }
            for (MentorAssignment assignment : mentorAssignmentRepository.findByBoardId(slot.getBoardId())) {
                if (assignment.getMentorId() != null) {
                    userIds.add(assignment.getMentorId());
                }
            }
        }
        return userIds;
    }

    private String mentorReviewLink(Team team, AiReview review) {
        StringBuilder link = new StringBuilder("/mentor/ai-review?teamId=")
                .append(team.getId())
                .append("&eventId=")
                .append(team.getEventId());
        if (review.getRoundId() != null) {
            link.append("&roundId=").append(review.getRoundId());
        }
        Long boardId = boardSlotRepository.findByTeamId(team.getId()).stream()
                .filter(slot -> review.getRoundId() == null || review.getRoundId().equals(slot.getRoundId()))
                .map(BoardSlot::getBoardId)
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .orElse(null);
        if (boardId != null) {
            link.append("&boardId=").append(boardId);
        }
        return link.toString();
    }

    private void notifyUser(
            Long userId,
            Long eventId,
            NotificationType type,
            String title,
            String content,
            String linkUrl,
            String dedupeKey) {
        if (userId == null) {
            return;
        }
        try {
            notificationService.create(userId, null, eventId, type, title, content, linkUrl, dedupeKey);
        } catch (Exception ex) {
            log.warn("Could not publish AI review notification for user {}: {}", userId, ex.getMessage());
        }
    }
}
