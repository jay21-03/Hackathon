package com.seal.hackathon.notification.dto;

import com.seal.hackathon.common.enums.NotificationType;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class NotificationResponse {
    Long id;
    Long eventId;
    String eventName;
    NotificationType type;
    String title;
    String content;
    String linkUrl;
    boolean read;
    OffsetDateTime createdAt;
}
