package com.seal.hackathon.authprofile.security;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Component
public class EmailDomainPolicy {

    private final Set<String> allowedEmailDomains;

    public EmailDomainPolicy(@Value("${app.auth.allowed-email-domains:}") String allowedEmailDomainsRaw) {
        this.allowedEmailDomains = parseAllowedDomains(allowedEmailDomainsRaw);
    }

    public void assertAllowed(String email) {
        if (!isAllowed(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email domain is not allowed");
        }
    }

    public boolean isAllowed(String email) {
        if (!StringUtils.hasText(email)) {
            return false;
        }
        int atIndex = email.lastIndexOf('@');
        if (atIndex <= 0 || atIndex == email.length() - 1) {
            return false;
        }
        if (allowedEmailDomains.isEmpty()) {
            return true;
        }
        String domain = email.substring(atIndex + 1).toLowerCase(Locale.ROOT);
        return allowedEmailDomains.contains(domain);
    }

    private Set<String> parseAllowedDomains(String rawDomains) {
        LinkedHashSet<String> domains = new LinkedHashSet<>();
        if (!StringUtils.hasText(rawDomains)) {
            return domains;
        }
        Arrays.stream(rawDomains.split(","))
                .map(String::trim)
                .map(this::normalizeDomainNullable)
                .filter(StringUtils::hasText)
                .forEach(domains::add);
        return domains;
    }

    private String normalizeDomainNullable(String domain) {
        if (!StringUtils.hasText(domain)) {
            return null;
        }
        return domain.trim().toLowerCase(Locale.ROOT);
    }
}
