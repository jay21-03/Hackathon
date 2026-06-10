package com.seal.hackathon.notification.repository;

import com.seal.hackathon.common.enums.NotificationType;
import com.seal.hackathon.notification.entity.Notification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByEmailIgnoreCaseOrderByCreatedAtDesc(String email);

    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    List<Notification> findByEmailIgnoreCaseAndIsReadFalseOrderByCreatedAtDesc(String email);

    Optional<Notification> findByDedupeKey(String dedupeKey);

    boolean existsByDedupeKey(String dedupeKey);

    long countByUserIdAndIsReadFalse(Long userId);

    long countByEmailIgnoreCaseAndIsReadFalse(String email);

    @Query("""
            SELECT n FROM Notification n
            WHERE (n.userId = :userId OR LOWER(n.email) = LOWER(:email))
            AND (:type IS NULL OR n.notificationType = :type)
            ORDER BY n.createdAt DESC
            """)
    Page<Notification> findPageForUser(
            @Param("userId") Long userId,
            @Param("email") String email,
            @Param("type") NotificationType type,
            Pageable pageable);

    @Query("""
            SELECT COUNT(n) FROM Notification n
            WHERE (n.userId = :userId OR LOWER(n.email) = LOWER(:email))
            AND (:type IS NULL OR n.notificationType = :type)
            """)
    long countForUser(
            @Param("userId") Long userId,
            @Param("email") String email,
            @Param("type") NotificationType type);

    @Query("""
            SELECT COUNT(n) FROM Notification n
            WHERE (n.userId = :userId OR LOWER(n.email) = LOWER(:email))
            AND n.isRead = false
            """)
    long countUnreadForUser(@Param("userId") Long userId, @Param("email") String email);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Notification n
            SET n.userId = :userId
            WHERE LOWER(n.email) = LOWER(:email)
              AND n.userId IS NULL
            """)
    int backfillUserIdByEmail(@Param("userId") Long userId, @Param("email") String email);
}
