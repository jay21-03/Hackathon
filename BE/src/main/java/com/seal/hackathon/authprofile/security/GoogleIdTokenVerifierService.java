package com.seal.hackathon.authprofile.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
public class GoogleIdTokenVerifierService {

    private static final List<String> VALID_ISSUERS = List.of("https://accounts.google.com", "accounts.google.com");

    private final String googleClientId;
    private final Set<String> allowedEmailDomains;
    private final GoogleIdTokenVerifier verifier;

    public GoogleIdTokenVerifierService(
            @Value("${app.auth.google-client-id:}") String googleClientId,
            @Value("${app.auth.allowed-email-domains:}") String allowedEmailDomainsRaw) {
        this.googleClientId = trimNullable(googleClientId);
        this.allowedEmailDomains = parseAllowedDomains(allowedEmailDomainsRaw);

        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(this.googleClientId))
                .setIssuers(VALID_ISSUERS)
                .build();
    }

    public VerifiedGoogleUser verify(String idTokenString) {
        if (!StringUtils.hasText(googleClientId)) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "GOOGLE_CLIENT_ID is not configured");
        }

        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(idTokenString);
        } catch (GeneralSecurityException | IOException | IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google ID token");
        }

        if (idToken == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google ID token");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String issuer = payload.getIssuer();
        if (!VALID_ISSUERS.contains(issuer)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token issuer");
        }

        Long expiresAt = payload.getExpirationTimeSeconds();
        if (expiresAt == null || expiresAt <= Instant.now().getEpochSecond()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token is expired");
        }

        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google email is not verified");
        }

        String email = normalizeEmailRequired(payload.getEmail(), "Google token email is missing");
        if (!isAllowedDomain(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email domain is not allowed");
        }

        String googleSub = trimRequired(payload.getSubject(), "Google subject is missing");
        String fullName = trimNullable((String) payload.get("name"));
        String avatarUrl = trimNullable((String) payload.get("picture"));

        return VerifiedGoogleUser.builder()
                .googleSub(googleSub)
                .email(email)
                .fullName(fullName)
                .avatarUrl(avatarUrl)
                .build();
    }

    private boolean isAllowedDomain(String email) {
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

        for (String domain : rawDomains.split(",")) {
            String normalized = normalizeDomainNullable(domain);
            if (normalized != null) {
                domains.add(normalized);
            }
        }

        log.info("Loaded {} allowed email domains for Google login", domains.size());
        return domains;
    }

    private String normalizeEmailRequired(String value, String errorMessage) {
        String normalized = normalizeEmailNullable(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, errorMessage);
        }
        return normalized;
    }

    private String trimRequired(String value, String errorMessage) {
        String normalized = trimNullable(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, errorMessage);
        }
        return normalized;
    }

    private String normalizeDomainNullable(String value) {
        String normalized = trimNullable(value);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }

    private String normalizeEmailNullable(String value) {
        String normalized = trimNullable(value);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }

    private String trimNullable(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
