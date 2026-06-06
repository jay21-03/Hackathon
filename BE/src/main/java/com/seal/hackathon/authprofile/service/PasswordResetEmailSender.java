package com.seal.hackathon.authprofile.service;

import jakarta.mail.internet.MimeMessage;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
public class PasswordResetEmailSender {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetEmailSender.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:no-reply@seal-hackathon.local}")
    private String fromEmail;

    @Value("${app.mail.invitation-base-url:http://localhost:5173}")
    private String appBaseUrl;

    public PasswordResetEmailSender(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public String buildPasswordResetUrl(String encodedToken) {
        return appBaseUrl + "/login/reset-password?token="
                + URLEncoder.encode(encodedToken, StandardCharsets.UTF_8);
    }

    public boolean isMailEnabled() {
        return mailEnabled;
    }

    public void sendPasswordResetEmail(String recipientEmail, String encodedToken) {
        String resetUrl = buildPasswordResetUrl(encodedToken);

        if (!mailEnabled) {
            log.warn(
                    "Mail integration is disabled (MAIL_ENABLED=false). Password reset link for {}: {}",
                    recipientEmail,
                    resetUrl);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(fromEmail);
            helper.setTo(recipientEmail);
            helper.setSubject("[SEAL Hackathon] Đặt lại mật khẩu");
            helper.setText(buildEmailHtmlBody(resetUrl), true);
            mailSender.send(message);
            log.info("Password reset email sent to {}", recipientEmail);
        } catch (Exception ex) {
            log.error("Failed to send password reset email to {}", recipientEmail, ex);
            throw new IllegalStateException("Failed to send password reset email", ex);
        }
    }

    private String buildEmailHtmlBody(String resetUrl) {
        return """
                <!doctype html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Đặt lại mật khẩu - SEAL Hackathon</title>
                </head>
                <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:24px 12px;">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="620" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
                                    <tr>
                                        <td style="background:linear-gradient(135deg,#0f766e,#155e75);padding:24px 28px;color:#ffffff;">
                                            <h1 style="margin:0;font-size:24px;line-height:1.3;">Đặt lại mật khẩu</h1>
                                            <p style="margin:8px 0 0 0;font-size:14px;opacity:0.95;">SEAL Hackathon Management System</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:24px 28px;font-size:15px;line-height:1.7;">
                                            <p style="margin:0 0 12px 0;">Xin chào,</p>
                                            <p style="margin:0 0 16px 0;">Bạn vừa yêu cầu đặt lại mật khẩu. Nhấn nút bên dưới để chọn mật khẩu mới. Liên kết có hiệu lực trong <strong>60 phút</strong>.</p>
                                            <a href="__RESET_URL__" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;">Đặt lại mật khẩu</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:0 28px 24px 28px;font-size:13px;line-height:1.7;color:#4b5563;">
                                            <p style="margin:0;word-break:break-all;">Nếu nút không hoạt động, sao chép liên kết: <a href="__RESET_URL__">__RESET_URL__</a></p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:16px 28px 22px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.6;">
                                            Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """
                .replace("__RESET_URL__", escapeHtml(resetUrl));
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
}
