package com.seal.hackathon.notification.dto;

import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class NotificationListResponse {
    List<NotificationResponse> items;
    long unreadCount;
    long total;
    int page;
    int size;
}
