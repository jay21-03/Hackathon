package com.seal.hackathon.notification.dto;

import com.seal.hackathon.common.enums.AnnouncementAudience;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AnnouncementResponse {
    Long id;
    Long eventId;
    String eventName;
    String title;
    String content;
    OffsetDateTime publishedAt;
    Long createdBy;
    OffsetDateTime createdAt;
    AnnouncementAudience audience;
    int recipientCount;
}
