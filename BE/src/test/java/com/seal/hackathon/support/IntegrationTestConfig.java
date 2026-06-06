package com.seal.hackathon.support;

import org.springframework.test.context.DynamicPropertyRegistry;

/** Shared overrides for Testcontainers integration tests. */
public final class IntegrationTestConfig {

    private IntegrationTestConfig() {}

    public static void registerPostgres(DynamicPropertyRegistry registry, String jdbcUrl, String username, String password) {
        registry.add("spring.datasource.url", () -> jdbcUrl);
        registry.add("spring.datasource.username", () -> username);
        registry.add("spring.datasource.password", () -> password);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.flyway.locations", () -> "classpath:db/migration");
        registry.add("app.jwt.secret", () -> "integration-test-secret-which-is-long-enough-for-hs256");
        registry.add("app.jwt.expiration-minutes", () -> "1440");
        registry.add("app.auth.google-client-id", () -> "integration-test-google-client-id");
        registry.add("app.invitation.token-secret", () -> "integration-invite-secret-which-is-long-enough");
        registry.add("app.mail.enabled", () -> "false");
        registry.add("app.mail.from", () -> "test@seal-hackathon.local");
        registry.add("spring.mail.host", () -> "localhost");
        registry.add("spring.mail.port", () -> "3025");
    }
}
