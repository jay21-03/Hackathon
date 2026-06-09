package com.seal.hackathon.common.security;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public final class InvitationTokenCrypto {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private InvitationTokenCrypto() {}

    public static String generateRawToken() {
        byte[] buffer = new byte[32];
        SECURE_RANDOM.nextBytes(buffer);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
    }

    public static String generateNonce() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    public static String buildToken(Long entityAId, Long entityBId, String nonce, String rawToken) {
        return entityAId + "." + entityBId + "." + nonce + "." + rawToken;
    }

    public static String hashToken(String tokenSecret, Long entityAId, Long entityBId, String nonce, String rawToken) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(tokenSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            String payload = entityAId + ":" + entityBId + ":" + nonce + ":" + rawToken;
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to generate invitation token hash", ex);
        }
    }

    public static String escapeJson(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
