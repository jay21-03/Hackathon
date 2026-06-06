package com.seal.hackathon.notification.repository;

import com.seal.hackathon.notification.entity.Notification;
import java.util.List;
import java.util.Optional;
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

    @Modifying
    @Query("UPDATE Notification n SET n.userId = :userId WHERE n.email = :email AND n.userId IS NULL")
    int backfillUserIdByEmail(@Param("userId") Long userId, @Param("email") String email);
}
