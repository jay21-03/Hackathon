package com.seal.hackathon.authprofile.security;

import com.seal.hackathon.authprofile.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.Date;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMinutes;

    public JwtService(
            @Value("${app.jwt.secret}") String rawSecret,
            @Value("${app.jwt.expiration-minutes}") long expirationMinutes) {
        this.signingKey = buildSigningKey(rawSecret);
        this.expirationMinutes = expirationMinutes;
    }

    public String generateToken(User user, Set<String> roles) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(expirationMinutes, ChronoUnit.MINUTES);
        List<String> normalizedRoles = roles.stream().toList();

        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("roles", normalizedRoles)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long getExpirationSeconds() {
        return expirationMinutes * 60L;
    }

    public Long extractUserId(Claims claims) {
        String subject = claims.getSubject();
        return Long.parseLong(subject);
    }

    public Set<String> extractRoles(Claims claims) {
        Object rawRoles = claims.get("roles");
        LinkedHashSet<String> roles = new LinkedHashSet<>();

        if (rawRoles instanceof Collection<?> collection) {
            for (Object role : collection) {
                if (role != null) {
                    roles.add(role.toString());
                }
            }
        } else if (rawRoles instanceof String singleRole) {
            roles.add(singleRole);
        }
        return roles;
    }

    private SecretKey buildSigningKey(String rawSecret) {
        byte[] secretBytes = rawSecret == null
                ? new byte[0]
                : rawSecret.trim().getBytes(StandardCharsets.UTF_8);
        byte[] keyMaterial = secretBytes;

        if (secretBytes.length < 32) {
            keyMaterial = sha256(secretBytes);
            log.warn(
                    "JWT secret is shorter than 32 bytes; deriving a SHA-256 key for HS256. Set a stronger JWT_SECRET in production.");
        }

        return Keys.hmacShaKeyFor(keyMaterial);
    }

    private byte[] sha256(byte[] input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return digest.digest(input);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
