package com.seal.hackathon.support;

import com.seal.hackathon.notification.repository.AnnouncementRepository;
import com.seal.hackathon.notification.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** Clears dependent messaging data for integration tests. */
@Component
public class IntegrationTestDataCleaner {

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    AnnouncementRepository announcementRepository;

    public void clearNotifications() {
        notificationRepository.deleteAll();
    }

    /** Clears notifications and announcements before event rows are deleted. */
    public void clearEventMessaging() {
        notificationRepository.deleteAll();
        announcementRepository.deleteAll();
    }
}
