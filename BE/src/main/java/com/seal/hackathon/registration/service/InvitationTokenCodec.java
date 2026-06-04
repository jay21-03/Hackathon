package com.seal.hackathon.registration.service;

import com.seal.hackathon.common.exception.BusinessException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Normalizes invitation tokens from email links (plain or Base64url-wrapped) and parses payload segments.
 */
public final class InvitationTokenCodec {

    private InvitationTokenCodec() {
    }

    public static String normalizeIncomingToken(String token) {
        if (token == null || token.isBlank()) {
            throw new BusinessException("Invitation token is required");
        }
        String trimmed = token.trim();
        if (trimmed.contains(".")) {
            return trimmed;
        }
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(trimmed);
            return new String(decoded, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Invalid invitation token");
        }
    }

    public static String encodeForEmailLink(String invitationToken) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(invitationToken.getBytes(StandardCharsets.UTF_8));
    }

    public static InvitationTokenParts parse(String token) {
        String normalized = normalizeIncomingToken(token);
        String[] segments = normalized.split("\\.", 3);
        if (segments.length != 4) {
            throw new BusinessException("Invalid invitation token");
        }
        try {
            return new InvitationTokenParts(
                    Long.parseLong(segments[0]),
                    Long.parseLong(segments[1]),
                    segments[2],
                    segments[3]);
        } catch (NumberFormatException ex) {
            throw new BusinessException("Invalid invitation token");
        }
    }

    public record InvitationTokenParts(Long teamId, Long teamMemberId, String nonce, String rawToken) {
    }
}
