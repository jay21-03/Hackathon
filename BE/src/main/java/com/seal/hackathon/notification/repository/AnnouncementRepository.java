package com.seal.hackathon.notification.repository;

import com.seal.hackathon.notification.entity.Announcement;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findByEventIdOrderByPublishedAtDescCreatedAtDesc(Long eventId);

    List<Announcement> findByEventIdAndPublishedAtIsNotNullOrderByPublishedAtDesc(Long eventId);
}
