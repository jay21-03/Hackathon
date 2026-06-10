package com.seal.hackathon.github.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import io.jsonwebtoken.Jwts;

@Service
public class GitHubAuthService {

    private static final long INSTALLATION_TOKEN_SKEW_SECONDS = 120;

    private final String mode;
    private final String pat;
    private final long appId;
    private final long installationId;
    private final PrivateKey appPrivateKey;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final AtomicReference<CachedToken> cachedInstallationToken = new AtomicReference<>();

    public GitHubAuthService(
            @Value("${app.github.mode:pat}") String mode,
            @Value("${app.github.pat:}") String pat,
            @Value("${app.github.app-id:0}") long appId,
            @Value("${app.github.app-installation-id:0}") long installationId,
            @Value("${app.github.app-private-key:}") String appPrivateKeyInline,
            @Value("${app.github.app-private-key-path:}") String appPrivateKeyPath,
            @Value("${app.github.api-base-url:https://api.github.com}") String apiBaseUrl,
            @Value("${app.github.api-version:2026-03-10}") String apiVersion,
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper) {
        this.mode = mode == null ? "pat" : mode.trim().toLowerCase();
        this.pat = pat;
        this.appId = appId;
        this.installationId = installationId;
        this.objectMapper = objectMapper;
        this.appPrivateKey = resolveAppPrivateKey(appPrivateKeyInline, appPrivateKeyPath);
        this.restClient = restClientBuilder
                .baseUrl(stripTrailingSlash(apiBaseUrl))
                .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github+json")
                .defaultHeader("X-GitHub-Api-Version", normalizeApiVersion(apiVersion))
                .build();
    }

    public String getBearerToken() {
        if ("pat".equals(mode)) {
            if (!StringUtils.hasText(pat)) {
                throw new GitHubClientException(503, "GitHub PAT is not configured");
            }
            return pat.trim();
        }
        if ("app".equals(mode)) {
            return getInstallationAccessToken();
        }
        throw new GitHubClientException(503, "Unsupported GITHUB_MODE: " + mode);
    }

    public boolean isPatMode() {
        return "pat".equals(mode);
    }

    public boolean isAppMode() {
        return "app".equals(mode);
    }

    private String getInstallationAccessToken() {
        ensureAppConfigured();
        CachedToken cached = cachedInstallationToken.get();
        Instant now = Instant.now();
        if (cached != null && cached.expiresAt().isAfter(now.plusSeconds(INSTALLATION_TOKEN_SKEW_SECONDS))) {
            return cached.token();
        }

        String appJwt = createAppJwt(now);
        try {
            String responseBody = restClient.post()
                    .uri("/app/installations/{installationId}/access_tokens", installationId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + appJwt)
                    .contentType(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(String.class);
            JsonNode root = objectMapper.readTree(responseBody == null ? "{}" : responseBody);
            String token = root.path("token").asText(null);
            if (!StringUtils.hasText(token)) {
                throw new GitHubClientException(503, "GitHub App installation token response was empty");
            }
            Instant expiresAt = parseExpiresAt(root.path("expires_at").asText(null), now);
            cachedInstallationToken.set(new CachedToken(token, expiresAt));
            return token;
        } catch (RestClientResponseException ex) {
            throw new GitHubClientException(
                    ex.getStatusCode().value(),
                    "Failed to obtain GitHub App installation token");
        } catch (RestClientException | IOException ex) {
            throw new GitHubClientException(503, "Failed to obtain GitHub App installation token");
        }
    }

    private String createAppJwt(Instant now) {
        Instant expiresAt = now.plusSeconds(540);
        return Jwts.builder()
                .issuer(String.valueOf(appId))
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(appPrivateKey)
                .compact();
    }

    private void ensureAppConfigured() {
        if (appId <= 0) {
            throw new GitHubClientException(503, "GITHUB_APP_ID is not configured");
        }
        if (installationId <= 0) {
            throw new GitHubClientException(503, "GITHUB_APP_INSTALLATION_ID is not configured");
        }
        if (appPrivateKey == null) {
            throw new GitHubClientException(503, "GitHub App private key is not configured");
        }
    }

    private PrivateKey resolveAppPrivateKey(String inline, String path) {
        String pem = null;
        if (StringUtils.hasText(inline)) {
            pem = inline.replace("\\n", "\n").trim();
        } else if (StringUtils.hasText(path)) {
            try {
                pem = Files.readString(Path.of(path.trim()));
            } catch (IOException ex) {
                throw new IllegalStateException("Cannot read GITHUB_APP_PRIVATE_KEY_PATH: " + path, ex);
            }
        }
        if (!StringUtils.hasText(pem)) {
            return null;
        }
        return loadPkcs8PrivateKey(pem);
    }

    private PrivateKey loadPkcs8PrivateKey(String pem) {
        if (pem.contains("BEGIN RSA PRIVATE KEY")) {
            throw new IllegalStateException(
                    "GitHub App private key must be PKCS#8 PEM. Convert with: "
                            + "openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in app.pem -out app-pkcs8.pem");
        }
        String normalized = pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        try {
            byte[] decoded = Base64.getDecoder().decode(normalized);
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);
            return KeyFactory.getInstance("RSA").generatePrivate(spec);
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid GitHub App private key PEM", ex);
        }
    }

    private Instant parseExpiresAt(String value, Instant fallback) {
        if (!StringUtils.hasText(value)) {
            return fallback.plusSeconds(3600);
        }
        try {
            return Instant.parse(value);
        } catch (Exception ex) {
            return fallback.plusSeconds(3600);
        }
    }

    private String stripTrailingSlash(String value) {
        if (!StringUtils.hasText(value)) {
            return "https://api.github.com";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String normalizeApiVersion(String value) {
        return StringUtils.hasText(value) ? value.trim() : "2026-03-10";
    }

    private record CachedToken(String token, Instant expiresAt) {}
}
