package com.seal.hackathon.authprofile.security;

import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

public final class AuthCredentialPolicy {

    private static final Pattern USERNAME_PATTERN =
            Pattern.compile("^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$");

    private AuthCredentialPolicy() {}

    public static void assertUsername(String username) {
        String normalized = normalizeUsername(username);
        if (normalized == null || normalized.length() < 3 || normalized.length() > 39) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "USERNAME_INVALID");
        }
        if (!USERNAME_PATTERN.matcher(normalized).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "USERNAME_INVALID");
        }
    }

    public static String normalizeUsername(String username) {
        if (!StringUtils.hasText(username)) {
            return null;
        }
        return username.trim();
    }

    public static void assertPassword(String password) {
        if (!StringUtils.hasText(password)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PASSWORD_REQUIRED");
        }
        if (password.length() >= 15) {
            return;
        }
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        if (password.length() >= 8 && hasLower && hasDigit) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PASSWORD_WEAK");
    }
}
