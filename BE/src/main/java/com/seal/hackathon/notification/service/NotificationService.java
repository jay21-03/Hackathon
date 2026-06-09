package com.seal.hackathon.notification.service;

import com.seal.hackathon.assignment.entity.JudgeAssignment;
import com.seal.hackathon.assignment.entity.MentorAssignment;
import com.seal.hackathon.assignment.entity.StaffInvitation;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.assignment.repository.MentorAssignmentRepository;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.enums.AnnouncementAudience;
import com.seal.hackathon.common.enums.NotificationType;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Problem;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.notification.dto.NotificationListResponse;
import com.seal.hackathon.notification.dto.NotificationResponse;
import com.seal.hackathon.notification.entity.Announcement;
import com.seal.hackathon.notification.entity.Notification;
import com.seal.hackathon.notification.repository.NotificationRepository;
import com.seal.hackathon.ranking.entity.RankingResult;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    public record SlotAssignmentEntry(Long boardId, Long slotId, Long teamId) {}

    private static final int DEFAULT_PAGE_SIZE = 50;
    private static final int MAX_PAGE_SIZE = 100;

    private final NotificationRepository notificationRepository;
    private final CurrentUserProvider currentUserProvider;
    private final EventRepository eventRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final RoundRepository roundRepository;
    private final BoardRepository boardRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final MentorAssignmentRepository mentorAssignmentRepository;
    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final UserRepository userRepository;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void backfillUserIdOnLogin(Long userId, String email) {
        if (userId == null || !StringUtils.hasText(email)) {
            return;
        }
        notificationRepository.backfillUserIdByEmail(userId, email.trim());
    }

    @Transactional
    public Notification create(
            Long userId,
            String email,
            Long eventId,
            NotificationType type,
            String title,
            String content,
            String linkUrl,
            String dedupeKey) {
        if (StringUtils.hasText(dedupeKey) && notificationRepository.existsByDedupeKey(dedupeKey)) {
            return notificationRepository.findByDedupeKey(dedupeKey).orElse(null);
        }
          if (userId != null && !userRepository.existsById(userId)) {
        log.warn("[Notification] Invalid userId detected: {} (email={}) - fallback to email mode",
                userId, email);
        userId = null;
    }

        Notification saved = notificationRepository.save(Notification.builder()
                .userId(userId)
                .email(email)
                .eventId(eventId)
                .notificationType(type != null ? type : NotificationType.GENERAL)
                .title(title)
                .content(content)
                .linkUrl(linkUrl)
                .dedupeKey(StringUtils.hasText(dedupeKey) ? dedupeKey : null)
                .isRead(false)
                .createdAt(OffsetDateTime.now())
                .build());
        logDelivery(saved);
        return saved;
    }

    @Transactional
    public void notifyTeamMemberInvited(Team team, TeamMember member) {
        Event event = eventRepository.findById(team.getEventId()).orElse(null);
        String eventName = event != null ? event.getName() : "cuộc thi";
        String title = "Lời mời tham gia đội " + team.getName();
        String content = "Bạn được mời tham gia đội «" + team.getName() + "» tại " + eventName
                + ". Mở email hoặc liên kết mời để xác nhận.";
        String linkUrl = "/me/team?eventId=" + team.getEventId();
        String dedupeKey = member.getId() != null ? "team-invite:m" + member.getId() : null;
        create(
                member.getUserId(),
                member.getEmail(),
                team.getEventId(),
                NotificationType.TEAM_INVITE,
                title,
                content,
                linkUrl,
                dedupeKey);
    }

    @Transactional
    public void notifyStaffInvited(StaffInvitation invitation, Board board, Long eventId, SystemRole role) {
        Event event = eventRepository.findById(eventId).orElse(null);
        String eventName = event != null ? event.getName() : "cuộc thi";
        String roleLabel = role == SystemRole.JUDGE ? "giám khảo" : "mentor";
        String title = "Lời mời làm " + roleLabel;
        String content = "Bạn được mời làm " + roleLabel + " cho bảng «" + board.getName() + "» tại "
                + eventName + ". Kiểm tra email để chấp nhận lời mời.";
        String linkUrl = role == SystemRole.JUDGE ? "/judge/dashboard" : "/mentor/dashboard";
        User user = userRepository.findByEmail(invitation.getEmail()).orElse(null);
        create(
                user != null ? user.getId() : null,
                invitation.getEmail(),
                eventId,
                NotificationType.STAFF_INVITE,
                title,
                content,
                linkUrl,
                "staff-invite:i" + invitation.getId());
    }

    @Transactional
    public void notifyTeamStatusChanged(Team team, TeamStatus newStatus) {
        if (newStatus != TeamStatus.CONFIRMED
                && newStatus != TeamStatus.REJECTED
                && newStatus != TeamStatus.DISQUALIFIED
                && newStatus != TeamStatus.WAITLIST) {
            return;
        }

        Event event = eventRepository.findById(team.getEventId()).orElse(null);
        String eventName = event != null ? event.getName() : "cuộc thi";
        String title;
        String content;
        switch (newStatus) {
            case CONFIRMED -> {
                title = "Đội đã được duyệt";
                content = "Đội «" + team.getName() + "» đã được BTC xác nhận tham gia " + eventName + ".";
            }
            case REJECTED -> {
                title = "Đội không được duyệt";
                content = "Đội «" + team.getName() + "» không được BTC chấp nhận tham gia " + eventName + ".";
            }
            case DISQUALIFIED -> {
                title = "Đội bị loại";
                content = "Đội «" + team.getName() + "» đã bị loại khỏi " + eventName + ".";
            }
            case WAITLIST -> {
                title = "Đội trong danh sách chờ";
                content = "Đội «" + team.getName() + "» hiện nằm trong danh sách chờ của " + eventName + ".";
            }
            default -> {
                return;
            }
        }
        String linkUrl = "/me/team?eventId=" + team.getEventId();
        String statusKey = newStatus.name();

        for (TeamMember member : teamMemberRepository.findByTeamId(team.getId())) {
            if (member.getStatus() != TeamMemberStatus.CONFIRMED) {
                continue;
            }
            String dedupeKey = member.getUserId() != null
                    ? "team-status:t" + team.getId() + ":" + statusKey + ":u" + member.getUserId()
                    : "team-status:t" + team.getId() + ":" + statusKey + ":e" + member.getEmail().toLowerCase();
            create(
                    member.getUserId(),
                    member.getEmail(),
                    team.getEventId(),
                    NotificationType.TEAM_STATUS,
                    title,
                    content,
                    linkUrl,
                    dedupeKey);
        }
    }

    @Transactional
    public void notifySlotAssigned(Event event, Board board, BoardSlot slot, Team team) {
        String title = "Đội đã được gán slot";
        String content = event.getName() + " — đội «" + team.getName() + "» được gán slot #"
                + slot.getTeamNumber() + " tại bảng «" + board.getName() + "».";
        String linkUrl = "/me/board?eventId=" + event.getId();

        for (TeamMember member : teamMemberRepository.findByTeamId(team.getId())) {
            if (member.getStatus() != TeamMemberStatus.CONFIRMED) {
                continue;
            }
            String dedupeKey = member.getUserId() != null
                    ? "slot:s" + slot.getId() + ":u" + member.getUserId()
                    : "slot:s" + slot.getId() + ":e" + member.getEmail().toLowerCase();
            create(
                    member.getUserId(),
                    member.getEmail(),
                    event.getId(),
                    NotificationType.SLOT_ASSIGNED,
                    title,
                    content,
                    linkUrl,
                    dedupeKey);
        }
    }

    @Transactional
    public void notifyRandomSlotAssignments(Event event, List<SlotAssignmentEntry> assignments) {
        if (assignments == null || assignments.isEmpty()) {
            return;
        }
        for (SlotAssignmentEntry assignment : assignments) {
            Board board = boardRepository.findById(assignment.boardId()).orElse(null);
            BoardSlot slot = boardSlotRepository.findById(assignment.slotId()).orElse(null);
            Team team = teamRepository.findById(assignment.teamId()).orElse(null);
            if (board == null || slot == null || team == null) {
                continue;
            }
            notifySlotAssigned(event, board, slot, team);
        }
    }

    @Transactional
    public void notifySubmissionSubmitted(Team team, Event event, String repositoryUrl) {
        String title = "Bài nộp đã được gửi";
        String repoDisplay = StringUtils.hasText(repositoryUrl) ? repositoryUrl : "(chưa có URL)";
        String content = event.getName() + " — đội «" + team.getName() + "» đã nộp bài: " + repoDisplay + ".";
        String linkUrl = "/me/submission?eventId=" + event.getId();

        for (TeamMember member : teamMemberRepository.findByTeamId(team.getId())) {
            if (member.getStatus() != TeamMemberStatus.CONFIRMED) {
                continue;
            }
            String dedupeKey = member.getUserId() != null
                    ? "submission:e" + event.getId() + ":t" + team.getId() + ":u" + member.getUserId()
                    : "submission:e" + event.getId() + ":t" + team.getId() + ":e" + member.getEmail().toLowerCase();
            create(
                    member.getUserId(),
                    member.getEmail(),
                    event.getId(),
                    NotificationType.SUBMISSION,
                    title,
                    content,
                    linkUrl,
                    dedupeKey);
        }
    }

    @Transactional
    public void notifyProblemReleased(Event event, Board board, Problem problem) {
        String title = "Đề bài đã được công bố";
        String problemTitle = StringUtils.hasText(problem.getTitle()) ? problem.getTitle() : "Đề bài mới";
        String content = event.getName() + " — bảng «" + board.getName() + "»: đề «" + problemTitle
                + "» đã được công bố. Xem chi tiết trên trang cuộc thi.";
        String linkUrl = "/me/problem?eventId=" + event.getId();

        for (BoardSlot slot : boardSlotRepository.findByBoardId(board.getId())) {
            if (slot.getTeamId() == null) {
                continue;
            }
            Team team = teamRepository.findById(slot.getTeamId()).orElse(null);
            if (team == null) {
                continue;
            }
            for (TeamMember member : teamMemberRepository.findByTeamId(team.getId())) {
                if (member.getStatus() != TeamMemberStatus.CONFIRMED) {
                    continue;
                }
                String dedupeKey = member.getUserId() != null
                        ? "problem:p" + problem.getId() + ":u" + member.getUserId()
                        : "problem:p" + problem.getId() + ":e" + member.getEmail().toLowerCase();
                create(
                        member.getUserId(),
                        member.getEmail(),
                        event.getId(),
                        NotificationType.PROBLEM_RELEASED,
                        title,
                        content,
                        linkUrl,
                        dedupeKey);
            }
        }
    }

    @Transactional
    public void notifyStaffInvitationAccepted(
            Event event, Board board, StaffInvitation invitation, User acceptedUser) {
        if (event.getCreatedBy() == null || acceptedUser == null) {
            return;
        }
        User organizer = userRepository.findById(event.getCreatedBy()).orElse(null);
        if (organizer == null) {
            return;
        }

        String roleLabel = invitation.getRole() == SystemRole.JUDGE ? "giám khảo" : "mentor";
        String acceptee = StringUtils.hasText(acceptedUser.getEmail())
                ? acceptedUser.getEmail()
                : "Người dùng #" + acceptedUser.getId();
        String title = "Nhân sự đã chấp nhận lời mời";
        String content = acceptee + " đã chấp nhận làm " + roleLabel + " cho bảng «" + board.getName()
                + "» tại " + event.getName() + ".";
        String linkUrl = "/organizer/events/" + event.getId() + "/staff";

        create(
                organizer.getId(),
                organizer.getEmail(),
                event.getId(),
                NotificationType.STAFF_INVITE,
                title,
                content,
                linkUrl,
                "staff-accepted:i" + invitation.getId());
    }

    @Transactional
    public int notifyAnnouncement(Event event, Announcement announcement, AnnouncementAudience audience) {
        AnnouncementAudience resolvedAudience = audience != null ? audience : AnnouncementAudience.ALL;
        String title = announcement.getTitle();
        String content = announcement.getContent();
        String linkUrl = "/me/notifications?eventId=" + event.getId();
        Set<String> seen = new HashSet<>();
        int count = 0;

        if (resolvedAudience == AnnouncementAudience.ALL || resolvedAudience == AnnouncementAudience.PARTICIPANTS) {
            for (Team team : teamRepository.findByEventId(event.getId())) {
                for (TeamMember member : teamMemberRepository.findByTeamId(team.getId())) {
                    if (member.getStatus() != TeamMemberStatus.CONFIRMED) {
                        continue;
                    }
                    if (deliverAnnouncementRecipient(
                            event, announcement, member.getUserId(), member.getEmail(), title, content, linkUrl, seen)) {
                        count++;
                    }
                }
            }
        }

        if (resolvedAudience == AnnouncementAudience.ALL || resolvedAudience == AnnouncementAudience.STAFF) {
            for (Board board : boardsForEvent(event.getId())) {
                for (MentorAssignment assignment : mentorAssignmentRepository.findByBoardId(board.getId())) {
                    User mentor = userRepository.findById(assignment.getMentorId()).orElse(null);
                    if (mentor == null) {
                        continue;
                    }
                    if (deliverAnnouncementRecipient(
                            event, announcement, mentor.getId(), mentor.getEmail(), title, content, linkUrl, seen)) {
                        count++;
                    }
                }
                for (JudgeAssignment assignment : judgeAssignmentRepository.findByBoardId(board.getId())) {
                    User judge = userRepository.findById(assignment.getJudgeId()).orElse(null);
                    if (judge == null) {
                        continue;
                    }
                    if (deliverAnnouncementRecipient(
                            event, announcement, judge.getId(), judge.getEmail(), title, content, linkUrl, seen)) {
                        count++;
                    }
                }
            }
        }

        return count;
    }

    private boolean deliverAnnouncementRecipient(
            Event event,
            Announcement announcement,
            Long userId,
            String email,
            String title,
            String content,
            String linkUrl,
            Set<String> seen) {
        String dedupeKey = userId != null
                ? "announcement:a" + announcement.getId() + ":u" + userId
                : "announcement:a" + announcement.getId() + ":e" + email.toLowerCase();
        String seenKey = userId != null ? "u:" + userId : "e:" + email.toLowerCase();
        if (!seen.add(seenKey)) {
            return false;
        }
        Notification created = create(
                userId,
                email,
                event.getId(),
                NotificationType.ANNOUNCEMENT,
                title,
                content,
                linkUrl,
                dedupeKey);
        return created != null;
    }

    @Transactional
    public void notifyOrganizerScoringIncomplete(Event event, Board board, int submitted, int expected) {
        if (event.getCreatedBy() == null || submitted >= expected) {
            return;
        }
        User organizer = userRepository.findById(event.getCreatedBy()).orElse(null);
        if (organizer == null) {
            return;
        }
        String title = "Ti?n ?? ch?m ch?a ho?n t?t";
        String content = "B?ng ?" + board.getName() + "? t?i " + event.getName() + ": "
                + submitted + "/" + expected + " phi?u ?? n?p.";
        String linkUrl = "/organizer/scoring?eventId=" + event.getId() + "&boardId=" + board.getId();
        create(
                organizer.getId(),
                organizer.getEmail(),
                event.getId(),
                NotificationType.SCORING_REMINDER,
                title,
                content,
                linkUrl,
                "scoring-reminder:b" + board.getId());
    }

    @Transactional
    public void notifyRankingPublished(Event event, Board board, List<RankingResult> rows) {
        for (RankingResult row : rows) {
            Team team = teamRepository.findById(row.getTeamId()).orElse(null);
            if (team == null) {
                continue;
            }
            for (TeamMember member : teamMemberRepository.findByTeamId(team.getId())) {
                if (member.getStatus() != TeamMemberStatus.CONFIRMED) {
                    continue;
                }
                String dedupeKey = member.getUserId() != null
                        ? "ranking:b" + board.getId() + ":u" + member.getUserId()
                        : "ranking:b" + board.getId() + ":e" + member.getEmail().toLowerCase();
                String title = "Kết quả đã được công bố";
                String content = event.getName() + " — bảng «" + board.getName() + "»: đội «" + team.getName()
                        + "» xếp hạng #" + row.getRank() + ". Xem chi tiết tại trang kết quả.";
                String linkUrl = "/me/results?eventId=" + event.getId();
                create(
                        member.getUserId(),
                        member.getEmail(),
                        event.getId(),
                        NotificationType.RANKING_PUBLISHED,
                        title,
                        content,
                        linkUrl,
                        dedupeKey);
            }
        }
    }

    @Transactional(readOnly = true)
    public NotificationListResponse listForCurrentUser(Integer page, Integer size, NotificationType type) {
        CurrentUserPrincipal user = currentUserProvider.getCurrentUser();
        Map<Long, Notification> merged = new LinkedHashMap<>();

        if (user.getUserId() != null) {
            for (Notification notification : notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getUserId())) {
                merged.put(notification.getId(), notification);
            }
        }
        if (StringUtils.hasText(user.getEmail())) {
            for (Notification notification :
                    notificationRepository.findByEmailIgnoreCaseOrderByCreatedAtDesc(user.getEmail())) {
                merged.putIfAbsent(notification.getId(), notification);
            }
        }

        List<Notification> sorted = merged.values().stream()
                .filter(row -> type == null || row.getNotificationType() == type)
                .sorted(Comparator.comparing(Notification::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        long unread = countUnread(user);
        int resolvedPage = page == null || page < 0 ? 0 : page;
        int resolvedSize = resolvePageSize(size);
        int fromIndex = Math.min(resolvedPage * resolvedSize, sorted.size());
        int toIndex = Math.min(fromIndex + resolvedSize, sorted.size());
        List<Notification> pageItems = sorted.subList(fromIndex, toIndex);

        Map<Long, String> eventNames = loadEventNames(pageItems);
        List<NotificationResponse> items = pageItems.stream()
                .map(row -> toResponse(row, eventNames.get(row.getEventId())))
                .toList();

        return NotificationListResponse.builder()
                .items(items)
                .unreadCount(unread)
                .total(sorted.size())
                .page(resolvedPage)
                .size(resolvedSize)
                .build();
    }

    @Transactional(readOnly = true)
    public long unreadCountForCurrentUser() {
        CurrentUserPrincipal user = currentUserProvider.getCurrentUser();
        return countUnread(user);
    }

    @Transactional
    public NotificationResponse markRead(Long notificationId) {
        Notification notification = loadOwnedNotification(notificationId);
        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        }
        String eventName = notification.getEventId() != null
                ? eventRepository.findById(notification.getEventId()).map(Event::getName).orElse(null)
                : null;
        return toResponse(notification, eventName);
    }

    @Transactional
    public NotificationListResponse markAllRead() {
        CurrentUserPrincipal user = currentUserProvider.getCurrentUser();
        List<Notification> toUpdate = new ArrayList<>();
        if (user.getUserId() != null) {
            toUpdate.addAll(notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getUserId()));
        }
        if (StringUtils.hasText(user.getEmail())) {
            toUpdate.addAll(
                    notificationRepository.findByEmailIgnoreCaseAndIsReadFalseOrderByCreatedAtDesc(user.getEmail()));
        }

        Set<Long> updatedIds = new HashSet<>();
        for (Notification notification : toUpdate) {
            if (updatedIds.add(notification.getId()) && !Boolean.TRUE.equals(notification.getIsRead())) {
                notification.setIsRead(true);
                notificationRepository.save(notification);
            }
        }
        return listForCurrentUser(0, DEFAULT_PAGE_SIZE, null);
    }

    private long countUnread(CurrentUserPrincipal user) {
        Set<Long> unreadIds = new HashSet<>();
        if (user.getUserId() != null) {
            for (Notification notification :
                    notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getUserId())) {
                unreadIds.add(notification.getId());
            }
        }
        if (StringUtils.hasText(user.getEmail())) {
            for (Notification notification :
                    notificationRepository.findByEmailIgnoreCaseAndIsReadFalseOrderByCreatedAtDesc(user.getEmail())) {
                unreadIds.add(notification.getId());
            }
        }
        return unreadIds.size();
    }

    private int resolvePageSize(Integer size) {
        if (size == null || size <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    private List<Board> boardsForEvent(Long eventId) {
        List<Board> boards = new ArrayList<>();
        for (Round round : roundRepository.findByEventId(eventId)) {
            boards.addAll(boardRepository.findByRoundId(round.getId()));
        }
        return boards;
    }

    private Notification loadOwnedNotification(Long notificationId) {
        CurrentUserPrincipal user = currentUserProvider.getCurrentUser();
        Notification notification = notificationRepository
                .findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "NOTIFICATION_NOT_FOUND"));
        boolean owned = (notification.getUserId() != null && notification.getUserId().equals(user.getUserId()))
                || (notification.getEmail() != null
                        && notification.getEmail().equalsIgnoreCase(user.getEmail()));
        if (!owned) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "NOTIFICATION_FORBIDDEN");
        }
        return notification;
    }

    private Map<Long, String> loadEventNames(List<Notification> notifications) {
        Map<Long, String> names = new LinkedHashMap<>();
        for (Notification notification : notifications) {
            if (notification.getEventId() == null || names.containsKey(notification.getEventId())) {
                continue;
            }
            eventRepository.findById(notification.getEventId()).ifPresent(event -> names.put(event.getId(), event.getName()));
        }
        return names;
    }

    private NotificationResponse toResponse(Notification notification, String eventName) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .eventId(notification.getEventId())
                .eventName(eventName)
                .type(notification.getNotificationType())
                .title(notification.getTitle())
                .content(notification.getContent())
                .linkUrl(notification.getLinkUrl())
                .read(Boolean.TRUE.equals(notification.getIsRead()))
                .createdAt(notification.getCreatedAt())
                .build();
    }

    private void logDelivery(Notification notification) {
        if (mailEnabled) {
            return;
        }
        log.info(
                "[notification-mock] id={} type={} userId={} email={} eventId={} title={} link={}",
                notification.getId(),
                notification.getNotificationType(),
                notification.getUserId(),
                notification.getEmail(),
                notification.getEventId(),
                notification.getTitle(),
                notification.getLinkUrl());
    }
}
