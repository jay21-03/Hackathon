package com.seal.hackathon.notification.repository;

import com.seal.hackathon.notification.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
}
