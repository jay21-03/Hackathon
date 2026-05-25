package com.seal.hackathon.notification.repository;

import com.seal.hackathon.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
}
