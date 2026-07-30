package com.seal.hackathon.common.util;

import java.net.URI;
import java.net.URISyntaxException;
import org.springframework.util.StringUtils;

public final class HttpUrlValidation {

    private HttpUrlValidation() {}

    public static boolean isOptionalHttpUrl(String value) {
        if (!StringUtils.hasText(value)) {
            return true;
        }
        return isHttpUrl(value.trim());
    }

    public static boolean isOptionalProblemAttachmentUrl(String value) {
        if (!StringUtils.hasText(value)) {
            return true;
        }
        String normalized = value.trim();
        return normalized.startsWith("/api/v1/files/") || isHttpUrl(normalized);
    }

    private static boolean isHttpUrl(String value) {
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme();
            if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
                return false;
            }
            return StringUtils.hasText(uri.getHost());
        } catch (URISyntaxException ex) {
            return false;
        }
    }
}
