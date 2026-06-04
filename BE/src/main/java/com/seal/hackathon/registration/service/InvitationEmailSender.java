package com.seal.hackathon.registration.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
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

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:no-reply@seal-hackathon.local}")
    private String fromEmail;

    @Value("${app.mail.invitation-base-url:http://localhost:5173}")
    private String invitationBaseUrl;

    public InvitationEmailSender(JavaMailSender mailSender, ObjectMapper objectMapper) {
        this.mailSender = mailSender;
        this.objectMapper = objectMapper;
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
            String teamId = requiredText(root, "teamId");
            String teamMemberId = requiredText(root, "teamMemberId");

            String encodedToken = InvitationTokenCodec.encodeForEmailLink(inviteToken);
            String tokenQuery = URLEncoder.encode(encodedToken, StandardCharsets.UTF_8);
            String acceptUrl = invitationBaseUrl + "/team-invitations/accept?token=" + tokenQuery;
            String declineUrl = invitationBaseUrl + "/team-invitations/decline?token=" + tokenQuery;

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(fromEmail);
            helper.setTo(recipientEmail);
            helper.setSubject("[SEAL Hackathon] Thư mời tham gia đội thi");
            helper.setText(buildEmailHtmlBody(teamId, teamMemberId, acceptUrl, declineUrl), true);

            mailSender.send(message);
            log.info("Invitation email sent to {} for teamId={}, teamMemberId={}", recipientEmail, teamId, teamMemberId);
        } catch (Exception ex) {
            log.error("Failed to send invitation email. payload={}, rootCause={}", payload, rootCauseMessage(ex), ex);
            throw new IllegalStateException("Failed to send invitation email from outbox payload", ex);
        }
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

        private String buildEmailHtmlBody(String teamId, String teamMemberId, String acceptUrl, String declineUrl) {
            return """
                                <!doctype html>
                                <html lang=\"vi\">
                                <head>
                                    <meta charset=\"UTF-8\" />
                                    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
                                    <title>Thu moi tham gia doi - SEAL Hackathon</title>
                                </head>
                                <body style=\"margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;\">
                                    <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f5f7fb;padding:24px 12px;\">
                                        <tr>
                                            <td align=\"center\">
                                                <table role=\"presentation\" width=\"620\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;\">
                                                    <tr>
                                                        <td style=\"background:linear-gradient(135deg,#0f766e,#155e75);padding:24px 28px;color:#ffffff;\">
                                                              <h1 style=\"margin:0;font-size:24px;line-height:1.3;\">Bạn được mời tham gia đội thi</h1>
                                                            <p style=\"margin:8px 0 0 0;font-size:14px;opacity:0.95;\">SEAL Hackathon Management System</p>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style=\"padding:24px 28px 8px 28px;font-size:15px;line-height:1.7;\">
                                                              <p style=\"margin:0 0 12px 0;\">Xin chào,</p>
                                                              <p style=\"margin:0 0 12px 0;\">Bạn vừa nhận được lời mời vào một đội thi trong hệ thống <strong>SEAL Hackathon</strong>.</p>
                                                            <p style=\"margin:0 0 4px 0;\"><strong>Team ID:</strong> __TEAM_ID__</p>
                                                            <p style=\"margin:0 0 16px 0;\"><strong>Team Member ID:</strong> __TEAM_MEMBER_ID__</p>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style=\"padding:0 28px 24px 28px;\">
                                                            <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\">
                                                                <tr>
                                                                    <td style=\"padding-right:12px;\">
                                                                            <a href="__ACCEPT_URL__" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;">Đồng ý tham gia</a>
                                                                    </td>
                                                                    <td>
                                                                            <a href="__DECLINE_URL__" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;">Từ chối lời mời</a>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style=\"padding:0 28px 24px 28px;font-size:13px;line-height:1.7;color:#4b5563;\">
                                                              <p style=\"margin:0 0 10px 0;\">Nếu các nút trên không hoạt động, bạn có thể sao chép liên kết sau:</p>
                                                              <p style=\"margin:0 0 6px 0;word-break:break-all;\"><strong>Đồng ý:</strong> <a href=\"__ACCEPT_URL__\">__ACCEPT_URL__</a></p>
                                                              <p style=\"margin:0;word-break:break-all;\"><strong>Từ chối:</strong> <a href=\"__DECLINE_URL__\">__DECLINE_URL__</a></p>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style=\"padding:16px 28px 22px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.6;\">
                                                              Đây là email tự động. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </body>
                                </html>
                                """
                .replace("__TEAM_ID__", escapeHtml(teamId))
                .replace("__TEAM_MEMBER_ID__", escapeHtml(teamMemberId))
                .replace("__ACCEPT_URL__", escapeHtml(acceptUrl))
                .replace("__DECLINE_URL__", escapeHtml(declineUrl));
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

                    private String rootCauseMessage(Throwable throwable) {
                        Throwable current = throwable;
                        while (current.getCause() != null && current.getCause() != current) {
                            current = current.getCause();
                        }
                        String message = current.getMessage();
                        return message == null || message.isBlank() ? current.getClass().getName() : current.getClass().getName() + ": " + message;
                    }
}
