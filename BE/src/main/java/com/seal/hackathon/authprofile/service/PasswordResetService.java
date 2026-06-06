package com.seal.hackathon.authprofile.service;

import com.seal.hackathon.authprofile.dto.ForgotPasswordRequest;
import com.seal.hackathon.authprofile.dto.MessageResponse;
import com.seal.hackathon.authprofile.dto.ResetPasswordRequest;
import com.seal.hackathon.authprofile.entity.PasswordResetToken;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.repository.PasswordResetTokenRepository;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.security.AuthCredentialPolicy;
import com.seal.hackathon.common.enums.UserStatus;
import com.seal.hackathon.registration.service.InvitationTokenCodec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PasswordResetService {

    private static final String GENERIC_FORGOT_MESSAGE =
            "Nếu email đã đăng ký, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.";

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordResetEmailSender passwordResetEmailSender;
    private final PasswordEncoder passwordEncoder;
    private final long resetExpirationMinutes;
    private final boolean devAuthEnabled;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordResetEmailSender passwordResetEmailSender,
            PasswordEncoder passwordEncoder,
            @Value("${app.auth.password-reset-expiration-minutes:60}") long resetExpirationMinutes,
            @Value("${app.auth.dev-auth-enabled:false}") boolean devAuthEnabled) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordResetEmailSender = passwordResetEmailSender;
        this.passwordEncoder = passwordEncoder;
        this.resetExpirationMinutes = resetExpirationMinutes;
        this.devAuthEnabled = devAuthEnabled;
    }

    @Transactional
    public MessageResponse requestPasswordReset(ForgotPasswordRequest request) {
        String email = normalizeEmailNullable(request.getEmail());
        if (email == null) {
            return MessageResponse.builder().message(GENERIC_FORGOT_MESSAGE).build();
        }

        String[] devResetUrl = new String[1];

        userRepository.findByEmail(email).ifPresent(user -> {
            if (user.getStatus() == UserStatus.DISABLED) {
                return;
            }
            devResetUrl[0] = issueResetToken(user);
        });

        return MessageResponse.builder()
                .message(GENERIC_FORGOT_MESSAGE)
                .devResetUrl(devResetUrl[0])
                .build();
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        String rawToken = normalizeIncomingToken(request.getToken());
        String tokenHash = hashToken(rawToken);

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenHashAndUsedAtIsNull(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN"));

        if (resetToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "RESET_TOKEN_EXPIRED");
        }

        User user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN"));

        if (user.getStatus() == UserStatus.DISABLED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is disabled");
        }

        AuthCredentialPolicy.assertPassword(request.getNewPassword());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(OffsetDateTime.now());
        userRepository.save(user);

        resetToken.setUsedAt(OffsetDateTime.now());
        passwordResetTokenRepository.save(resetToken);

        return MessageResponse.builder()
                .message("Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.")
                .build();
    }

    private String issueResetToken(User user) {
        passwordResetTokenRepository.deleteByUserId(user.getId());

        String rawToken = generateRawToken();
        String tokenHash = hashToken(rawToken);
        OffsetDateTime now = OffsetDateTime.now();

        passwordResetTokenRepository.save(PasswordResetToken.builder()
                .userId(user.getId())
                .tokenHash(tokenHash)
                .expiresAt(now.plusMinutes(resetExpirationMinutes))
                .createdAt(now)
                .build());

        String encodedToken = InvitationTokenCodec.encodeForEmailLink(rawToken);
        String resetUrl = passwordResetEmailSender.buildPasswordResetUrl(encodedToken);
        passwordResetEmailSender.sendPasswordResetEmail(user.getEmail(), encodedToken);

        if (!passwordResetEmailSender.isMailEnabled() && devAuthEnabled) {
            return resetUrl;
        }
        return null;
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String normalizeIncomingToken(String token) {
        if (!StringUtils.hasText(token)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN");
        }
        try {
            return InvitationTokenCodec.normalizeIncomingToken(token.trim());
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN");
        }
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(hashed.length * 2);
            for (byte value : hashed) {
                builder.append(String.format("%02x", value));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }

    private String normalizeEmailNullable(String email) {
        if (!StringUtils.hasText(email)) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
