package com.seal.hackathon.mail.service;

import com.seal.hackathon.mail.dto.RenderedEmail;
import com.seal.hackathon.mail.entity.InvitationEmailDelivery;
import com.seal.hackathon.mail.enums.EmailTemplateKey;
import com.seal.hackathon.mail.enums.InvitationEmailType;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InvitationMailComposer {

    private final EmailTemplateService emailTemplateService;
    private final EmailTrackingService emailTrackingService;

    public RenderedEmail composeStaff(
            Long eventId,
            EmailTemplateKey templateKey,
            Map<String, Object> baseVariables,
            Long staffInvitationId,
            String rawAcceptUrl,
            String rawDeclineUrl,
            boolean reminder) {
        InvitationEmailDelivery delivery = emailTrackingService.registerSend(
                InvitationEmailType.STAFF,
                staffInvitationId,
                null,
                rawAcceptUrl,
                rawDeclineUrl,
                reminder);
        return renderWithTracking(eventId, templateKey, baseVariables, delivery);
    }

    public RenderedEmail composeTeam(
            Long eventId,
            EmailTemplateKey templateKey,
            Map<String, Object> baseVariables,
            Long teamMemberId,
            String rawAcceptUrl,
            String rawDeclineUrl,
            boolean reminder) {
        InvitationEmailDelivery delivery = emailTrackingService.registerSend(
                InvitationEmailType.TEAM,
                null,
                teamMemberId,
                rawAcceptUrl,
                rawDeclineUrl,
                reminder);
        return renderWithTracking(eventId, templateKey, baseVariables, delivery);
    }

    private RenderedEmail renderWithTracking(
            Long eventId,
            EmailTemplateKey templateKey,
            Map<String, Object> baseVariables,
            InvitationEmailDelivery delivery) {
        Map<String, Object> variables = new LinkedHashMap<>(baseVariables);
        variables.put("acceptUrl", emailTrackingService.trackedAcceptUrl(delivery.getTrackingToken()));
        variables.put("declineUrl", emailTrackingService.trackedDeclineUrl(delivery.getTrackingToken()));
        variables.put("trackingPixelUrl", emailTrackingService.trackingPixelUrl(delivery.getTrackingToken()));
        return emailTemplateService.render(eventId, templateKey, variables);
    }
}
