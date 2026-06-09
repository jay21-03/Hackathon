package com.seal.hackathon.common.idempotency;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.common.exception.BusinessException;
import com.seal.hackathon.registration.entity.IdempotencyKey;
import com.seal.hackathon.registration.repository.IdempotencyKeyRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Supplier;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class IdempotencyExecutor {

    private final IdempotencyKeyRepository idempotencyKeyRepository;
    private final ObjectMapper objectMapper;

    public <T> T execute(
            Long userId,
            String idempotencyKey,
            String method,
            String requestPath,
            Object requestBody,
            Class<T> responseType,
            Supplier<T> action) {
        String normalizedKey = normalizeIdempotencyKey(idempotencyKey);
        if (normalizedKey == null) {
            return action.get();
        }

        String requestHash = hashRequest(requestBody);
        Optional<IdempotencyKey> existing = idempotencyKeyRepository.findByKeyAndUserIdAndRequestMethodAndRequestPath(
                normalizedKey, userId, method, requestPath);
        if (existing.isPresent() && existing.get().getResponseBody() != null) {
            verifySameRequest(existing.get(), requestHash);
            return readStoredResponse(existing.get(), responseType);
        }
        if (existing.isPresent()
                && existing.get().getRequestHash() != null
                && !Objects.equals(existing.get().getRequestHash(), requestHash)) {
            throw new BusinessException("Idempotency key already used for a different request");
        }

        IdempotencyKey reservation = IdempotencyKey.builder()
                .key(normalizedKey)
                .userId(userId)
                .requestMethod(method)
                .requestPath(requestPath)
                .requestHash(requestHash)
                .createdAt(OffsetDateTime.now())
                .expiresAt(OffsetDateTime.now().plusHours(24))
                .build();

        try {
            idempotencyKeyRepository.saveAndFlush(reservation);
        } catch (DataIntegrityViolationException ex) {
            IdempotencyKey stored = idempotencyKeyRepository
                    .findByKeyAndUserIdAndRequestMethodAndRequestPath(normalizedKey, userId, method, requestPath)
                    .orElseThrow(() -> new BusinessException("Duplicate request in progress"));
            if (stored.getResponseBody() != null) {
                verifySameRequest(stored, requestHash);
                return readStoredResponse(stored, responseType);
            }
            throw new BusinessException("Duplicate request in progress");
        }

        T response = action.get();
        reservation.setResponseCode(200);
        reservation.setResponseBody(writeStoredResponse(response));
        idempotencyKeyRepository.save(reservation);
        return response;
    }

    private String normalizeIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null) {
            return null;
        }
        String normalized = idempotencyKey.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String hashRequest(Object requestBody) {
        try {
            String json = requestBody == null ? "" : objectMapper.writeValueAsString(requestBody);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(json.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (JsonProcessingException | NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Failed to calculate idempotency hash", ex);
        }
    }

    private void verifySameRequest(IdempotencyKey stored, String requestHash) {
        if (stored.getRequestHash() != null && !Objects.equals(stored.getRequestHash(), requestHash)) {
            throw new BusinessException("Idempotency key already used for a different request");
        }
    }

    private <T> T readStoredResponse(IdempotencyKey stored, Class<T> responseType) {
        try {
            return objectMapper.readValue(stored.getResponseBody(), responseType);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to deserialize idempotency response", ex);
        }
    }

    private String writeStoredResponse(Object response) {
        try {
            return objectMapper.writeValueAsString(response);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize idempotency response", ex);
        }
    }
}
