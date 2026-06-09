package com.seal.hackathon.mail.service;

import com.seal.hackathon.mail.dto.EmailTrackingSummary;
import com.seal.hackathon.mail.entity.InvitationEmailDelivery;
import com.seal.hackathon.mail.enums.InvitationEmailType;
import com.seal.hackathon.mail.repository.InvitationEmailDeliveryRepository;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class EmailTrackingService {

    private static final byte[] TRANSPARENT_GIF = Base64.getDecoder().decode(
            "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");

    private final InvitationEmailDeliveryRepository deliveryRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.mail.api-base-url:http://localhost:8085}")
    private String apiBaseUrl;

    @Transactional
    public InvitationEmailDelivery registerSend(
            InvitationEmailType type,
            Long staffInvitationId,
            Long teamMemberId,
            String acceptUrl,
            String declineUrl,
            boolean reminder) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        InvitationEmailDelivery delivery = InvitationEmailDelivery.builder()
                .invitationType(type)
                .staffInvitationId(staffInvitationId)
                .teamMemberId(teamMemberId)
                .trackingToken(generateToken())
                .acceptUrl(acceptUrl)
                .declineUrl(declineUrl)
                .sentAt(now)
                .openCount(0)
                .reminder(reminder)
                .build();
        return deliveryRepository.save(delivery);
    }

    public String trackingPixelUrl(String trackingToken) {
        return apiBaseUrl + "/api/v1/public/email-tracking/" + trackingToken + "/open.gif";
    }

    public String trackedAcceptUrl(String trackingToken) {
        return apiBaseUrl + "/api/v1/public/email-tracking/" + trackingToken + "/click?action=accept";
    }

    public String trackedDeclineUrl(String trackingToken) {
        return apiBaseUrl + "/api/v1/public/email-tracking/" + trackingToken + "/click?action=decline";
    }

    @Transactional
    public byte[] recordOpen(String trackingToken) {
        InvitationEmailDelivery delivery = requireDelivery(trackingToken);
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        int count = delivery.getOpenCount() == null ? 0 : delivery.getOpenCount();
        delivery.setOpenCount(count + 1);
        if (delivery.getOpenedAt() == null) {
            delivery.setOpenedAt(now);
        }
        deliveryRepository.save(delivery);
        return TRANSPARENT_GIF;
    }

    @Transactional
    public String recordClickAndRedirect(String trackingToken, String action) {
        InvitationEmailDelivery delivery = requireDelivery(trackingToken);
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        if ("accept".equalsIgnoreCase(action)) {
            if (delivery.getAcceptClickedAt() == null) {
                delivery.setAcceptClickedAt(now);
                deliveryRepository.save(delivery);
            }
            return delivery.getAcceptUrl();
        }
        if ("decline".equalsIgnoreCase(action)) {
            if (delivery.getDeclineClickedAt() == null) {
                delivery.setDeclineClickedAt(now);
                deliveryRepository.save(delivery);
            }
            return delivery.getDeclineUrl();
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_TRACKING_ACTION");
    }

    @Transactional(readOnly = true)
    public Optional<EmailTrackingSummary> summaryForStaff(Long staffInvitationId) {
        return deliveryRepository.findFirstByStaffInvitationIdOrderBySentAtDesc(staffInvitationId)
                .map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public Optional<EmailTrackingSummary> summaryForTeamMember(Long teamMemberId) {
        return deliveryRepository.findFirstByTeamMemberIdOrderBySentAtDesc(teamMemberId)
                .map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public Map<Long, EmailTrackingSummary> summariesForStaff(List<Long> staffInvitationIds) {
        if (staffInvitationIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, EmailTrackingSummary> result = new HashMap<>();
        for (InvitationEmailDelivery delivery : deliveryRepository.findByStaffInvitationIdInOrderBySentAtDesc(
                staffInvitationIds)) {
            if (delivery.getStaffInvitationId() != null) {
                result.putIfAbsent(delivery.getStaffInvitationId(), toSummary(delivery));
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Map<Long, EmailTrackingSummary> summariesForTeamMembers(List<Long> teamMemberIds) {
        if (teamMemberIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, EmailTrackingSummary> result = new HashMap<>();
        for (InvitationEmailDelivery delivery : deliveryRepository.findByTeamMemberIdInOrderBySentAtDesc(teamMemberIds)) {
            if (delivery.getTeamMemberId() != null) {
                result.putIfAbsent(delivery.getTeamMemberId(), toSummary(delivery));
            }
        }
        return result;
    }

    private EmailTrackingSummary toSummary(InvitationEmailDelivery delivery) {
        return EmailTrackingSummary.builder()
                .openCount(delivery.getOpenCount())
                .openedAt(delivery.getOpenedAt())
                .acceptClickedAt(delivery.getAcceptClickedAt())
                .declineClickedAt(delivery.getDeclineClickedAt())
                .sentAt(delivery.getSentAt())
                .build();
    }

    private InvitationEmailDelivery requireDelivery(String trackingToken) {
        return deliveryRepository
                .findByTrackingToken(trackingToken)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TRACKING_NOT_FOUND"));
    }

    private String generateToken() {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
