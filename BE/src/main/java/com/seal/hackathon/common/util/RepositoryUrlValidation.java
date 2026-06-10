package com.seal.hackathon.common.util;

import java.net.URI;
import java.util.Locale;
import org.springframework.util.StringUtils;

public final class RepositoryUrlValidation {

    private RepositoryUrlValidation() {}

    public static boolean isValid(String url) {
        if (!StringUtils.hasText(url)) {
            return true;
        }
        try {
            URI uri = URI.create(url.trim());
            String host = uri.getHost();
            if (host == null) {
                return false;
            }
            String lower = host.toLowerCase(Locale.ROOT);
            boolean allowed = lower.equals("github.com")
                    || lower.endsWith(".github.com")
                    || lower.equals("gitlab.com")
                    || lower.endsWith(".gitlab.com");
            if (!allowed) {
                return false;
            }
            return StringUtils.hasText(uri.getPath()) && !"/".equals(uri.getPath());
        } catch (Exception ex) {
            return false;
        }
    }
}
