package com.seal.hackathon.github.webhook;

import java.nio.charset.StandardCharsets;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class GitHubWebhookSignatureVerifier {

    private static final String HMAC_SHA256 = "HmacSHA256";

    public boolean isValid(String payload, String signatureHeader, String secret) {
        if (!StringUtils.hasText(secret)) {
            return false;
        }
        if (!StringUtils.hasText(signatureHeader) || !StringUtils.hasText(payload)) {
            return false;
        }
        String expected = "sha256=" + hmacSha256Hex(payload, secret);
        return constantTimeEquals(expected, signatureHeader.trim());
    }

    private static String hmacSha256Hex(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return toHex(digest);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to compute GitHub webhook signature", ex);
        }
    }

    private static String toHex(byte[] bytes) {
        StringBuilder builder = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) {
            builder.append(String.format("%02x", value));
        }
        return builder.toString();
    }

    private static boolean constantTimeEquals(String left, String right) {
        if (left.length() != right.length()) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < left.length(); i++) {
            result |= left.charAt(i) ^ right.charAt(i);
        }
        return result == 0;
    }
}
