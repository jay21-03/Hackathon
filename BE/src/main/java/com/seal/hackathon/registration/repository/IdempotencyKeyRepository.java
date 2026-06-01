package com.seal.hackathon.registration.repository;

import com.seal.hackathon.registration.entity.IdempotencyKey;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IdempotencyKeyRepository extends JpaRepository<IdempotencyKey, Long> {
    Optional<IdempotencyKey> findByKeyAndUserIdAndRequestMethodAndRequestPath(
            String key,
            Long userId,
            String requestMethod,
            String requestPath);
}
