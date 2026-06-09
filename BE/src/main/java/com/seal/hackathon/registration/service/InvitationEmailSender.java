package com.seal.hackathon.registration.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.mail.dto.RenderedEmail;
import com.seal.hackathon.mail.enums.EmailTemplateKey;
import com.seal.hackathon.mail.service.InvitationMailComposer;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import jakarta.mail.internet.MimeMessage;

@Component
public class InvitationEmailSender {

    private static final Logger log = LoggerFactory.getLogger(InvitationEmailSender.class);
    private static final DateTimeFormatter VI_DATE =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale.forLanguageTag("vi-VN"));

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;
    private final InvitationMailComposer invitationMailComposer;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:no-reply@seal-hackathon.local}")
    private String fromEmail;

    @Value("${app.mail.invitation-base-url:http://localhost:5173}")
    private String invitationBaseUrl;

    public InvitationEmailSender(
            JavaMailSender mailSender,
            ObjectMapper objectMapper,
            InvitationMailComposer invitationMailComposer) {
        this.mailSender = mailSender;
        this.objectMapper = objectMapper;
        this.invitationMailComposer = invitationMailComposer;
    }

    public void sendStaffFromOutboxPayload(String payload) {
        if (!mailEnabled) {
            log.warn("Mail integration is disabled (MAIL_ENABLED=false), skipping staff invitation email send");
            return;
        }

        try {
            JsonNode root = objectMapper.readTree(payload);
            String recipientEmail = requiredText(root, "email");
            String inviteToken = requiredText(root, "inviteToken");
            String role = requiredText(root, "role");
            Long staffInvitationId = requiredLong(root, "staffInvitationId");
            Long eventId = optionalLong(root, "eventId");
            boolean reminder = root.has("reminder") && root.get("reminder").asBoolean();
            String eventName = optionalText(root, "eventName", "cuộc thi");
            String boardName = optionalText(root, "boardName", "bảng thi");
            String expiresAt = formatExpiresAt(optionalText(root, "inviteExpiresAt", null));
            String roleLabel = "JUDGE".equals(role) ? "Giám khảo" : "Mentor";

            String encodedToken = InvitationTokenCodec.encodeForEmailLink(inviteToken);
            String tokenQuery = URLEncoder.encode(encodedToken, StandardCharsets.UTF_8);
            String acceptUrl = invitationBaseUrl + "/staff-invitations/accept?token=" + tokenQuery;
            String declineUrl = invitationBaseUrl + "/staff-invitations/decline?token=" + tokenQuery;

            Map<String, Object> variables = new LinkedHashMap<>();
            variables.put("eventName", eventName);
            variables.put("boardName", boardName);
            variables.put("roleLabel", roleLabel);
            variables.put("expiresAt", expiresAt);

            EmailTemplateKey templateKey = reminder ? EmailTemplateKey.STAFF_REMINDER : EmailTemplateKey.STAFF_INVITATION;
            RenderedEmail rendered = invitationMailComposer.composeStaff(
                    eventId, templateKey, variables, staffInvitationId, acceptUrl, declineUrl, reminder);
            sendHtml(recipientEmail, rendered.getSubject(), rendered.getHtml());
            log.info("Staff invitation email sent to {} role={} reminder={}", recipientEmail, role, reminder);
        } catch (Exception ex) {
            log.error("Failed to send staff invitation email. payload={}, rootCause={}", payload, rootCauseMessage(ex), ex);
            throw new IllegalStateException("Failed to send staff invitation email from outbox payload", ex);
        }
    }

    public void sendFromOutboxPayload(String payload) {
        if (!mailEnabled) {
            log.warn("Mail integration is disabled (MAIL_ENABLED=false), skipping invitation email send");
            return;
        }

        try {
            JsonNode root = objectMapper.readTree(payload);
            String recipientEmail = requiredText(root, "email");
            String inviteToken = requiredText(root, "inviteToken");
            Long teamMemberId = requiredLong(root, "teamMemberId");
            Long eventId = optionalLong(root, "eventId");
            boolean reminder = root.has("reminder") && root.get("reminder").asBoolean();
            String teamName = optionalText(root, "teamName", "đội thi");
            String eventName = optionalText(root, "eventName", "cuộc thi");
            String expiresAt = formatExpiresAt(optionalText(root, "inviteExpiresAt", null));

            String encodedToken = InvitationTokenCodec.encodeForEmailLink(inviteToken);
            String tokenQuery = URLEncoder.encode(encodedToken, StandardCharsets.UTF_8);
            String acceptUrl = invitationBaseUrl + "/team-invitations/accept?token=" + tokenQuery;
            String declineUrl = invitationBaseUrl + "/team-invitations/decline?token=" + tokenQuery;

            Map<String, Object> variables = new LinkedHashMap<>();
            variables.put("teamName", teamName);
            variables.put("eventName", eventName);
            variables.put("expiresAt", expiresAt);

            EmailTemplateKey templateKey = reminder ? EmailTemplateKey.TEAM_REMINDER : EmailTemplateKey.TEAM_INVITATION;
            RenderedEmail rendered = invitationMailComposer.composeTeam(
                    eventId, templateKey, variables, teamMemberId, acceptUrl, declineUrl, reminder);
            sendHtml(recipientEmail, rendered.getSubject(), rendered.getHtml());
            Long teamId = root.hasNonNull("teamId") ? root.get("teamId").asLong() : null;
            log.info("Invitation email sent to {} team={} member={} reminder={}", recipientEmail, teamId, teamMemberId, reminder);
        } catch (Exception ex) {
            log.error("Failed to send invitation email. payload={}, rootCause={}", payload, rootCauseMessage(ex), ex);
            throw new IllegalStateException("Failed to send invitation email from outbox payload", ex);
        }
    }

    private void sendHtml(String recipientEmail, String subject, String html) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
        helper.setFrom(fromEmail);
        helper.setTo(recipientEmail);
        helper.setSubject(subject);
        helper.setText(html, true);
        mailSender.send(message);
    }

    private String formatExpiresAt(String iso) {
        if (iso == null || iso.isBlank()) {
            return null;
        }
        try {
            return VI_DATE.format(OffsetDateTime.parse(iso));
        } catch (Exception ex) {
            return iso;
        }
    }

    private Long requiredLong(JsonNode root, String fieldName) {
        JsonNode node = root.get(fieldName);
        if (node == null || node.isNull()) {
            throw new IllegalArgumentException("Missing field in invitation payload: " + fieldName);
        }
        return node.asLong();
    }

    private Long optionalLong(JsonNode root, String fieldName) {
        JsonNode node = root.get(fieldName);
        if (node == null || node.isNull()) {
            return null;
        }
        return node.asLong();
    }

    private String requiredText(JsonNode root, String fieldName) {
        JsonNode node = root.get(fieldName);
        if (node == null || node.isNull()) {
            throw new IllegalArgumentException("Missing field in invitation payload: " + fieldName);
        }
        String value = node.asText();
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Empty field in invitation payload: " + fieldName);
        }
        return value;
    }

    private String optionalText(JsonNode root, String fieldName, String fallback) {
        JsonNode node = root.get(fieldName);
        if (node == null || node.isNull()) {
            return fallback;
        }
        String value = node.asText();
        return value == null || value.isBlank() ? fallback : value;
    }

    private String rootCauseMessage(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }
        String message = current.getMessage();
        return message == null || message.isBlank()
                ? current.getClass().getName()
                : current.getClass().getName() + ": " + message;
    }
}
